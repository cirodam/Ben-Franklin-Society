/**
 * Seed the Mail app database with mailboxes for all existing active members
 * and associations in the Governance database.
 *
 * Idempotent — safe to re-run.
 *
 * Usage:
 *   DATABASE_PATH=./mail.sqlite \
 *   GOVERNANCE_URL=http://localhost:5173 \
 *   pnpm seed
 */

import { openDatabase } from '@bfs/db';
import { schema } from '../src/lib/server/schema.js';
import { syncMailboxes } from '../src/lib/server/sync.js';

const mailPath = process.env.DATABASE_PATH ?? './mail.sqlite';

const mailDb = openDatabase(mailPath);

mailDb.exec(schema);

console.log('Seeding Mail app mailboxes…');

const result = await syncMailboxes();

console.log(`Done. Created=${result.created} Updated=${result.updated} Suspended=${result.suspended}`);
if (result.errors.length > 0) {
	console.error('Errors:', result.errors);
	process.exit(1);
}
