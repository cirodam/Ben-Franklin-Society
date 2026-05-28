import { db } from './db.js';
import { hash, verify } from '@node-rs/bcrypt';
import { nanoid } from 'nanoid';
import type { User } from '$lib/types.js';

const SALT_ROUNDS = 10;

export async function registerUser(username: string, password: string, displayName: string): Promise<User> {
	const existingUser = getUserByUsername(username);
	if (existingUser) {
		throw new Error('Username already exists');
	}

	const uuid = nanoid();
	const passwordHash = await hash(password, SALT_ROUNDS);
	const now = new Date().toISOString();

	const stmt = db.prepare(`
		INSERT INTO user (uuid, username, password_hash, display_name, created_at)
		VALUES (?, ?, ?, ?, ?)
	`);

	stmt.run(uuid, username, passwordHash, displayName, now);

	return getUser(uuid)!;
}

export async function authenticateUser(username: string, password: string): Promise<User | null> {
	const user = getUserByUsername(username);
	if (!user) {
		return null;
	}

	const passwordMatch = await verify(password, user.passwordHash);
	if (!passwordMatch) {
		return null;
	}

	return user;
}

export function getUser(uuid: string): User | undefined {
	const stmt = db.prepare(`
		SELECT * FROM user WHERE uuid = ?
	`);

	const row = stmt.get(uuid) as any;
	if (!row) return undefined;

	return {
		uuid: row.uuid,
		username: row.username,
		passwordHash: row.password_hash,
		displayName: row.display_name,
		createdAt: row.created_at
	};
}

export function getUserByUsername(username: string): User | undefined {
	const stmt = db.prepare(`
		SELECT * FROM user WHERE username = ?
	`);

	const row = stmt.get(username) as any;
	if (!row) return undefined;

	return {
		uuid: row.uuid,
		username: row.username,
		passwordHash: row.password_hash,
		displayName: row.display_name,
		createdAt: row.created_at
	};
}
