import { randomUUID } from 'node:crypto';
import { db } from './db.js';

export type AccountType = 'standard' | 'official' | 'system';

export interface Account {
	uuid: string;
	principal_uuid: string;
	name: string;
	handle_cache: string;
	balance: number;
	status: 'active' | 'frozen';
	account_type: AccountType;
	can_auto_pull: number;
	created_at: string;
}

export function createAccount(opts: {
	principal_uuid: string;
	name: string;
	handle_cache?: string;
	account_type?: AccountType;
	can_auto_pull?: boolean;
}): Account {
	const uuid = randomUUID();
	const now = new Date().toISOString();
	db.prepare(
		`INSERT INTO account (uuid, principal_uuid, name, handle_cache, balance, status, account_type, can_auto_pull, created_at)
     VALUES (?, ?, ?, ?, 0, 'active', ?, ?, ?)`
	).run(
		uuid,
		opts.principal_uuid,
		opts.name,
		opts.handle_cache ?? '',
		opts.account_type ?? 'standard',
		opts.can_auto_pull ? 1 : 0,
		now
	);
	return getAccountByUuid(uuid)!;
}

export function getAccountByUuid(uuid: string): Account | null {
	return db.prepare('SELECT * FROM account WHERE uuid = ?').get(uuid) as Account | null;
}

export function getAccountsByPrincipal(principal_uuid: string): Account[] {
	return db
		.prepare('SELECT * FROM account WHERE principal_uuid = ? ORDER BY created_at')
		.all(principal_uuid) as Account[];
}

export function getAccountByPrincipalAndName(
	principal_uuid: string,
	name: string
): Account | null {
	return db
		.prepare('SELECT * FROM account WHERE principal_uuid = ? AND name = ?')
		.get(principal_uuid, name) as Account | null;
}

export function updateHandleCache(principal_uuid: string, handle: string): void {
	db.prepare('UPDATE account SET handle_cache = ? WHERE principal_uuid = ?').run(
		handle,
		principal_uuid
	);
}

export function freezeAccount(uuid: string): void {
	db.prepare(`UPDATE account SET status = 'frozen' WHERE uuid = ?`).run(uuid);
}

export function unfreezeAccount(uuid: string): void {
	db.prepare(`UPDATE account SET status = 'active' WHERE uuid = ?`).run(uuid);
}

export function updateAccountMetadata(uuid: string, opts: {
	account_type?: AccountType;
	can_auto_pull?: boolean;
}): void {
	if (opts.account_type !== undefined) {
		db.prepare('UPDATE account SET account_type = ? WHERE uuid = ?').run(opts.account_type, uuid);
	}
	if (opts.can_auto_pull !== undefined) {
		db.prepare('UPDATE account SET can_auto_pull = ? WHERE uuid = ?').run(
			opts.can_auto_pull ? 1 : 0,
			uuid
		);
	}
}

export function searchAccounts(query: string): Account[] {
	const pattern = `%${query}%`;
	return db
		.prepare(
			`SELECT * FROM account 
       WHERE handle_cache LIKE ? 
          OR name LIKE ? 
          OR uuid LIKE ?
       ORDER BY created_at DESC
       LIMIT 50`
		)
		.all(pattern, pattern, pattern) as Account[];
}

/**
 * Get account by handle_cache (exact match, case-insensitive).
 * Returns the Primary account for the given handle, or null if not found.
 */
export function getAccountByHandle(handle: string): Account | null {
	const normalized = handle.toLowerCase().replace(/^@/, '');
	return (
		(db
			.prepare(
				`SELECT * FROM account 
         WHERE LOWER(handle_cache) = ? AND name = 'Primary' AND status = 'active'
         LIMIT 1`
			)
			.get(normalized) as Account | undefined) ?? null
	);
}
