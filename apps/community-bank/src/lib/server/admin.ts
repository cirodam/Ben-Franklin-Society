import { randomUUID } from 'node:crypto';
import { db } from './core/db.js';
import type { Account } from './domain/accounts.js';
import type { EnrichedTransaction } from './core/ledger.js';

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
