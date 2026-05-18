import { randomUUID } from 'node:crypto';
import { db } from '../db.js';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface RecordEntry {
	uuid: string;
	association_uuid: string;
	recorded_by: string;
	action: string;
	target_type: string;
	target_uuid: string;
	body: string;
	detail: string | null;
	created_at: string;
	edited_at: string | null;
	deleted_at: string | null;
}

// ---------------------------------------------------------------------------
// Write
// ---------------------------------------------------------------------------

/**
 * Append one entry to The Record.
 * Call this inside the same db.transaction() as the action it records.
 */
export function addEntry(
	associationUuid: string,
	recordedBy: string,
	action: string,
	targetType: string,
	targetUuid: string,
	body: string,
	detail?: Record<string, unknown>
): RecordEntry {
	const uuid = randomUUID();
	const createdAt = new Date().toISOString();
	db.prepare(
		`INSERT INTO record_entry
		   (uuid, association_uuid, recorded_by, action, target_type, target_uuid, body, detail, created_at)
		 VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
	).run(
		uuid,
		associationUuid,
		recordedBy,
		action,
		targetType,
		targetUuid,
		body,
		detail ? JSON.stringify(detail) : null,
		createdAt
	);
	return { uuid, association_uuid: associationUuid, recorded_by: recordedBy, action, target_type: targetType, target_uuid: targetUuid, body, detail: detail ? JSON.stringify(detail) : null, created_at: createdAt, edited_at: null, deleted_at: null };
}

// ---------------------------------------------------------------------------
// Read
// ---------------------------------------------------------------------------

/**
 * The primary view: a single body's Record in reverse-chronological order.
 */
export function getBodyRecord(
	associationUuid: string,
	opts: { action?: string; limit?: number; offset?: number } = {}
): RecordEntry[] {
	const conditions = ['association_uuid = ?'];
	const params: unknown[] = [associationUuid];

	if (opts.action) {
		conditions.push('action = ?');
		params.push(opts.action);
	}

	const limit = opts.limit ?? 100;
	const offset = opts.offset ?? 0;
	params.push(limit, offset);

	return db
		.prepare(
			`SELECT * FROM record_entry WHERE ${conditions.join(' AND ')} AND deleted_at IS NULL
			 ORDER BY created_at DESC LIMIT ? OFFSET ?`
		)
		.all(...params) as RecordEntry[];
}

/**
 * Cross-body query — look up entries by target or action.
 */
export function getEntries(
	opts: { targetUuid?: string; targetType?: string; action?: string; limit?: number; offset?: number } = {}
): RecordEntry[] {
	const conditions: string[] = [];
	const params: unknown[] = [];

	if (opts.targetUuid) { conditions.push('target_uuid = ?'); params.push(opts.targetUuid); }
	if (opts.targetType) { conditions.push('target_type = ?'); params.push(opts.targetType); }
	if (opts.action)     { conditions.push('action = ?');      params.push(opts.action); }

	const where = conditions.length ? `WHERE ${conditions.join(' AND ')} AND deleted_at IS NULL` : 'WHERE deleted_at IS NULL';
	const limit = opts.limit ?? 100;
	const offset = opts.offset ?? 0;
	params.push(limit, offset);

	return db
		.prepare(`SELECT * FROM record_entry ${where} ORDER BY created_at DESC LIMIT ? OFFSET ?`)
		.all(...params) as RecordEntry[];
}

/**
 * Global aggregate feed across all bodies (excluding deleted entries).
 */
export function getFullRecord(limit = 100, offset = 0): RecordEntry[] {
	return db
		.prepare('SELECT * FROM record_entry WHERE deleted_at IS NULL ORDER BY created_at DESC LIMIT ? OFFSET ?')
		.all(limit, offset) as RecordEntry[];
}

export function getEntryByUuid(uuid: string): RecordEntry | null {
	return (db.prepare('SELECT * FROM record_entry WHERE uuid = ?').get(uuid) as RecordEntry | undefined) ?? null;
}

export function editEntry(uuid: string, body: string): void {
	db.prepare('UPDATE record_entry SET body = ?, edited_at = ? WHERE uuid = ?')
		.run(body, new Date().toISOString(), uuid);
}

export function deleteEntry(uuid: string): void {
	db.prepare('UPDATE record_entry SET deleted_at = ? WHERE uuid = ?')
		.run(new Date().toISOString(), uuid);
}
