/**
 * Migration script to move can_auto_pull from account table to account_owner_permissions table.
 * 
 * Run with:
 *   DATABASE_PATH=./bank.sqlite tsx scripts/migrate-account-owner-permissions.ts
 * 
 * This script:
 * 1. Creates account_owner_permissions table
 * 2. Migrates existing can_auto_pull data by principal_uuid
 * 3. Drops can_auto_pull column from account table (requires table rebuild)
 * 
 * This script is idempotent - safe to run multiple times.
 */

import { openDatabase } from '@bfs/db';

const bankPath = process.env.DATABASE_PATH ?? './bank.sqlite';
const db = openDatabase(bankPath);

console.log('🔧 Migrating account owner permissions...\n');

// Step 1: Check if account_owner_permissions table exists
const tables = db
	.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='account_owner_permissions'")
	.all() as Array<{ name: string }>;

const hasPermissionsTable = tables.length > 0;

if (!hasPermissionsTable) {
	console.log('  ✓ Creating account_owner_permissions table...');
	db.exec(`
		CREATE TABLE account_owner_permissions (
			principal_uuid TEXT PRIMARY KEY,
			can_auto_pull  INTEGER NOT NULL DEFAULT 0,
			created_at     TEXT NOT NULL
		)
	`);
} else {
	console.log('  ⊘ account_owner_permissions table already exists');
}

// Step 2: Check if can_auto_pull column exists in account table
const tableInfo = db.prepare('PRAGMA table_info(account)').all() as Array<{ name: string }>;
const hasCanAutoPull = tableInfo.some(col => col.name === 'can_auto_pull');

if (hasCanAutoPull) {
	console.log('\n🔄 Migrating can_auto_pull data...\n');

	// Get distinct principal_uuids with can_auto_pull=1
	const principalsWithAutoPull = db
		.prepare(
			`SELECT DISTINCT principal_uuid 
       FROM account 
       WHERE can_auto_pull = 1`
		)
		.all() as Array<{ principal_uuid: string }>;

	console.log(`  Found ${principalsWithAutoPull.length} principal(s) with can_auto_pull enabled`);

	// Insert into account_owner_permissions
	const now = new Date().toISOString();
	for (const { principal_uuid } of principalsWithAutoPull) {
		const existing = db
			.prepare('SELECT 1 FROM account_owner_permissions WHERE principal_uuid = ?')
			.get(principal_uuid);

		if (!existing) {
			db.prepare(
				`INSERT INTO account_owner_permissions (principal_uuid, can_auto_pull, created_at)
         VALUES (?, 1, ?)`
			).run(principal_uuid, now);
			console.log(`  ✓ Migrated permissions for principal ${principal_uuid.slice(0, 8)}…`);
		} else {
			console.log(`  ⊘ Permissions already exist for principal ${principal_uuid.slice(0, 8)}…`);
		}
	}

	console.log('\n🔨 Dropping can_auto_pull column from account table...');
	console.log('  (This requires rebuilding the table)\n');

	// SQLite doesn't support DROP COLUMN directly, so we need to:
	// 1. Create new table without can_auto_pull
	// 2. Copy data
	// 3. Drop old table
	// 4. Rename new table

	db.exec(`
		-- Create new account table without can_auto_pull
		CREATE TABLE account_new (
			uuid           TEXT PRIMARY KEY,
			principal_uuid TEXT NOT NULL,
			name           TEXT NOT NULL,
			handle_cache   TEXT NOT NULL,
			balance        INTEGER NOT NULL DEFAULT 0,
			status         TEXT NOT NULL DEFAULT 'active',
			account_type   TEXT NOT NULL DEFAULT 'standard',
			created_at     TEXT NOT NULL,
			UNIQUE (principal_uuid, name)
		);

		-- Copy data from old table
		INSERT INTO account_new (uuid, principal_uuid, name, handle_cache, balance, status, account_type, created_at)
		SELECT uuid, principal_uuid, name, handle_cache, balance, status, account_type, created_at
		FROM account;

		-- Drop old table
		DROP TABLE account;

		-- Rename new table
		ALTER TABLE account_new RENAME TO account;
	`);

	console.log('  ✓ Successfully dropped can_auto_pull column\n');
} else {
	console.log('  ⊘ can_auto_pull column does not exist in account table\n');
}

console.log('✅ Migration complete!\n');

// Summary
const permissionsCount = db
	.prepare('SELECT COUNT(*) as count FROM account_owner_permissions')
	.get() as { count: number };
console.log('📊 Summary:');
console.log(`  Principals with can_auto_pull: ${permissionsCount.count}`);
console.log();
