import { randomUUID } from 'node:crypto';
import { db } from '../core/db.js';
import type { Session } from '@bfs/oidc-client';
import { hasAppWideAdmin } from '../auth/authorization.js';

export interface Account {
	uuid: string;
	owner_uuid: string;
	name: string;
	balance: number;
	is_frozen: number;
	demurrage_exempt: number;
	created_at: string;
}

export function createAccount(opts: {
	owner_uuid: string;
	name: string;
	demurrage_exempt?: boolean;
}): Account {
	const uuid = randomUUID();
	const now = new Date().toISOString();
	db.prepare(
		`INSERT INTO account (uuid, owner_uuid, name, balance, is_frozen, demurrage_exempt, created_at)
     VALUES (?, ?, ?, 0, 0, ?, ?)`
	).run(
		uuid,
		opts.owner_uuid,
		opts.name,
		opts.demurrage_exempt ? 1 : 0,
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
			.prepare('SELECT * FROM account ORDER BY name, created_at')
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

export function freezeAccount(uuid: string): void {
	db.prepare('UPDATE account SET is_frozen = 1 WHERE uuid = ?').run(uuid);
}

export function unfreezeAccount(uuid: string): void {
	db.prepare('UPDATE account SET is_frozen = 0 WHERE uuid = ?').run(uuid);
}

export function searchAccounts(query: string, limit: number = 50): Account[] {
	const pattern = `%${query}%`;
	return db
		.prepare(
			`SELECT * FROM account 
       WHERE name LIKE ? 
          OR uuid LIKE ?
       ORDER BY created_at DESC
       LIMIT ?`
		)
		.all(pattern, pattern, limit) as Account[];
}
