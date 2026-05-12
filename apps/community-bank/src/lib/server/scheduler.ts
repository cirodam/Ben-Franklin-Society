/**
 * Scheduler — the Frank economy's automatic engine.
 *
 * Jobs:
 *  1. runScheduledTransfers() — execute active scheduled_transfer rows for the current period.
 *  2. runBirthdayIssuance()   — issue 2000 ƒ from CB → Treasury for each member whose birthday is today.
 *  3. runDemurrage()          — monthly: charge accounts above threshold, post proceeds to Treasury.
 *  4. syncMemberAccounts()    — create accounts for new members/associations; freeze revoked members.
 *  5. runAll()                — runs all four in order.
 *
 * All jobs are idempotent — safe to call multiple times per period. Idempotency is tracked
 * in the `scheduler_run` table (UNIQUE on job + period_key).
 */

import { randomUUID } from 'node:crypto';
import { db } from './db.js';
import { syncPersons, syncAssociations, type PersonSyncData } from './governance-api.js';
import { postTransaction } from './ledger.js';
import { createAccount } from './accounts.js';

// ---------------------------------------------------------------------------
// Configuration (from environment, with safe defaults)
// ---------------------------------------------------------------------------

const ISSUANCE_AMOUNT   = 2000; // ƒ per member per birthday (§8 of the Frank bylaws)
const DEMURRAGE_THRESHOLD = parseInt(process.env.DEMURRAGE_THRESHOLD ?? '5000', 10);
const DEMURRAGE_RATE_BPS  = parseInt(process.env.DEMURRAGE_RATE_BPS  ?? '200',  10); // 2%/period

// ---------------------------------------------------------------------------
// Result type
// ---------------------------------------------------------------------------

export interface JobResult {
	executed: number;
	skipped:  number;
	errors:   string[];
}

// ---------------------------------------------------------------------------
// Idempotency helpers
// ---------------------------------------------------------------------------

function alreadyRan(job: string, periodKey: string): boolean {
	return (
		db
			.prepare('SELECT 1 FROM scheduler_run WHERE job = ? AND period_key = ?')
			.get(job, periodKey) !== undefined
	);
}

function markRan(job: string, periodKey: string, result: object = {}): void {
	db
		.prepare(
			`INSERT OR IGNORE INTO scheduler_run (uuid, job, period_key, ran_at, result_json)
       VALUES (?, ?, ?, ?, ?)`
		)
		.run(randomUUID(), job, periodKey, new Date().toISOString(), JSON.stringify(result));
}

// ---------------------------------------------------------------------------
// Period key helpers
// ---------------------------------------------------------------------------

/** Returns 'YYYY-MM' for the given date (UTC). */
function monthKey(d: Date = new Date()): string {
	return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}`;
}

/** Returns 'YYYY-WNN' (ISO week) for the given date (UTC). */
function weekKey(d: Date = new Date()): string {
	const dt   = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
	const day  = dt.getUTCDay() || 7;
	dt.setUTCDate(dt.getUTCDate() + 4 - day);
	const yearStart = new Date(Date.UTC(dt.getUTCFullYear(), 0, 1));
	const weekNo    = Math.ceil((((dt.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
	return `${dt.getUTCFullYear()}-W${String(weekNo).padStart(2, '0')}`;
}

/** Returns 'YYYY-MM-DD' for the given date (UTC). */
function dayKey(d: Date = new Date()): string {
	return d.toISOString().slice(0, 10);
}

/**
 * Maps a scheduled_transfer.schedule string to the current period key.
 *  'monthly' → '2025-04'
 *  'weekly'  → '2025-W17'
 *  'daily'   → '2025-04-23'
 */
function periodKey(schedule: string, d: Date = new Date()): string {
	if (schedule === 'monthly') return monthKey(d);
	if (schedule === 'weekly')  return weekKey(d);
	return dayKey(d);
}

// ---------------------------------------------------------------------------
// Utility: look up special account UUIDs
// ---------------------------------------------------------------------------

function requireAccount(name: string): string {
	const row = db
		.prepare(`SELECT uuid FROM account WHERE name = ? LIMIT 1`)
		.get(name) as { uuid: string } | undefined;
	if (!row) throw new Error(`Required account "${name}" not found — run pnpm seed first.`);
	return row.uuid;
}

// ---------------------------------------------------------------------------
// Job 1 — Run active scheduled transfers
// ---------------------------------------------------------------------------

export function runScheduledTransfers(): JobResult {
	const result: JobResult = { executed: 0, skipped: 0, errors: [] };

	const transfers = db
		.prepare(`SELECT * FROM scheduled_transfer WHERE status = 'active'`)
		.all() as Array<{
			uuid: string;
			name: string;
			from_uuid: string;
			to_uuid: string;
			amount: number;
			type: string;
			schedule: string;
		}>;

	for (const t of transfers) {
		const pk     = periodKey(t.schedule);
		const jobKey = `scheduled-transfer:${t.uuid}`;

		if (alreadyRan(jobKey, pk)) {
			result.skipped++;
			continue;
		}

		try {
			postTransaction({
				from_uuid:               t.from_uuid,
				to_uuid:                 t.to_uuid,
				amount:                  t.amount,
				type:                    t.type,
				source:                  'scheduled',
				scheduled_transfer_uuid: t.uuid,
				memo:                    t.name,
			});
			markRan(jobKey, pk, { amount: t.amount });
			result.executed++;
		} catch (e) {
			result.errors.push(`Transfer ${t.uuid} (${t.name}): ${String(e)}`);
		}
	}

	return result;
}

// ---------------------------------------------------------------------------
// Job 2 — Birthday issuance
// Runs daily. For each active member with today's birthday, issue 2000 ƒ CB → Treasury.
// Idempotency key: 'birthday-issuance:{person_uuid}' + period '{year}'.
// ---------------------------------------------------------------------------

export async function runBirthdayIssuance(): Promise<JobResult> {
	const result: JobResult = { executed: 0, skipped: 0, errors: [] };

	const today    = new Date();
	const year     = String(today.getUTCFullYear());
	const monthDay = `${String(today.getUTCMonth() + 1).padStart(2, '0')}-${String(today.getUTCDate()).padStart(2, '0')}`;

	const cbUuid       = requireAccount('Central Bank');
	const treasuryUuid = requireAccount('Treasury');

	// All active members whose birth month-day matches today.
	const allPersons = await syncPersons();
	const members = allPersons.filter(p => {
		if (p.status === 'revoked') return false;
		// Extract month-day from date_of_birth (YYYY-MM-DD format)
		const birthMonthDay = p.date_of_birth.slice(5); // 'MM-DD'
		return birthMonthDay === monthDay;
	});

	for (const person of members) {
		const jobKey = `birthday-issuance:${person.uuid}`;

		if (alreadyRan(jobKey, year)) {
			result.skipped++;
			continue;
		}

		try {
			postTransaction({
				from_uuid: cbUuid,
				to_uuid:   treasuryUuid,
				amount:    ISSUANCE_AMOUNT,
				type:      'issuance',
				source:    'birthday',
				memo:      `Birthday issuance — ${person.given_name} ${person.family_name}`,
			});
			markRan(jobKey, year, { amount: ISSUANCE_AMOUNT, person_uuid: person.uuid });
			result.executed++;
		} catch (e) {
			result.errors.push(`Birthday issuance for ${person.uuid}: ${String(e)}`);
		}
	}

	return result;
}

// ---------------------------------------------------------------------------
// Job 3 — Monthly demurrage
// Charges all accounts with balance > DEMURRAGE_THRESHOLD on the excess.
// Posts proceeds to Treasury. Runs at most once per calendar month.
// ---------------------------------------------------------------------------

export function runDemurrage(): JobResult {
	const result: JobResult = { executed: 0, skipped: 0, errors: [] };

	const pk = monthKey();
	if (alreadyRan('demurrage', pk)) {
		result.skipped = 1;
		return result;
	}

	const treasuryUuid = requireAccount('Treasury');

	// All accounts above threshold, skipping Central Bank (expected to have a large negative balance).
	const accounts = db
		.prepare(`SELECT uuid, balance FROM account WHERE balance > ? AND name != 'Central Bank'`)
		.all(DEMURRAGE_THRESHOLD) as Array<{ uuid: string; balance: number }>;

	let totalCharged = 0;

	for (const acct of accounts) {
		const excess  = acct.balance - DEMURRAGE_THRESHOLD;
		const charge  = Math.floor(excess * DEMURRAGE_RATE_BPS / 10000);
		if (charge <= 0) continue;

		try {
			postTransaction({
				from_uuid: acct.uuid,
				to_uuid:   treasuryUuid,
				amount:    charge,
				type:      'demurrage',
				source:    'auto',
				memo:      `Demurrage ${pk}: ${DEMURRAGE_RATE_BPS / 100}% on ${excess.toLocaleString()} ƒ above threshold`,
			});
			totalCharged += charge;
			result.executed++;
		} catch (e) {
			result.errors.push(`Demurrage on account ${acct.uuid}: ${String(e)}`);
		}
	}

	markRan('demurrage', pk, {
		accounts_charged: result.executed,
		total_charged:    totalCharged,
		threshold:        DEMURRAGE_THRESHOLD,
		rate_bps:         DEMURRAGE_RATE_BPS,
	});

	return result;
}

// ---------------------------------------------------------------------------
// Job 4 — Sync member accounts
// Creates Primary accounts for any active member or association that lacks one.
// Freezes accounts of revoked members.
// Stateless and idempotent by nature — no scheduler_run entry needed.
// ---------------------------------------------------------------------------

export async function syncMemberAccounts(): Promise<JobResult> {
	const result: JobResult = { executed: 0, skipped: 0, errors: [] };

	// Active persons → ensure Primary account exists.
	const allPersons = await syncPersons();
	const persons = allPersons.filter(p => p.status !== 'revoked');

	for (const p of persons) {
		const exists = db
			.prepare(`SELECT 1 FROM account WHERE principal_uuid = ? AND name = 'Primary'`)
			.get(p.uuid);
		if (exists) { result.skipped++; continue; }

		try {
			createAccount({ principal_uuid: p.uuid, name: 'Primary', handle_cache: p.handle });
			result.executed++;
		} catch (e) {
			result.errors.push(`Create account for person ${p.uuid}: ${String(e)}`);
		}
	}

	// Active associations → ensure Primary account exists.
	const allAssocs = await syncAssociations();
	const assocs = allAssocs.filter(a => a.status === 'active');

	for (const a of assocs) {
		const exists = db
			.prepare(`SELECT 1 FROM account WHERE principal_uuid = ? AND name = 'Primary'`)
			.get(a.uuid);
		if (exists) { result.skipped++; continue; }

		try {
			createAccount({ principal_uuid: a.uuid, name: 'Primary', handle_cache: a.handle });
			result.executed++;
		} catch (e) {
			result.errors.push(`Create account for association ${a.uuid}: ${String(e)}`);
		}
	}

	// Revoked persons → freeze their active bank accounts.
	const revoked = allPersons.filter(p => p.status === 'revoked');

	for (const r of revoked) {
		db
			.prepare(`UPDATE account SET status = 'frozen' WHERE principal_uuid = ? AND status = 'active'`)
			.run(r.uuid);
	}

	return result;
}

// ---------------------------------------------------------------------------
// Run all jobs
// ---------------------------------------------------------------------------

export interface AllJobResults {
	scheduledTransfers: JobResult;
	birthdayIssuance:   JobResult;
	demurrage:          JobResult;
	memberSync:         JobResult;
}

export async function runAll(): Promise<AllJobResults> {
	return {
		scheduledTransfers: runScheduledTransfers(),
		birthdayIssuance:   await runBirthdayIssuance(),
		demurrage:          runDemurrage(),
		memberSync:         await syncMemberAccounts(),
	};
}
