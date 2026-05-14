/**
 * Scheduler utilities — shared helpers for idempotency and period keys.
 */

import { randomUUID } from 'node:crypto';
import { db } from './db.js';

// ---------------------------------------------------------------------------
// Result type
// ---------------------------------------------------------------------------

export interface JobResult {
	executed: number;
	skipped: number;
	errors: string[];
}

// ---------------------------------------------------------------------------
// Period key helpers
// ---------------------------------------------------------------------------

/** Returns 'YYYY-MM' for the given date (UTC). */
export function monthKey(d: Date = new Date()): string {
	return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}`;
}

/** Returns 'YYYY-WNN' (ISO week) for the given date (UTC). */
export function weekKey(d: Date = new Date()): string {
	const dt = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
	const day = dt.getUTCDay() || 7;
	dt.setUTCDate(dt.getUTCDate() + 4 - day);
	const yearStart = new Date(Date.UTC(dt.getUTCFullYear(), 0, 1));
	const weekNo = Math.ceil(((dt.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
	return `${dt.getUTCFullYear()}-W${String(weekNo).padStart(2, '0')}`;
}

/** Returns 'YYYY-MM-DD' for the given date (UTC). */
export function dayKey(d: Date = new Date()): string {
	return d.toISOString().slice(0, 10);
}

/** Returns 'YYYY' for the given date (UTC). */
export function yearKey(d: Date = new Date()): string {
	return String(d.getUTCFullYear());
}

/**
 * Maps a schedule string to the current period key.
 *  'monthly' → '2025-04'
 *  'weekly'  → '2025-W17'
 *  'daily'   → '2025-04-23'
 */
export function periodKey(schedule: string, d: Date = new Date()): string {
	if (schedule === 'monthly') return monthKey(d);
	if (schedule === 'weekly') return weekKey(d);
	return dayKey(d);
}

// ---------------------------------------------------------------------------
// Idempotency helpers
// ---------------------------------------------------------------------------

export function alreadyRan(job: string, periodKey: string): boolean {
	return (
		db
			.prepare('SELECT 1 FROM scheduler_run WHERE job = ? AND period_key = ?')
			.get(job, periodKey) !== undefined
	);
}

export function markRan(job: string, periodKey: string, result: object = {}): void {
	db.prepare(
		`INSERT OR IGNORE INTO scheduler_run (uuid, job, period_key, ran_at, result_json)
       VALUES (?, ?, ?, ?, ?)`
	).run(randomUUID(), job, periodKey, new Date().toISOString(), JSON.stringify(result));
}

// ---------------------------------------------------------------------------
// Account lookup helper
// ---------------------------------------------------------------------------

export function requireAccount(name: string): string {
	const row = db
		.prepare(`SELECT uuid FROM account WHERE name = ? LIMIT 1`)
		.get(name) as { uuid: string } | undefined;
	if (!row) throw new Error(`Required account "${name}" not found — run pnpm seed first.`);
	return row.uuid;
}
