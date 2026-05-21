import { randomUUID } from 'node:crypto';
import { db } from './db.js';

export interface Template {
	uuid: string;
	mailbox_uuid: string;
	name: string;
	subject: string;
	body: string;
	created_at: string;
}

export function getTemplates(mailbox_uuid: string): Template[] {
	return db
		.prepare('SELECT * FROM mail_template WHERE mailbox_uuid = ? ORDER BY name ASC')
		.all(mailbox_uuid) as Template[];
}

export function getTemplate(uuid: string, mailbox_uuid: string): Template | null {
	return db
		.prepare('SELECT * FROM mail_template WHERE uuid = ? AND mailbox_uuid = ?')
		.get(uuid, mailbox_uuid) as Template | null;
}

export function createTemplate(params: {
	mailbox_uuid: string;
	name: string;
	subject: string;
	body: string;
}): Template {
	const uuid = randomUUID();
	const created_at = new Date().toISOString();

	db.prepare(
		`INSERT INTO mail_template (uuid, mailbox_uuid, name, subject, body, created_at)
     VALUES (?, ?, ?, ?, ?, ?)`
	).run(uuid, params.mailbox_uuid, params.name, params.subject, params.body, created_at);

	return getTemplate(uuid, params.mailbox_uuid)!;
}

export function updateTemplate(params: {
	uuid: string;
	mailbox_uuid: string;
	name: string;
	subject: string;
	body: string;
}): void {
	db.prepare(
		`UPDATE mail_template 
     SET name = ?, subject = ?, body = ? 
     WHERE uuid = ? AND mailbox_uuid = ?`
	).run(params.name, params.subject, params.body, params.uuid, params.mailbox_uuid);
}

export function deleteTemplate(uuid: string, mailbox_uuid: string): void {
	db.prepare('DELETE FROM mail_template WHERE uuid = ? AND mailbox_uuid = ?').run(
		uuid,
		mailbox_uuid
	);
}
