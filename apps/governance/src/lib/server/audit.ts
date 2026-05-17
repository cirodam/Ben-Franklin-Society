import { db } from './db.js';

export interface AuditEntry {
	id: number;
	actor_uuid: string;
	action: string;
	target_type: string;
	target_uuid: string;
	detail: string | null;
	motion_uuid: string | null;
	created_at: string;
}

/**
 * Record a write action in the audit log.
 *
 * @param actorUuid    - The person who performed the action (acting_as_uuid)
 * @param action       - Dot-namespaced action string, e.g. 'library.update', 'member.add'
 * @param targetType   - The type of the thing changed, e.g. 'library', 'person', 'association'
 * @param targetUuid   - UUID of the thing changed
 * @param detail       - Human-readable description of what changed
 * @param motionUuid   - Optional: the motion that authorized this action
 */
export function audit(
	actorUuid: string,
	action: string,
	targetType: string,
	targetUuid: string,
	detail: string,
	motionUuid?: string | null
): void {
	db.prepare(
		`INSERT INTO audit_log (actor_uuid, action, target_type, target_uuid, detail, motion_uuid, created_at)
		 VALUES (?, ?, ?, ?, ?, ?, ?)`
	).run(
		actorUuid,
		action,
		targetType,
		targetUuid,
		detail,
		motionUuid ?? null,
		new Date().toISOString()
	);
}

export function getAuditLog(opts: {
	targetType?: string;
	targetUuid?: string;
	actorUuid?: string;
	motionUuid?: string;
	limit?: number;
	offset?: number;
} = {}): AuditEntry[] {
	let query = 'SELECT * FROM audit_log WHERE 1=1';
	const params: (string | number)[] = [];

	if (opts.targetType) { query += ' AND target_type = ?'; params.push(opts.targetType); }
	if (opts.targetUuid) { query += ' AND target_uuid = ?'; params.push(opts.targetUuid); }
	if (opts.actorUuid)  { query += ' AND actor_uuid = ?';  params.push(opts.actorUuid); }
	if (opts.motionUuid) { query += ' AND motion_uuid = ?'; params.push(opts.motionUuid); }

	query += ' ORDER BY id DESC';
	if (opts.limit)  { query += ' LIMIT ?';  params.push(opts.limit); }
	if (opts.offset) { query += ' OFFSET ?'; params.push(opts.offset); }

	return db.prepare(query).all(...params) as AuditEntry[];
}
