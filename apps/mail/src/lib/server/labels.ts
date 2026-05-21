import { randomUUID } from 'node:crypto';
import { db } from './db.js';

export interface Label {
	uuid: string;
	mailbox_uuid: string;
	name: string;
	color: string | null;
	created_at: string;
}

export interface LabelWithCount extends Label {
	thread_count: number;
}

export function getLabels(mailbox_uuid: string): LabelWithCount[] {
	return db
		.prepare(
			`SELECT 
        l.*,
        COUNT(DISTINCT tl.thread_id) as thread_count
      FROM label l
      LEFT JOIN thread_label tl ON l.uuid = tl.label_uuid AND tl.mailbox_uuid = l.mailbox_uuid
      WHERE l.mailbox_uuid = ?
      GROUP BY l.uuid
      ORDER BY l.name ASC`
		)
		.all(mailbox_uuid) as LabelWithCount[];
}

export function getLabel(uuid: string, mailbox_uuid: string): Label | null {
	return db
		.prepare('SELECT * FROM label WHERE uuid = ? AND mailbox_uuid = ?')
		.get(uuid, mailbox_uuid) as Label | null;
}

export function createLabel(params: {
	mailbox_uuid: string;
	name: string;
	color?: string;
}): Label {
	const uuid = randomUUID();
	const created_at = new Date().toISOString();
	const color = params.color || null;

	db.prepare(
		`INSERT INTO label (uuid, mailbox_uuid, name, color, created_at)
     VALUES (?, ?, ?, ?, ?)`
	).run(uuid, params.mailbox_uuid, params.name, color, created_at);

	return getLabel(uuid, params.mailbox_uuid)!;
}

export function updateLabel(params: {
	uuid: string;
	mailbox_uuid: string;
	name: string;
	color?: string;
}): void {
	const color = params.color || null;
	db.prepare(
		`UPDATE label 
     SET name = ?, color = ? 
     WHERE uuid = ? AND mailbox_uuid = ?`
	).run(params.name, color, params.uuid, params.mailbox_uuid);
}

export function deleteLabel(uuid: string, mailbox_uuid: string): void {
	// thread_label will be cascade deleted
	db.prepare('DELETE FROM label WHERE uuid = ? AND mailbox_uuid = ?').run(uuid, mailbox_uuid);
}

export function getThreadLabels(thread_id: string, mailbox_uuid: string): Label[] {
	return db
		.prepare(
			`SELECT l.* FROM label l
       JOIN thread_label tl ON l.uuid = tl.label_uuid
       WHERE tl.thread_id = ? AND tl.mailbox_uuid = ?
       ORDER BY l.name ASC`
		)
		.all(thread_id, mailbox_uuid) as Label[];
}

export function addThreadLabel(thread_id: string, label_uuid: string, mailbox_uuid: string): void {
	try {
		db.prepare(
			`INSERT INTO thread_label (thread_id, label_uuid, mailbox_uuid)
       VALUES (?, ?, ?)`
		).run(thread_id, label_uuid, mailbox_uuid);
	} catch (err) {
		// Ignore unique constraint violations (label already applied)
	}
}

export function removeThreadLabel(
	thread_id: string,
	label_uuid: string,
	mailbox_uuid: string
): void {
	db.prepare(
		`DELETE FROM thread_label 
     WHERE thread_id = ? AND label_uuid = ? AND mailbox_uuid = ?`
	).run(thread_id, label_uuid, mailbox_uuid);
}
