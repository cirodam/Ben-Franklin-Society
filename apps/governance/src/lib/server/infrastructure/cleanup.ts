/**
 * Database Cleanup
 * 
 * Scheduled jobs to remove expired sessions, auth codes, and old audit logs.
 */

import { db } from '../db.js';
import { logAuditEvent } from './audit.js';

/**
 * Remove expired sessions from the database
 * 
 * Sessions are considered expired if:
 * - expires_at is in the past
 * - revoked_at is not null
 */
export function cleanupExpiredSessions(): number {
	const now = new Date().toISOString();
	
	const result = db
		.prepare(
			`DELETE FROM session 
			 WHERE expires_at < ? 
			    OR revoked_at IS NOT NULL`
		)
		.run(now);

	if (result.changes > 0) {
		console.log(`[cleanup] Removed ${result.changes} expired session(s)`);
		logAuditEvent({
			eventType: 'session_expired',
			success: true,
			details: { count: result.changes }
		});
	}

	return result.changes;
}

/**
 * Remove expired OIDC refresh tokens from the database
 * 
 * Refresh tokens are considered expired if:
 * - expires_at is in the past
 * - revoked_at is not null
 */
export function cleanupExpiredRefreshTokens(): number {
	const now = new Date().toISOString();
	
	const result = db
		.prepare(
			`DELETE FROM oidc_refresh_token 
			 WHERE expires_at < ? 
			    OR revoked_at IS NOT NULL`
		)
		.run(now);

	if (result.changes > 0) {
		console.log(`[cleanup] Removed ${result.changes} expired OIDC refresh token(s)`);
		logAuditEvent({
			eventType: 'oidc_token_revoked',
			success: true,
			details: { count: result.changes, reason: 'expired' }
		});
	}

	return result.changes;
}

/**
 * Clean up old audit logs beyond retention period
 * Default: 90 days
 */
export function cleanupOldAuditLogs(retentionDays: number = 90): number {
	const cutoff = new Date(Date.now() - retentionDays * 24 * 60 * 60 * 1000).toISOString();

	const result = db
		.prepare('DELETE FROM audit_log WHERE timestamp < ?')
		.run(cutoff);

	if (result.changes > 0) {
		console.log(`[cleanup] Removed ${result.changes} old audit log(s) older than ${retentionDays} days`);
	}

	return result.changes;
}

/**
 * Run all cleanup jobs
 */
export function runCleanupJobs(): void {
	console.log('[cleanup] Running scheduled cleanup jobs...');
	cleanupExpiredSessions();
	cleanupExpiredRefreshTokens();
	cleanupOldAuditLogs();
	console.log('[cleanup] Cleanup jobs complete');
}

/**
 * Schedule cleanup jobs to run periodically
 * Default: once per hour
 */
export function scheduleCleanupJobs(intervalMs: number = 60 * 60 * 1000): NodeJS.Timeout {
	console.log(`[cleanup] Scheduling cleanup jobs to run every ${intervalMs / 1000 / 60} minutes`);
	
	// Run once immediately on startup
	runCleanupJobs();
	
	// Then schedule to run periodically
	return setInterval(runCleanupJobs, intervalMs);
}
