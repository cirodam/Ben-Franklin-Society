/**
 * CLI entry point for the scheduler.
 *
 * Usage:
 *   pnpm run scheduler
 *
 * Or schedule with cron (run daily at 06:00):
 *   0 6 * * *  cd /path/to/community-bank && pnpm run scheduler >> /var/log/bank-scheduler.log 2>&1
 *
 * The scheduler executes active grouped transfers on their configured schedule.
 * This is mechanical execution only - policy decisions are made by people creating
 * the transfers via the bank UI.
 *
 * Environment variables:
 *   DATABASE_PATH               — path to bank SQLite file (default: ./bank.sqlite)
 */

import { runAll } from '../src/lib/server/scheduler.js';

console.log(`[scheduler] Starting — ${new Date().toISOString()}`);

try {
	const results = runAll();

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
