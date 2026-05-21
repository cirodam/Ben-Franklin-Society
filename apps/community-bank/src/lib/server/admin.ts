import { randomUUID } from 'node:crypto';
import { db } from './db.js';
import type { Account } from './accounts.js';
import type { EnrichedTransaction } from './ledger.js';

// ---------------------------------------------------------------------------
// Transaction types — re-export for convenience
// ---------------------------------------------------------------------------

export {
	TransactionType,
	TransactionSource,
	getTransactionTypeLabel,
	getTransactionSourceLabel,
	type TransactionTypeValue,
	type TransactionSourceValue,
} from './transaction-types.js';

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
			.prepare(`SELECT * FROM account ORDER BY name LIMIT 200`)
			.all() as Account[];
	}
	const like = `%${q}%`;
	return db
		.prepare(
			`SELECT * FROM account
       WHERE name LIKE ? OR uuid LIKE ?
       ORDER BY name
       LIMIT 200`
		)
		.all(like, like) as Account[];
}
