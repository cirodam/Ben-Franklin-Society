import * as argon2 from 'argon2';
import { randomBytes, createHash, randomUUID } from 'node:crypto';
import { db } from '../db.js';

const LOCKOUT_THRESHOLD = 5;
const LOCKOUT_DURATION_MS = 15 * 60 * 1000; // 15 minutes
const SESSION_EXPIRY_DAYS = 30;

// --- Helpers ---

function now(): string {
	return new Date().toISOString();
}

function sessionExpiry(): string {
	return new Date(Date.now() + SESSION_EXPIRY_DAYS * 24 * 60 * 60 * 1000).toISOString();
}

// SHA-256 is appropriate for refresh tokens: they are 256-bit random values,
// not user-chosen passwords. Argon2id's brute-force resistance is irrelevant
// at this entropy level, and would add meaningful latency on every token refresh.
function hashToken(token: string): string {
	return createHash('sha256').update(token).digest('hex');
}

// --- Types ---

export interface Session {
	uuid: string;
	person_uuid: string;
	acting_as_uuid: string;
	expires_at: string;
	revoked_at: string | null;
}

// --- Password ---

export async function hashPassword(password: string): Promise<string> {
	return argon2.hash(password, { type: argon2.argon2id });
}

export async function verifyPassword(hash: string, password: string): Promise<boolean> {
	return argon2.verify(hash, password);
}

// --- Lockout ---

export function isLockedOut(personUuid: string): boolean {
	const row = db
		.prepare('SELECT locked_until FROM credentials WHERE person_uuid = ?')
		.get(personUuid) as { locked_until: string | null } | undefined;
	if (!row?.locked_until) return false;
	return new Date(row.locked_until) > new Date();
}

export function recordFailedAttempt(personUuid: string): void {
	const row = db
		.prepare('SELECT failed_attempt_count FROM credentials WHERE person_uuid = ?')
		.get(personUuid) as { failed_attempt_count: number } | undefined;
	if (!row) return;

	const newCount = row.failed_attempt_count + 1;
	const lockedUntil =
		newCount >= LOCKOUT_THRESHOLD
			? new Date(Date.now() + LOCKOUT_DURATION_MS).toISOString()
			: null;

	db.prepare(
		'UPDATE credentials SET failed_attempt_count = ?, locked_until = ? WHERE person_uuid = ?'
	).run(newCount, lockedUntil, personUuid);
}

export function clearFailedAttempts(personUuid: string): void {
	db.prepare(
		'UPDATE credentials SET failed_attempt_count = 0, locked_until = NULL WHERE person_uuid = ?'
	).run(personUuid);
}

// --- Sessions ---

// The refresh token is structured as `{sessionUuid}.{rawSecret}` so that
// resolution is a single indexed lookup (by UUID) followed by a hash comparison,
// with no table scan required.
export function createSession(
	personUuid: string,
	opts: { userAgent?: string; ipAddress?: string } = {}
): { refreshToken: string } {
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

	return { refreshToken };
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

export function updateActingAs(sessionUuid: string, actingAsUuid: string): void {
	db.prepare('UPDATE session SET acting_as_uuid = ? WHERE uuid = ?').run(
		actingAsUuid,
		sessionUuid
	);
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

	if (!person || person.status !== 'active') return { type: 'invalid' };
	if (isLockedOut(person.uuid)) return { type: 'locked' };

	const creds = db
		.prepare('SELECT password_hash FROM credentials WHERE person_uuid = ?')
		.get(person.uuid) as { password_hash: string } | undefined;

	if (!creds) return { type: 'invalid' };

	const ok = await verifyPassword(creds.password_hash, password);
	if (!ok) {
		recordFailedAttempt(person.uuid);
		if (isLockedOut(person.uuid)) return { type: 'locked' };
		return { type: 'invalid' };
	}

	clearFailedAttempts(person.uuid);
	const { refreshToken } = createSession(person.uuid, opts);
	return { type: 'ok', refreshToken };
}
