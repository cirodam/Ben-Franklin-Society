/**
 * Migration script to add account_type and can_auto_pull columns to existing accounts.
 * 
 * Run with:
 *   DATABASE_PATH=./bank.sqlite tsx scripts/migrate-account-metadata.ts
 * 
 * This script is idempotent - safe to run multiple times.
 */

import { openDatabase } from '@bfs/db';

const bankPath = process.env.DATABASE_PATH ?? './bank.sqlite';
const db = openDatabase(bankPath);

console.log('🔧 Migrating account metadata...\n');

// Check if columns already exist
const tableInfo = db.prepare('PRAGMA table_info(account)').all() as Array<{ name: string }>;
const hasAccountType = tableInfo.some(col => col.name === 'account_type');
const hasCanAutoPull = tableInfo.some(col => col.name === 'can_auto_pull');

// Add columns if they don't exist
if (!hasAccountType) {
	console.log('  ✓ Adding account_type column...');
	db.exec(`ALTER TABLE account ADD COLUMN account_type TEXT NOT NULL DEFAULT 'standard'`);
} else {
	console.log('  ⊘ account_type column already exists');
}

if (!hasCanAutoPull) {
	console.log('  ✓ Adding can_auto_pull column...');
	db.exec(`ALTER TABLE account ADD COLUMN can_auto_pull INTEGER NOT NULL DEFAULT 0`);
} else {
	console.log('  ⊘ can_auto_pull column already exists');
}

console.log('\n🔍 Updating account types for system accounts...\n');

// Get all accounts
const accounts = db.prepare('SELECT uuid, name, principal_uuid FROM account').all() as Array<{
	uuid: string;
	name: string;
	principal_uuid: string;
}>;

let systemCount = 0;
let officialCount = 0;
let standardCount = 0;

for (const account of accounts) {
	let accountType: 'system' | 'official' | 'standard' = 'standard';
	
	// System accounts: Central Bank
	if (account.name === 'Central Bank') {
		accountType = 'system';
		systemCount++;
	}
	// Official accounts: Treasury, Social Insurance Fund
	else if (account.name === 'Treasury' || account.name === 'Social Insurance Fund') {
		accountType = 'official';
		officialCount++;
	}
	// All others: standard
	else {
		accountType = 'standard';
		standardCount++;
	}
	
	// Update the account
	db.prepare('UPDATE account SET account_type = ? WHERE uuid = ?').run(accountType, account.uuid);
	console.log(`  ${accountType === 'system' ? '🏛️ ' : accountType === 'official' ? '🏢' : '👤'} ${account.name} → ${accountType}`);
}

console.log('\n📊 Summary:');
console.log(`  System accounts:   ${systemCount}`);
console.log(`  Official accounts: ${officialCount}`);
console.log(`  Standard accounts: ${standardCount}`);
console.log(`  Total:            ${accounts.length}`);

console.log('\n✅ Migration complete!\n');
