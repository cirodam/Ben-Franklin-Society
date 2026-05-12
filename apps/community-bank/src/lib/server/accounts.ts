import { randomUUID } from 'node:crypto';
import { db } from './db.js';

export interface Account {
	uuid: string;
	principal_uuid: string;
	name: string;
	handle_cache: string;
	balance: number;
	status: 'active' | 'frozen';
	created_at: string;
}

export function createAccount(opts: {
	principal_uuid: string;
	name: string;
	handle_cache?: string;
}): Account {
	const uuid = randomUUID();
	const now = new Date().toISOString();
	db.prepare(
		`INSERT INTO account (uuid, principal_uuid, name, handle_cache, balance, status, created_at)
     VALUES (?, ?, ?, ?, 0, 'active', ?)`
	).run(uuid, opts.principal_uuid, opts.name, opts.handle_cache ?? '', now);
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
