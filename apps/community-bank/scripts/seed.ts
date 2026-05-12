/**
 * Seed the Community Bank database with the special accounts that underpin
 * the Frank economy.  Run with:
 *
 *   DATABASE_PATH=./bank.sqlite \
 *   GOVERNANCE_URL=http://localhost:5173 \
 *   tsx scripts/seed.ts
 *
 * The script is idempotent — re-running it is safe.
 */

import { openDatabase } from '@bfs/db';
import { randomUUID } from 'node:crypto';
import { schema } from '../src/lib/server/schema.js';
import { lookupAssociationByHandle } from '../src/lib/server/governance-api.js';

const bankPath = process.env.DATABASE_PATH ?? './bank.sqlite';

const bankDb = openDatabase(bankPath);

// Apply the schema (idempotent — all CREATE TABLE IF NOT EXISTS).
bankDb.exec(schema);

// Fetch an association UUID from Governance by handle via REST API.
async function govAssoc(handle: string): Promise<string> {
	const assoc = await lookupAssociationByHandle(handle);
	if (!assoc) throw new Error(`Governance association not found: ${handle}`);
	return assoc.uuid;
}

function now(): string {
	return new Date().toISOString();
}

function ensureAccount(principal_uuid: string, name: string, handle_cache: string): void {
	const existing = bankDb
		.prepare('SELECT 1 FROM account WHERE principal_uuid = ? AND name = ?')
		.get(principal_uuid, name);
	if (existing) {
		console.log(`  skip  [${handle_cache}] ${name} — already exists`);
		return;
	}
	bankDb
		.prepare(
			`INSERT INTO account (uuid, principal_uuid, name, handle_cache, balance, status, created_at)
       VALUES (?, ?, ?, ?, 0, 'active', ?)`
		)
		.run(randomUUID(), principal_uuid, name, handle_cache, now());
	console.log(`  +     [${handle_cache}] ${name}`);
}

console.log('Seeding Community Bank special accounts…');

const centralBankUuid  = await govAssoc('central-bank');
const societyUuid      = await govAssoc('society');
const sifUuid          = await govAssoc('social-insurance');

// Central Bank — its balance will be ≤ 0; absolute value = total Frank supply.
ensureAccount(centralBankUuid, 'Central Bank', 'central-bank');

// Treasury — receives issuance and demurrage; source of Assembly appropriations.
ensureAccount(societyUuid, 'Treasury', 'society');

// Social Insurance Fund — disburses monthly allowances.
ensureAccount(sifUuid, 'Social Insurance Fund', 'social-insurance');

// Clearinghouse — the society's inter-society net position account.
ensureAccount(societyUuid, 'Clearinghouse', 'society');

console.log('Done.');
