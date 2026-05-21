import { db } from './db.js';

export interface Mailbox {
	owner_uuid: string;
	handle_cache: string;
	status: 'active' | 'suspended';
	signature: string | null;
	created_at: string;
}

export function getMailbox(owner_uuid: string): Mailbox | null {
	return db
		.prepare('SELECT * FROM mailbox WHERE owner_uuid = ?')
		.get(owner_uuid) as Mailbox | null;
}

export function ensureMailbox(owner_uuid: string, handle_cache: string): Mailbox {
	const existing = getMailbox(owner_uuid);
	if (existing) return existing;

	const now = new Date().toISOString();
	db.prepare(
		`INSERT INTO mailbox (owner_uuid, handle_cache, status, created_at)
     VALUES (?, ?, 'active', ?)`
	).run(owner_uuid, handle_cache, now);

	return getMailbox(owner_uuid)!;
}

export function updateHandleCache(owner_uuid: string, handle_cache: string): void {
	db.prepare('UPDATE mailbox SET handle_cache = ? WHERE owner_uuid = ?').run(
		handle_cache,
		owner_uuid
	);
}

export function suspendMailbox(owner_uuid: string): void {
	db.prepare(`UPDATE mailbox SET status = 'suspended' WHERE owner_uuid = ?`).run(
		owner_uuid
	);
}

export function reinstateMailbox(owner_uuid: string): void {
	db.prepare(`UPDATE mailbox SET status = 'active' WHERE owner_uuid = ?`).run(
		owner_uuid
	);
}
