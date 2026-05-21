/**
 * Seed the Community Bank database with the special accounts that underpin
 * the Frank economy.  Run with:
 *
 *   DATABASE_PATH=./bank.sqlite \
 *   CENTRAL_BANK_UUID=... \
 *   TREASURY_UUID=... \
 *   SIF_UUID=... \
 *   CLEARINGHOUSE_UUID=... \
 *   tsx scripts/seed.ts
 *
 * The script is idempotent — re-running it is safe.
 *
 * UUIDs should be copied from the governance app's associations.
 */

import { openDatabase } from '@bfs/db';
import { randomUUID } from 'node:crypto';
import { schema } from '../src/lib/server/schema.js';

const bankPath = process.env.DATABASE_PATH ?? './bank.sqlite';

const bankDb = openDatabase(bankPath);

// Apply the schema (idempotent — all CREATE TABLE IF NOT EXISTS).
bankDb.exec(schema);

function now(): string {
	return new Date().toISOString();
}

function ensureAccount(
	owner_uuid: string,
	name: string,
	handle_cache: string,
	account_type: 'standard' | 'official' | 'system' = 'standard'
): void {
	const existing = bankDb
		.prepare('SELECT 1 FROM account WHERE owner_uuid = ? AND name = ?')
		.get(owner_uuid, name);
	if (existing) {
		console.log(`  skip  [${handle_cache}] ${name} — already exists`);
		return;
	}
	bankDb
		.prepare(
			`INSERT INTO account (uuid, owner_uuid, name, handle_cache, balance, status, account_type, created_at)
       VALUES (?, ?, ?, ?, 0, 'active', ?, ?)`
		)
		.run(
			randomUUID(),
			owner_uuid,
			name,
			handle_cache,
			account_type,
			now()
		);
	console.log(`  +     [${handle_cache}] ${name} (${account_type})`);
}

function ensureAccountOwnerPermissions(owner_uuid: string, can_auto_pull: boolean): void {
	const existing = bankDb
		.prepare('SELECT 1 FROM account_owner_permissions WHERE owner_uuid = ?')
		.get(owner_uuid);
	if (existing) {
		console.log(`  skip  permissions for ${owner_uuid.slice(0, 8)}… — already exist`);
		return;
	}
	bankDb
		.prepare(
			`INSERT INTO account_owner_permissions (owner_uuid, can_auto_pull, created_at)
       VALUES (?, ?, ?)`
		)
		.run(owner_uuid, can_auto_pull ? 1 : 0, now());
	console.log(`  +     permissions for ${owner_uuid.slice(0, 8)}… (can_auto_pull=${can_auto_pull})`);
}

console.log('Seeding Community Bank special accounts…');

// Get UUIDs from environment variables (copied from governance associations)
const centralBankUuid = process.env.CENTRAL_BANK_UUID;
const treasuryUuid = process.env.TREASURY_UUID;
const sifUuid = process.env.SIF_UUID;
const clearinghouseUuid = process.env.CLEARINGHOUSE_UUID;

if (!centralBankUuid || !treasuryUuid || !sifUuid || !clearinghouseUuid) {
	console.error('Error: Missing required environment variables:');
	console.error('  CENTRAL_BANK_UUID, TREASURY_UUID, SIF_UUID, CLEARINGHOUSE_UUID');
	console.error('  These should be copied from governance app associations.');
	process.exit(1);
}

// Central Bank — its balance will be ≤ 0; absolute value = total Frank supply.
ensureAccount(centralBankUuid, 'Central Bank', 'central-bank', 'system');
ensureAccountOwnerPermissions(centralBankUuid, true);

// Treasury — receives issuance and demurrage; source of Assembly appropriations.
ensureAccount(treasuryUuid, 'Treasury', 'treasury', 'official');
ensureAccountOwnerPermissions(treasuryUuid, true);

// Social Insurance Fund — disburses monthly allowances.
ensureAccount(sifUuid, 'Social Insurance Fund', 'social-insurance', 'official');

// Clearinghouse — the society's inter-society net position account.
ensureAccount(clearinghouseUuid, 'Clearinghouse', 'society', 'official');

console.log('Done.');
