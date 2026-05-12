import { randomUUID } from 'node:crypto';
import { db } from './db.js';
import type { Account } from './accounts.js';
import type { EnrichedTransaction } from './ledger.js';

// ---------------------------------------------------------------------------
// Admin action log
// ---------------------------------------------------------------------------

export interface AdminActionLog {
	uuid: string;
	action: string;
	target_uuid: string;
	target_type: string;
	actor_uuid: string;
	memo: string;
	created_at: string;
}

export function logAdminAction(opts: {
	action: string;
	target_uuid: string;
	target_type: string;
	actor_uuid: string;
	memo: string;
}): void {
	db.prepare(
		`INSERT INTO admin_action_log (uuid, action, target_uuid, target_type, actor_uuid, memo, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?)`
	).run(
		randomUUID(),
		opts.action,
		opts.target_uuid,
		opts.target_type,
		opts.actor_uuid,
		opts.memo,
		new Date().toISOString()
	);
}

export function getAdminActionsForTarget(target_uuid: string): AdminActionLog[] {
	return db
		.prepare(`SELECT * FROM admin_action_log WHERE target_uuid = ? ORDER BY created_at DESC`)
		.all(target_uuid) as AdminActionLog[];
}

// ---------------------------------------------------------------------------
// Account search (all accounts, optional handle/name filter)
// ---------------------------------------------------------------------------

export function searchAccounts(q: string): Account[] {
	if (!q) {
		return db
			.prepare(`SELECT * FROM account ORDER BY handle_cache, name LIMIT 200`)
			.all() as Account[];
	}
	const like = `%${q}%`;
	return db
		.prepare(
			`SELECT * FROM account
       WHERE handle_cache LIKE ? OR name LIKE ?
       ORDER BY handle_cache, name
       LIMIT 200`
		)
		.all(like, like) as Account[];
}

// ---------------------------------------------------------------------------
// Scheduled transfers
// ---------------------------------------------------------------------------

export interface ScheduledTransfer {
	uuid: string;
	name: string;
	from_uuid: string;
	to_uuid: string;
	amount: number;
	type: string;
	schedule: string;
	group_uuid: string | null;
	status: string;
	created_by_motion_uuid: string | null;
	created_at: string;
	cancelled_at: string | null;
	// Enriched
	from_handle: string;
	from_name: string;
	to_handle: string;
	to_name: string;
}

export function getAllScheduledTransfers(): ScheduledTransfer[] {
	return db
		.prepare(
			`SELECT st.*,
              fa.handle_cache AS from_handle, fa.name AS from_name,
              ta.handle_cache AS to_handle,   ta.name AS to_name
       FROM scheduled_transfer st
       JOIN account fa ON fa.uuid = st.from_uuid
       JOIN account ta ON ta.uuid = st.to_uuid
       ORDER BY st.status, st.created_at DESC`
		)
		.all() as ScheduledTransfer[];
}

export function pauseScheduledTransfer(uuid: string): void {
	db.prepare(`UPDATE scheduled_transfer SET status = 'paused' WHERE uuid = ?`).run(uuid);
}

export function unpauseScheduledTransfer(uuid: string): void {
	db.prepare(`UPDATE scheduled_transfer SET status = 'active' WHERE uuid = ?`).run(uuid);
}

export function cancelScheduledTransfer(uuid: string): void {
	db.prepare(
		`UPDATE scheduled_transfer SET status = 'cancelled', cancelled_at = ? WHERE uuid = ?`
	).run(new Date().toISOString(), uuid);
}
