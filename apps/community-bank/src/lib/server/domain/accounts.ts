import { randomUUID } from 'node:crypto';
import { db } from '../core/db.js';
import type { Session } from '@bfs/oidc-client';

export interface Account {
	uuid: string;
	owner_uuid: string;
	name: string;
	franks_balance: number;
	florens_balance: number;
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
		`INSERT INTO account (uuid, owner_uuid, name, franks_balance, florens_balance, is_frozen, demurrage_exempt, created_at)
     VALUES (?, ?, ?, 0, 0, 0, ?, ?)`
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
 * Returns accounts owned by the acting_as_uuid (person or association)
 */
export function getAccountsForContext(session: Session): Account[] {
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
