import * as argon2 from 'argon2';
import { db } from '../db.js';
import { logAuditEvent } from './audit.js';
import {
	createSession,
	resolveSession,
	revokeSession,
	revokeAllSessions,
	type Session
} from './auth/sessions.js';
import { getAvailableContexts, updateActingAs, type Context } from './auth/contexts.js';
import { isLockedOut, recordFailedAttempt, clearFailedAttempts } from './auth/lockout.js';

// Re-export session management
export { createSession, resolveSession, revokeSession, revokeAllSessions, type Session };

// Re-export context switching
export { getAvailableContexts, updateActingAs, type Context };

// Re-export lockout functions
export { isLockedOut, recordFailedAttempt, clearFailedAttempts };

/**
 * Extract client IP address from request headers.
 * Checks x-forwarded-for first (for reverse proxies), then x-real-ip, falls back to 'unknown'.
 */
export function getClientIp(request: Request): string {
	return request.headers.get('x-forwarded-for') ?? request.headers.get('x-real-ip') ?? 'unknown';
}

// --- Password ---

export async function hashPassword(password: string): Promise<string> {
	return argon2.hash(password, { type: argon2.argon2id });
}

export async function verifyPassword(hash: string, password: string): Promise<boolean> {
	return argon2.verify(hash, password);
}

// --- Authenticate ---

// Full login flow: look up person by handle, check lockout, verify password,
// record failure / clear on success, create session.
export async function authenticatePerson(
	handle: string,
	password: string,
	opts: { userAgent?: string; ipAddress?: string } = {}
): Promise<
	| { type: 'ok'; refreshToken: string }
	| { type: 'locked' }
	| { type: 'invalid' }
> {
	const person = db
		.prepare('SELECT uuid, status FROM person WHERE handle = ?')
		.get(handle) as { uuid: string; status: string } | undefined;

	if (!person || person.status !== 'active') {
		// Log failed login attempt - user not found or inactive
		logAuditEvent({
			eventType: 'login_failed',
			targetUuid: person?.uuid,
			ipAddress: opts.ipAddress,
			userAgent: opts.userAgent,
			success: false,
			details: { reason: 'invalid_credentials', handle }
		});
		return { type: 'invalid' };
	}

	if (isLockedOut(person.uuid)) {
		// Log failed login attempt - account locked
		logAuditEvent({
			eventType: 'login_failed',
			targetUuid: person.uuid,
			ipAddress: opts.ipAddress,
			userAgent: opts.userAgent,
			success: false,
			details: { reason: 'account_locked', handle }
		});
		return { type: 'locked' };
	}

	const creds = db
		.prepare('SELECT password_hash FROM credentials WHERE person_uuid = ?')
		.get(person.uuid) as { password_hash: string } | undefined;

	if (!creds) {
		// Log failed login attempt - no credentials found
		logAuditEvent({
			eventType: 'login_failed',
			targetUuid: person.uuid,
			ipAddress: opts.ipAddress,
			userAgent: opts.userAgent,
			success: false,
			details: { reason: 'no_credentials', handle }
		});
		return { type: 'invalid' };
	}

	const ok = await verifyPassword(creds.password_hash, password);
	if (!ok) {
		recordFailedAttempt(person.uuid);
		const nowLocked = isLockedOut(person.uuid);

		// Log failed login attempt - wrong password
		logAuditEvent({
			eventType: 'login_failed',
			targetUuid: person.uuid,
			ipAddress: opts.ipAddress,
			userAgent: opts.userAgent,
			success: false,
			details: { reason: 'wrong_password', handle, locked: nowLocked }
		});

		if (nowLocked) {
			// Log account lockout event
			logAuditEvent({
				eventType: 'account_locked',
				targetUuid: person.uuid,
				ipAddress: opts.ipAddress,
				userAgent: opts.userAgent,
				details: { reason: 'too_many_failed_attempts' }
			});
			return { type: 'locked' };
		}
		return { type: 'invalid' };
	}

	clearFailedAttempts(person.uuid);
	const { refreshToken, sessionUuid } = createSession(person.uuid, opts);

	// Log successful login
	logAuditEvent({
		eventType: 'login',
		actorUuid: person.uuid,
		actingAsUuid: person.uuid,
		sessionUuid,
		ipAddress: opts.ipAddress,
		userAgent: opts.userAgent,
		success: true,
		details: { handle }
	});

	return { type: 'ok', refreshToken };
}
