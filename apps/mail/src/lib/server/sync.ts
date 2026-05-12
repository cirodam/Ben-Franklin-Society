/**
 * Mailbox sync — keeps mail mailboxes in sync with governance membership.
 *
 * - Provisions missing mailboxes for all active persons + associations.
 * - Refreshes handle_cache for existing mailboxes.
 * - Suspends mailboxes for revoked persons.
 *
 * Records each run in sync_run (idempotent by job + period_key).
 */

import { randomUUID } from 'node:crypto';
import { db } from './db.js';
import { syncPersons, syncAssociations } from './governance-api.js';

export interface SyncResult {
	created:   number;
	updated:   number;
	suspended: number;
	errors:    string[];
}

type MailboxRow = { principal_uuid: string; handle_cache: string; status: string };

export async function syncMailboxes(): Promise<SyncResult> {
	const result: SyncResult = { created: 0, updated: 0, suspended: 0, errors: [] };

	// -------------------------------------------------------------------------
	// Load current state from both DBs
	// -------------------------------------------------------------------------
	const persons = await syncPersons();
	const assocs = await syncAssociations();

	const mailboxIndex = new Map<string, MailboxRow>();
	for (const row of db.prepare('SELECT * FROM mailbox').all() as MailboxRow[]) {
		mailboxIndex.set(row.principal_uuid, row);
	}

	const now = new Date().toISOString();

	// -------------------------------------------------------------------------
	// Process persons
	// -------------------------------------------------------------------------
	for (const person of persons) {
		try {
			const existing = mailboxIndex.get(person.uuid);
			const isActive = person.status !== 'revoked';

			if (!existing) {
				if (isActive) {
					db.prepare(
						`INSERT INTO mailbox (principal_uuid, handle_cache, status, created_at)
             VALUES (?, ?, 'active', ?)`
					).run(person.uuid, person.handle, now);
					result.created++;
				}
				// revoked + no mailbox → nothing to do
			} else {
				// Refresh handle_cache if changed
				if (existing.handle_cache !== person.handle) {
					db.prepare(
						`UPDATE mailbox SET handle_cache = ? WHERE principal_uuid = ?`
					).run(person.handle, person.uuid);
					result.updated++;
				}

				// Suspend active mailbox for revoked person
				if (!isActive && existing.status === 'active') {
					db.prepare(
						`UPDATE mailbox SET status = 'suspended' WHERE principal_uuid = ?`
					).run(person.uuid);
					result.suspended++;
				}

				// Optionally reinstate if person became active again (status restored in governance)
				if (isActive && existing.status === 'suspended') {
					db.prepare(
						`UPDATE mailbox SET status = 'active' WHERE principal_uuid = ?`
					).run(person.uuid);
					result.updated++;
				}
			}
		} catch (err) {
			result.errors.push(`person ${person.uuid}: ${String(err)}`);
		}
	}

	// -------------------------------------------------------------------------
	// Process associations
	// -------------------------------------------------------------------------
	for (const assoc of assocs) {
		try {
			const existing  = mailboxIndex.get(assoc.uuid);
			const isActive  = assoc.status === 'active';

			if (!existing) {
				if (isActive) {
					db.prepare(
						`INSERT INTO mailbox (principal_uuid, handle_cache, status, created_at)
             VALUES (?, ?, 'active', ?)`
					).run(assoc.uuid, assoc.handle, now);
					result.created++;
				}
			} else {
				if (existing.handle_cache !== assoc.handle) {
					db.prepare(
						`UPDATE mailbox SET handle_cache = ? WHERE principal_uuid = ?`
					).run(assoc.handle, assoc.uuid);
					result.updated++;
				}

				if (!isActive && existing.status === 'active') {
					db.prepare(
						`UPDATE mailbox SET status = 'suspended' WHERE principal_uuid = ?`
					).run(assoc.uuid);
					result.suspended++;
				}

				if (isActive && existing.status === 'suspended') {
					db.prepare(
						`UPDATE mailbox SET status = 'active' WHERE principal_uuid = ?`
					).run(assoc.uuid);
					result.updated++;
				}
			}
		} catch (err) {
			result.errors.push(`assoc ${assoc.uuid}: ${String(err)}`);
		}
	}

	// -------------------------------------------------------------------------
	// Record this run in sync_run
	// -------------------------------------------------------------------------
	const periodKey = new Date().toISOString().slice(0, 13); // hourly bucket: "YYYY-MM-DDTHH"
	db.prepare(
		`INSERT OR REPLACE INTO sync_run (uuid, job, period_key, ran_at, result_json)
     VALUES (?, 'sync_mailboxes', ?, ?, ?)`
	).run(randomUUID(), periodKey, now, JSON.stringify(result));

	return result;
}
