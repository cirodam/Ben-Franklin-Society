#!/usr/bin/env tsx
/**
 * Grant bank admin access to a person
 * 
 * Usage:
 *   tsx scripts/grant-bank-admin.ts <handle>
 */

import { openDatabase } from '@bfs/db';
import { existsSync } from 'fs';

const dbPath = process.env.DATABASE_PATH || './dev.sqlite';

if (!existsSync(dbPath)) {
	console.error(`Database not found: ${dbPath}`);
	process.exit(1);
}

const db = openDatabase(dbPath);

// Get handle from command line args
const handle = process.argv[2];
if (!handle) {
	console.error('Usage: tsx scripts/grant-bank-admin.ts <handle>');
	process.exit(1);
}

// Get person by handle
const person = db
	.prepare('SELECT * FROM person WHERE handle = ?')
	.get(handle) as { uuid: string; handle: string } | undefined;

if (!person) {
	console.error(`Person not found: @${handle}`);
	process.exit(1);
}

// Get @community-bank association
const bankAssoc = db
	.prepare('SELECT * FROM association WHERE handle = ?')
	.get('community-bank') as { uuid: string; handle: string } | undefined;

if (!bankAssoc) {
	console.error('Community Bank Association not found. Run pnpm seed:special first.');
	process.exit(1);
}

// Create "Administrators" role if it doesn't exist
let adminRole = db
	.prepare('SELECT * FROM role WHERE association_uuid = ? AND title = ?')
	.get(bankAssoc.uuid, 'Administrators') as { uuid: string } | undefined;

if (!adminRole) {
	const roleUuid = crypto.randomUUID();
	db.prepare(`
		INSERT INTO role (uuid, association_uuid, title, description, created_at)
		VALUES (?, ?, ?, ?, datetime('now'))
	`).run(
		roleUuid,
		bankAssoc.uuid,
		'Administrators',
		'Bank administrators with full system access'
	);
	console.log(`Created role: Administrators`);
	adminRole = { uuid: roleUuid };
}

// Add person to the Administrators role if not already assigned
const existingAssignment = db
	.prepare('SELECT * FROM role_assignment WHERE role_uuid = ? AND person_uuid = ? AND removed_at IS NULL')
	.get(adminRole.uuid, person.uuid);

if (!existingAssignment) {
	db.prepare(`
		INSERT INTO role_assignment (uuid, role_uuid, person_uuid, assigned_at)
		VALUES (?, ?, ?, datetime('now'))
	`).run(
		crypto.randomUUID(),
		adminRole.uuid,
		person.uuid
	);
	console.log(`Assigned @${handle} to Administrators role in @${bankAssoc.handle}`);
} else {
	console.log(`@${handle} already assigned to Administrators role in @${bankAssoc.handle}`);
}

// Grant bank:admin permission
const adminPerm = db
	.prepare('SELECT * FROM role_permission WHERE role_uuid = ? AND app = ? AND permission = ?')
	.get(adminRole.uuid, 'bank', 'admin');

if (!adminPerm) {
	db.prepare(`
		INSERT INTO role_permission (role_uuid, app, permission)
		VALUES (?, ?, ?)
	`).run(
		adminRole.uuid,
		'bank',
		'admin'
	);
	console.log(`Granted bank:admin permission to Administrators role`);
}

// Grant act_as permission
const actAsPerm = db
	.prepare('SELECT * FROM role_permission WHERE role_uuid = ? AND app = ? AND permission = ?')
	.get(adminRole.uuid, 'governance', 'act_as');

if (!actAsPerm) {
	db.prepare(`
		INSERT INTO role_permission (role_uuid, app, permission)
		VALUES (?, ?, ?)
	`).run(
		adminRole.uuid,
		'governance',
		'act_as'
	);
	console.log(`Granted governance:act_as permission to Administrators role`);
}

console.log(`\n✅ @${handle} now has bank admin access via @${bankAssoc.handle}`);
console.log(`   They can switch context to the Community Bank Association to access admin features.`);

db.close();
