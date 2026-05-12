/**
 * CLI entry point for mailbox sync.
 *
 * Usage:
 *   DATABASE_PATH=./mail.sqlite \
 *   GOVERNANCE_URL=http://localhost:5173 \
 *   pnpm sync
 *
 * Exits 1 if any errors occurred during sync.
 */

import { syncMailboxes } from '../src/lib/server/sync.js';

const started = new Date().toISOString();
console.log(JSON.stringify({ event: 'sync_start', at: started }));

let result;
try {
	result = await syncMailboxes();
} catch (err) {
	console.error(JSON.stringify({ event: 'sync_fatal', error: String(err), at: new Date().toISOString() }));
	process.exit(1);
}

const finished = new Date().toISOString();
console.log(
	JSON.stringify({
		event:     'sync_complete',
		at:        finished,
		created:   result.created,
		updated:   result.updated,
		suspended: result.suspended,
		errors:    result.errors.length,
	})
);

if (result.errors.length > 0) {
	for (const e of result.errors) {
		console.error(JSON.stringify({ event: 'sync_error', message: e }));
	}
	process.exit(1);
}
