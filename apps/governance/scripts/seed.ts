#!/usr/bin/env node
// Seed script: creates a person in the governance database (for testing/development only).
// For production, use the /setup page on first launch.
// Usage:
//   DATABASE_PATH=./dev.sqlite pnpm seed --handle=alice --given-name=Alice --family-name=Smith --dob=1990-01-01 --password=testpass123

import * as argon2 from 'argon2';
import { randomUUID } from 'node:crypto';
import { openDatabase } from '@bfs/db';
import { schema } from '../src/lib/server/schema.js';

const args = Object.fromEntries(
	process.argv.slice(2)
		.filter(a => a.startsWith('--'))
		.map(a => {
			const [k, v] = a.slice(2).split('=');
			return [k, v ?? true];
		})
);

const handle     = String(args['handle']);
const givenName  = String(args['given-name']);
const familyName = String(args['family-name']);
const dob        = String(args['dob']);
const password   = String(args['password']);

if (!handle || !givenName || !familyName || !dob || !password) {
	console.error('Error: All parameters are required.');
	console.error('Usage: pnpm seed --handle=alice --given-name=Alice --family-name=Smith --dob=1990-01-01 --password=secure123');
	process.exit(1);
}

const dbPath = process.env.DATABASE_PATH ?? './dev.sqlite';

const db = openDatabase(dbPath);
db.exec(schema);

const existing = db.prepare('SELECT uuid FROM person WHERE handle = ?').get(handle);
if (existing) {
	console.log(`Person with handle @${handle} already exists. Nothing to do.`);
	process.exit(0);
}

const uuid = randomUUID();
const now = new Date().toISOString();
const passwordHash = await argon2.hash(password, { type: argon2.argon2id });

db.transaction(() => {
	db.prepare(
		`INSERT INTO person (uuid, handle, given_name, family_name, date_of_birth, status, joined_at)
		 VALUES (?, ?, ?, ?, ?, 'active', ?)`
	).run(uuid, handle, givenName, familyName, dob, now);

	db.prepare(
		`INSERT INTO credentials (person_uuid, password_hash, password_changed_at, created_at)
		 VALUES (?, ?, ?, ?)`
	).run(uuid, passwordHash, now, now);
})();

console.log(`Created person @${handle} (${givenName} ${familyName})`);
console.log(`Database: ${dbPath}`);
console.log(`UUID: ${uuid}`);
