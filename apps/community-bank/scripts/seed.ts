/**
 * Seed the Community Bank database with the special accounts that underpin
 * the Frank economy.  Run with:
 *
 *   DATABASE_PATH=./bank.sqlite \
 *   CENTRAL_BANK_UUID=... \
 *   TREASURY_UUID=... \
 *   SIF_UUID=... \
 *   CLEARINGHOUSE_UUID=... \
 *   tsx scripts/seed.ts
 *
 * The script is idempotent — re-running it is safe.
 *
 * UUIDs should be copied from the governance app's associations.
 */

import { openDatabase } from '@bfs/db';
import { randomUUID } from 'node:crypto';
import { schema } from '../src/lib/server/schema.js';

const bankPath = process.env.DATABASE_PATH ?? './bank.sqlite';

const bankDb = openDatabase(bankPath);

// Apply the schema (idempotent — all CREATE TABLE IF NOT EXISTS).
bankDb.exec(schema);

function now(): string {
	return new Date().toISOString();
}

function ensureAccount(
	principal_uuid: string,
	name: string,
	handle_cache: string,
	account_type: 'standard' | 'official' | 'system' = 'standard',
	can_auto_pull: boolean = false
): void {
	const existing = bankDb
		.prepare('SELECT 1 FROM account WHERE principal_uuid = ? AND name = ?')
		.get(principal_uuid, name);
	if (existing) {
		console.log(`  skip  [${handle_cache}] ${name} — already exists`);
		return;
	}
	bankDb
		.prepare(
			`INSERT INTO account (uuid, principal_uuid, name, handle_cache, balance, status, account_type, can_auto_pull, created_at)
       VALUES (?, ?, ?, ?, 0, 'active', ?, ?, ?)`
		)
		.run(
			randomUUID(),
			principal_uuid,
			name,
			handle_cache,
			account_type,
			can_auto_pull ? 1 : 0,
			now()
		);
	console.log(`  +     [${handle_cache}] ${name} (${account_type})`);
}

console.log('Seeding Community Bank special accounts…');

// Get UUIDs from environment variables (copied from governance associations)
const centralBankUuid = process.env.CENTRAL_BANK_UUID;
const treasuryUuid = process.env.TREASURY_UUID;
const sifUuid = process.env.SIF_UUID;
const clearinghouseUuid = process.env.CLEARINGHOUSE_UUID;

if (!centralBankUuid || !treasuryUuid || !sifUuid || !clearinghouseUuid) {
	console.error('Error: Missing required environment variables:');
	console.error('  CENTRAL_BANK_UUID, TREASURY_UUID, SIF_UUID, CLEARINGHOUSE_UUID');
	console.error('  These should be copied from governance app associations.');
	process.exit(1);
}

// Central Bank — its balance will be ≤ 0; absolute value = total Frank supply.
ensureAccount(centralBankUuid, 'Central Bank', 'central-bank', 'system', false);

// Treasury — receives issuance and demurrage; source of Assembly appropriations.
ensureAccount(treasuryUuid, 'Treasury', 'treasury', 'official', false);

// Social Insurance Fund — disburses monthly allowances.
ensureAccount(sifUuid, 'Social Insurance Fund', 'social-insurance', 'official', false);

// Clearinghouse — the society's inter-society net position account.
ensureAccount(clearinghouseUuid, 'Clearinghouse', 'society', 'official', false);

console.log('Done.');
