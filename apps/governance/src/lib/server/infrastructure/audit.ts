/**
 * Audit Logging
 * 
 * Tracks security-relevant events for compliance and forensics.
 */

import { db } from '../db.js';

export type AuditEventType =
	| 'login'
	| 'login_failed'
	| 'logout'
	| 'session_created'
	| 'session_revoked'
	| 'session_expired'
	| 'password_changed'
	| 'account_locked'
	| 'account_unlocked'
	| 'permission_granted'
	| 'permission_revoked'
	| 'role_assigned'
	| 'role_removed'
	| 'oidc_authorize'
	| 'oidc_token_issued'
	| 'oidc_token_refreshed'
	| 'oidc_token_revoked'
	| 'rate_limit_exceeded'
	| 'context_switched';

export interface AuditLogEntry {
	eventType: AuditEventType;
	actorUuid?: string;
	actingAsUuid?: string;
	targetUuid?: string;
	targetType?: string;
	ipAddress?: string;
	userAgent?: string;
	sessionUuid?: string;
	success?: boolean;
	details?: Record<string, unknown>;
}

/**
 * Log an audit event
 */
export function logAuditEvent(entry: AuditLogEntry): void {
	try {
		const details = entry.details ? JSON.stringify(entry.details) : null;

		db.prepare(
			`INSERT INTO audit_log 
			(event_type, actor_uuid, acting_as_uuid, target_uuid, target_type, 
			 ip_address, user_agent, session_uuid, success, details)
			VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
		).run(
			entry.eventType,
			entry.actorUuid ?? null,
			entry.actingAsUuid ?? null,
			entry.targetUuid ?? null,
			entry.targetType ?? null,
			entry.ipAddress ?? null,
			entry.userAgent ?? null,
			entry.sessionUuid ?? null,
			entry.success !== false ? 1 : 0,
			details
		);
	} catch (error) {
		// Audit logging should never crash the application
		console.error('[audit] Failed to log event:', error);
	}
}

/**
 * Query audit logs
 */
export interface AuditLogQuery {
	actorUuid?: string;
	targetUuid?: string;
	eventType?: AuditEventType;
	sessionUuid?: string;
	ipAddress?: string;
	startTime?: string;
	endTime?: string;
	limit?: number;
}

export interface AuditLogRecord {
	id: number;
	timestamp: string;
	event_type: string;
	actor_uuid: string | null;
	acting_as_uuid: string | null;
	target_uuid: string | null;
	target_type: string | null;
	ip_address: string | null;
	user_agent: string | null;
	session_uuid: string | null;
	success: number;
	details: string | null;
}

export function queryAuditLogs(query: AuditLogQuery): AuditLogRecord[] {
	const conditions: string[] = [];
	const params: unknown[] = [];

	if (query.actorUuid) {
		conditions.push('actor_uuid = ?');
		params.push(query.actorUuid);
	}
	if (query.targetUuid) {
		conditions.push('target_uuid = ?');
		params.push(query.targetUuid);
	}
	if (query.eventType) {
		conditions.push('event_type = ?');
		params.push(query.eventType);
	}
	if (query.sessionUuid) {
		conditions.push('session_uuid = ?');
		params.push(query.sessionUuid);
	}
	if (query.ipAddress) {
		conditions.push('ip_address = ?');
		params.push(query.ipAddress);
	}
	if (query.startTime) {
		conditions.push('timestamp >= ?');
		params.push(query.startTime);
	}
	if (query.endTime) {
		conditions.push('timestamp <= ?');
		params.push(query.endTime);
	}

	const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
	const limit = query.limit ?? 100;

	const sql = `
		SELECT * FROM audit_log
		${whereClause}
		ORDER BY timestamp DESC
		LIMIT ?
	`;

	return db.prepare(sql).all(...params, limit) as AuditLogRecord[];
}

/**
 * Get recent failed login attempts for a person
 */
export function getRecentFailedLogins(personUuid: string, hours: number = 24): AuditLogRecord[] {
	const cutoff = new Date(Date.now() - hours * 60 * 60 * 1000).toISOString();

	return db
		.prepare(
			`SELECT * FROM audit_log
			 WHERE target_uuid = ?
			   AND event_type = 'login_failed'
			   AND timestamp >= ?
			 ORDER BY timestamp DESC`
		)
		.all(personUuid, cutoff) as AuditLogRecord[];
}

/**
 * Get login history for a person
 */
export function getLoginHistory(personUuid: string, limit: number = 50): AuditLogRecord[] {
	return db
		.prepare(
			`SELECT * FROM audit_log
			 WHERE actor_uuid = ?
			   AND event_type IN ('login', 'logout')
			 ORDER BY timestamp DESC
			 LIMIT ?`
		)
		.all(personUuid, limit) as AuditLogRecord[];
}

/**
 * Clean up old audit logs (for maintenance)
 * Keep logs for retention period (default 90 days)
 */
export function cleanupAuditLogs(retentionDays: number = 90): number {
	const cutoff = new Date(Date.now() - retentionDays * 24 * 60 * 60 * 1000).toISOString();

	const result = db
		.prepare('DELETE FROM audit_log WHERE timestamp < ?')
		.run(cutoff);

	return result.changes;
}
