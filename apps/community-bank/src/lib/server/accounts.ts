import { randomUUID } from 'node:crypto';
import { db } from './db.js';
import type { Session } from '@bfs/oidc-client';
import { hasAppWideAdmin } from './authorization.js';

export type AccountType = 'standard' | 'official' | 'system';

export interface Account {
	uuid: string;
	owner_uuid: string;
	name: string;
	handle_cache: string;
	balance: number;
	status: 'active' | 'frozen';
	account_type: AccountType;
	created_at: string;
}

export interface AccountOwnerPermissions {
	owner_uuid: string;
	can_auto_pull: number;
	created_at: string;
}

export function createAccount(opts: {
	owner_uuid: string;
	name: string;
	handle_cache?: string;
	account_type?: AccountType;
}): Account {
	const uuid = randomUUID();
	const now = new Date().toISOString();
	db.prepare(
		`INSERT INTO account (uuid, owner_uuid, name, handle_cache, balance, status, account_type, created_at)
     VALUES (?, ?, ?, ?, 0, 'active', ?, ?)`
	).run(
		uuid,
		opts.owner_uuid,
		opts.name,
		opts.handle_cache ?? '',
		opts.account_type ?? 'standard',
		now
	);
	return getAccountByUuid(uuid)!;
}

export function getAccountByUuid(uuid: string): Account | null {
	return db.prepare('SELECT * FROM account WHERE uuid = ?').get(uuid) as Account | null;
}

export function getAccountsByOwner(owner_uuid: string): Account[] {
	return db
		.prepare('SELECT * FROM account WHERE owner_uuid = ? ORDER BY created_at')
		.all(owner_uuid) as Account[];
}

/**
 * Get accounts for the current session context
 * - App-wide admins see all accounts
 * - Others see only accounts they own (based on acting_as_uuid)
 */
export function getAccountsForContext(session: Session): Account[] {
	// App-wide admin sees everything
	if (hasAppWideAdmin(session)) {
		return db
			.prepare('SELECT * FROM account ORDER BY handle_cache, name')
			.all() as Account[];
	}
	
	// Everyone else sees only their context's accounts
	return getAccountsByOwner(session.acting_as_uuid);
}

export function getAccountByOwnerAndName(
	owner_uuid: string,
	name: string
): Account | null {
	return db
		.prepare('SELECT * FROM account WHERE owner_uuid = ? AND name = ?')
		.get(owner_uuid, name) as Account | null;
}

export function updateHandleCache(owner_uuid: string, handle: string): void {
	db.prepare('UPDATE account SET handle_cache = ? WHERE owner_uuid = ?').run(
		handle,
		owner_uuid
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
}): void {
	if (opts.account_type !== undefined) {
		db.prepare('UPDATE account SET account_type = ? WHERE uuid = ?').run(opts.account_type, uuid);
	}
}

// ---------------------------------------------------------------------------
// Account Owner Permissions
// ---------------------------------------------------------------------------

export function getAccountOwnerPermissions(owner_uuid: string): AccountOwnerPermissions | null {
	return db
		.prepare('SELECT * FROM account_owner_permissions WHERE owner_uuid = ?')
		.get(owner_uuid) as AccountOwnerPermissions | null;
}

export function setAccountOwnerPermissions(opts: {
	owner_uuid: string;
	can_auto_pull: boolean;
}): void {
	const now = new Date().toISOString();
	db.prepare(
		`INSERT INTO account_owner_permissions (owner_uuid, can_auto_pull, created_at)
     VALUES (?, ?, ?)
     ON CONFLICT(owner_uuid) DO UPDATE SET can_auto_pull = excluded.can_auto_pull`
	).run(opts.owner_uuid, opts.can_auto_pull ? 1 : 0, now);
}

export function ownerCanAutoPull(owner_uuid: string): boolean {
	const perms = getAccountOwnerPermissions(owner_uuid);
	return perms ? perms.can_auto_pull === 1 : false;
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
