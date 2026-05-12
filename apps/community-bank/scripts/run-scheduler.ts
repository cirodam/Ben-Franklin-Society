/**
 * CLI entry point for the scheduler.
 *
 * Usage:
 *   pnpm run scheduler
 *
 * Or schedule with cron (run daily at 06:00):
 *   0 6 * * *  cd /path/to/community-bank && pnpm run scheduler >> /var/log/bank-scheduler.log 2>&1
 *
 * Environment variables:
 *   DATABASE_PATH               — path to bank SQLite file (default: ./bank.sqlite)
 *   GOVERNANCE_URL              — URL to governance app (default: http://localhost:5173)
 *   DEMURRAGE_THRESHOLD         — Frank balance threshold for demurrage (default: 5000)
 *   DEMURRAGE_RATE_BPS          — demurrage rate in basis points per month (default: 200 = 2%)
 */

import { runAll } from '../src/lib/server/scheduler.js';

console.log(`[scheduler] Starting — ${new Date().toISOString()}`);

try {
	const results = await runAll();

	for (const [job, res] of Object.entries(results)) {
		const tag = res.errors.length > 0 ? 'WARN' : 'OK  ';
		console.log(`[scheduler] ${tag} ${job}: executed=${res.executed} skipped=${res.skipped} errors=${res.errors.length}`);
		for (const err of res.errors) {
			console.error(`[scheduler]      ERROR: ${err}`);
		}
	}

	const hasErrors = Object.values(results).some((r) => r.errors.length > 0);
	console.log(`[scheduler] Done — ${new Date().toISOString()}`);
	process.exit(hasErrors ? 1 : 0);
} catch (err) {
	console.error(`[scheduler] FATAL: ${err}`);
	process.exit(1);
}
