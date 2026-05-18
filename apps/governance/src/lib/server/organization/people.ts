import { randomUUID } from 'node:crypto';
import { db } from '../db.js';
import { hashPassword } from '../infrastructure/auth.js';
import { revokeAllSessions } from '../infrastructure/auth.js';

// --- Types ---

export interface Person {
	uuid: string;
	handle: string;
	given_name: string;
	family_name: string;
	date_of_birth: string;
	phone: string | null;
	status: 'active' | 'suspended' | 'revoked';
	joined_at: string;
	revoked_at: string | null;
}

export interface NewPersonInput {
	handle: string;
	given_name: string;
	family_name: string;
	date_of_birth: string;
	phone?: string;
	initial_password: string;
}

// --- Helpers ---

function now(): string {
	return new Date().toISOString();
}

// --- Queries ---

export function getPersonByUuid(uuid: string): Person | null {
	return (
		(db.prepare('SELECT * FROM person WHERE uuid = ?').get(uuid) as Person | undefined) ?? null
	);
}

export function getPersonByHandle(handle: string): Person | null {
	return (
		(db.prepare('SELECT * FROM person WHERE handle = ?').get(handle) as Person | undefined) ??
		null
	);
}

export function listPeople(opts: { status?: Person['status'] } = {}): Person[] {
	if (opts.status) {
		return db
			.prepare('SELECT * FROM person WHERE status = ? ORDER BY family_name, given_name')
			.all(opts.status) as Person[];
	}
	return db
		.prepare('SELECT * FROM person ORDER BY family_name, given_name')
		.all() as Person[];
}

// --- Writes ---

export async function createPerson(input: NewPersonInput): Promise<Person> {
	// Handle must be unique across both person and association tables
	const handleTaken =
		db.prepare('SELECT 1 FROM person WHERE handle = ?').get(input.handle) ??
		db.prepare('SELECT 1 FROM association WHERE handle = ?').get(input.handle);
	if (handleTaken) throw new Error(`Handle already taken: ${input.handle}`);

	const uuid = randomUUID();
	const joinedAt = now();
	const passwordHash = await hashPassword(input.initial_password);

	db.transaction(() => {
		db.prepare(
			`INSERT INTO person (uuid, handle, given_name, family_name, date_of_birth, phone, status, joined_at)
			 VALUES (?, ?, ?, ?, ?, ?, 'active', ?)`
		).run(uuid, input.handle, input.given_name, input.family_name, input.date_of_birth, input.phone ?? null, joinedAt);

		db.prepare(
			`INSERT INTO credentials (person_uuid, password_hash, password_changed_at, created_at)
			 VALUES (?, ?, ?, ?)`
		).run(uuid, passwordHash, joinedAt, joinedAt);
	})();

	return getPersonByUuid(uuid)!;
}

export function updatePersonProfile(
	uuid: string,
	updates: { given_name?: string; family_name?: string; date_of_birth?: string; phone?: string | null }
): void {
	const fields: string[] = [];
	const params: unknown[] = [];
	if (updates.given_name !== undefined)    { fields.push('given_name = ?');    params.push(updates.given_name); }
	if (updates.family_name !== undefined)   { fields.push('family_name = ?');   params.push(updates.family_name); }
	if (updates.date_of_birth !== undefined) { fields.push('date_of_birth = ?'); params.push(updates.date_of_birth); }
	if (updates.phone !== undefined)         { fields.push('phone = ?');          params.push(updates.phone); }
	if (!fields.length) return;
	params.push(uuid);
	db.prepare(`UPDATE person SET ${fields.join(', ')} WHERE uuid = ?`).run(...params);
}

export function updateHandle(uuid: string, newHandle: string): void {
	const handleTaken =
		db.prepare('SELECT 1 FROM person WHERE handle = ? AND uuid != ?').get(newHandle, uuid) ??
		db.prepare('SELECT 1 FROM association WHERE handle = ?').get(newHandle);
	if (handleTaken) throw new Error(`Handle already taken: ${newHandle}`);

	db.prepare('UPDATE person SET handle = ? WHERE uuid = ?').run(newHandle, uuid);
}

export function suspendPerson(uuid: string): void {
	db.prepare("UPDATE person SET status = 'suspended' WHERE uuid = ?").run(uuid);
	revokeAllSessions(uuid);
}

export function reinstatePerson(uuid: string): void {
	db.prepare("UPDATE person SET status = 'active' WHERE uuid = ?").run(uuid);
}

export function revokePerson(uuid: string): void {
	db.prepare(
		"UPDATE person SET status = 'revoked', revoked_at = ? WHERE uuid = ?"
	).run(now(), uuid);
	revokeAllSessions(uuid);
}
