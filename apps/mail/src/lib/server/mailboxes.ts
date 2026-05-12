import { db } from './db.js';

export interface Mailbox {
	principal_uuid: string;
	handle_cache: string;
	status: 'active' | 'suspended';
	created_at: string;
}

export function getMailbox(principal_uuid: string): Mailbox | null {
	return db
		.prepare('SELECT * FROM mailbox WHERE principal_uuid = ?')
		.get(principal_uuid) as Mailbox | null;
}

export function ensureMailbox(principal_uuid: string, handle_cache: string): Mailbox {
	const existing = getMailbox(principal_uuid);
	if (existing) return existing;

	const now = new Date().toISOString();
	db.prepare(
		`INSERT INTO mailbox (principal_uuid, handle_cache, status, created_at)
     VALUES (?, ?, 'active', ?)`
	).run(principal_uuid, handle_cache, now);

	return getMailbox(principal_uuid)!;
}

export function updateHandleCache(principal_uuid: string, handle_cache: string): void {
	db.prepare('UPDATE mailbox SET handle_cache = ? WHERE principal_uuid = ?').run(
		handle_cache,
		principal_uuid
	);
}

export function suspendMailbox(principal_uuid: string): void {
	db.prepare(`UPDATE mailbox SET status = 'suspended' WHERE principal_uuid = ?`).run(
		principal_uuid
	);
}

export function reinstateMailbox(principal_uuid: string): void {
	db.prepare(`UPDATE mailbox SET status = 'active' WHERE principal_uuid = ?`).run(
		principal_uuid
	);
}
