import { randomBytes, createHash, randomUUID } from 'node:crypto';
import { db } from '../../db.js';
import { logAuditEvent } from '../audit.js';

const SESSION_EXPIRY_HOURS = 1;

function now(): string {
	return new Date().toISOString();
}

function sessionExpiry(): string {
	return new Date(Date.now() + SESSION_EXPIRY_HOURS * 60 * 60 * 1000).toISOString();
}

// SHA-256 is appropriate for refresh tokens: they are 256-bit random values,
// not user-chosen passwords. Argon2id's brute-force resistance is irrelevant
// at this entropy level, and would add meaningful latency on every token refresh.
function hashToken(token: string): string {
	return createHash('sha256').update(token).digest('hex');
}

export interface Session {
	uuid: string;
	person_uuid: string;
	acting_as_uuid: string;
	expires_at: string;
	revoked_at: string | null;
}

// The refresh token is structured as `{sessionUuid}.{rawSecret}` so that
// resolution is a single indexed lookup (by UUID) followed by a hash comparison,
// with no table scan required.
export function createSession(
	personUuid: string,
	opts: { userAgent?: string; ipAddress?: string } = {}
): { refreshToken: string; sessionUuid: string } {
	const uuid = randomUUID();
	const rawSecret = randomBytes(32).toString('base64url');
	const tokenHash = hashToken(rawSecret);
	const refreshToken = `${uuid}.${rawSecret}`;

	db.prepare(
		`INSERT INTO session
			(uuid, person_uuid, refresh_token_hash, acting_as_uuid, user_agent, ip_address,
			 created_at, last_active_at, expires_at)
		 VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
	).run(
		uuid,
		personUuid,
		tokenHash,
		personUuid, // acting_as defaults to the person themselves
		opts.userAgent ?? null,
		opts.ipAddress ?? null,
		now(),
		now(),
		sessionExpiry()
	);

	// Log session creation
	logAuditEvent({
		eventType: 'session_created',
		actorUuid: personUuid,
		actingAsUuid: personUuid,
		sessionUuid: uuid,
		ipAddress: opts.ipAddress,
		userAgent: opts.userAgent,
		success: true
	});

	return { refreshToken, sessionUuid: uuid };
}

export function resolveSession(refreshToken: string): Session | null {
	const dot = refreshToken.indexOf('.');
	if (dot === -1) return null;

	const sessionUuid = refreshToken.slice(0, dot);
	const rawSecret = refreshToken.slice(dot + 1);
	const tokenHash = hashToken(rawSecret);

	const touchAndReturn = db.transaction(() => {
		const session = db
			.prepare(
				`SELECT uuid, person_uuid, acting_as_uuid, refresh_token_hash, expires_at, revoked_at
				 FROM session WHERE uuid = ?`
			)
			.get(sessionUuid) as (Session & { refresh_token_hash: string }) | undefined;

		if (!session) return null;
		if (session.revoked_at) return null;
		if (new Date(session.expires_at) < new Date()) return null;
		if (session.refresh_token_hash !== tokenHash) return null;

		db.prepare('UPDATE session SET last_active_at = ? WHERE uuid = ?').run(now(), sessionUuid);

		return session;
	});

	return touchAndReturn();
}

export function revokeSession(sessionUuid: string): void {
	db.prepare('UPDATE session SET revoked_at = ? WHERE uuid = ?').run(now(), sessionUuid);
}

export function revokeAllSessions(personUuid: string): void {
	db.prepare(
		'UPDATE session SET revoked_at = ? WHERE person_uuid = ? AND revoked_at IS NULL'
	).run(now(), personUuid);
}
