#!/usr/bin/env node
// Seed special/authoritative associations that govern satellite apps
// Usage: DATABASE_PATH=./dev.sqlite pnpm tsx scripts/seed-special-associations.ts

import { randomUUID } from 'node:crypto';
import { openDatabase } from '@bfs/db';
import { schema } from '../src/lib/server/schema.js';

const dbPath = process.env.DATABASE_PATH ?? './dev.sqlite';
const db = openDatabase(dbPath);
db.exec(schema);

const now = new Date().toISOString();

const specialAssociations = [
	{
		handle: 'community-bank',
		name: 'Community Bank Association',
		abbreviation: 'CBA',
		governs_app: 'bank',
		type: 'service'
	},
	{
		handle: 'communications-service',
		name: 'Communications Service Association',
		abbreviation: 'CSA',
		governs_app: 'mail',
		type: 'service'
	},
	{
		handle: 'commerce-service',
		name: 'Commerce Service Association',
		abbreviation: 'CSA',
		governs_app: 'marketplace',
		type: 'service'
	}
];

db.transaction(() => {
	for (const assoc of specialAssociations) {
		const existing = db.prepare('SELECT uuid FROM association WHERE handle = ?').get(assoc.handle);
		
		if (existing) {
			// Update existing association to set governs_app
			db.prepare(`
				UPDATE association 
				SET governs_app = ?, type = ?, abbreviation = ?
				WHERE handle = ?
			`).run(assoc.governs_app, assoc.type, assoc.abbreviation, assoc.handle);
			console.log(`Updated existing association @${assoc.handle} (governs: ${assoc.governs_app})`);
		} else {
			// Create new association
			const uuid = randomUUID();
			db.prepare(`
				INSERT INTO association (
					uuid, handle, name, abbreviation, type, status, governs_app, created_at
				) VALUES (?, ?, ?, ?, ?, 'active', ?, ?)
			`).run(uuid, assoc.handle, assoc.name, assoc.abbreviation, assoc.type, assoc.governs_app, now);
			console.log(`Created association @${assoc.handle} (${assoc.name}) - governs: ${assoc.governs_app}`);
		}
	}
})();

console.log('\nSpecial associations seeded successfully!');
console.log(`Database: ${dbPath}`);
