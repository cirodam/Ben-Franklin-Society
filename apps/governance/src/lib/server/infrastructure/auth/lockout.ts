import { db } from '../../db.js';

const LOCKOUT_THRESHOLD = 5;
const LOCKOUT_DURATION_MS = 15 * 60 * 1000; // 15 minutes

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
