/**
 * Floren Command Outbox - Transactional outbox pattern for reliable Floren issuance
 * 
 * Commands are written to the outbox when Florens are issued to a society.
 * A background worker (or manual trigger) polls for undelivered commands and attempts delivery.
 */

import { randomUUID } from 'node:crypto';
import { db } from './db.js';
import { lookupSocietyByUuid } from './queries.js';

export interface FlorenCommand {
	uuid: string;
	society_uuid: string;
	command_type: string;
	payload: string; // JSON
	created_at: string;
	delivered_at: string | null;
	failed_attempts: number;
	last_error: string | null;
	next_retry_after: string | null;
}

export interface FlorenMintCommandPayload {
	amount: number;
	owner_uuid: string; // Association UUID (usually Treasury)
	reason: string;
	performed_by_uuid: string; // Federation system UUID
}

/**
 * Queue a Floren mint command to be sent to a society's Community Bank
 */
export function queueFlorenMintCommand(params: {
	societyUuid: string;
	payload: FlorenMintCommandPayload;
}): string {
	const { societyUuid, payload } = params;
	const uuid = randomUUID();
	const now = new Date().toISOString();

	db.prepare(
		`INSERT INTO floren_command_outbox (uuid, society_uuid, command_type, payload, created_at, failed_attempts)
		 VALUES (?, ?, 'mint', ?, ?, 0)`
	).run(uuid, societyUuid, JSON.stringify(payload), now);

	return uuid;
}

/**
 * Get pending commands ready to be delivered (not yet delivered and past retry backoff)
 */
export function getPendingFlorenCommands(limit: number = 10): FlorenCommand[] {
	const now = new Date().toISOString();

	return db
		.prepare(
			`SELECT * FROM floren_command_outbox
		 WHERE delivered_at IS NULL
		   AND (next_retry_after IS NULL OR next_retry_after <= ?)
		 ORDER BY created_at
		 LIMIT ?`
		)
		.all(now, limit) as FlorenCommand[];
}

/**
 * Mark a command as successfully delivered
 */
export function markFlorenCommandDelivered(uuid: string): void {
	const now = new Date().toISOString();

	db.prepare(
		`UPDATE floren_command_outbox
		 SET delivered_at = ?
		 WHERE uuid = ?`
	).run(now, uuid);
}

/**
 * Record a failed delivery attempt with exponential backoff
 */
export function recordFlorenCommandFailure(uuid: string, error: string): void {
	const command = db
		.prepare('SELECT failed_attempts FROM floren_command_outbox WHERE uuid = ?')
		.get(uuid) as { failed_attempts: number } | undefined;

	if (!command) return;

	const attempts = command.failed_attempts + 1;

	// Exponential backoff: 1min, 2min, 4min, 8min, 16min, 32min, 1hr, 2hr, 4hr, 8hr
	const backoffMinutes = Math.min(Math.pow(2, attempts - 1), 480); // Cap at 8 hours
	const nextRetry = new Date(Date.now() + backoffMinutes * 60 * 1000).toISOString();

	db.prepare(
		`UPDATE floren_command_outbox
		 SET failed_attempts = ?,
		     last_error = ?,
		     next_retry_after = ?
		 WHERE uuid = ?`
	).run(attempts, error, nextRetry, uuid);
}

/**
 * Attempt to deliver a single Floren command to a society's Community Bank
 */
export async function deliverFlorenCommand(command: FlorenCommand): Promise<void> {
	// Look up society details to get endpoint
	const society = lookupSocietyByUuid(command.society_uuid);
	if (!society) {
		throw new Error(`Society not found: ${command.society_uuid}`);
	}

	// Determine Community Bank endpoint
	// For now, use bfs_url or url - will need proper endpoint resolution
	const baseUrl = society.bfs_url || society.url;
	if (!baseUrl) {
		throw new Error(`No URL configured for society: ${society.handle}`);
	}

	// Construct Community Bank endpoint
	// Assume Community Bank is at https://bank.{domain} or {domain}/bank
	const bankUrl = baseUrl.replace('governance.', 'bank.');
	const endpoint = `${bankUrl}/api/mint-florens`;

	console.log(`[deliverFlorenCommand] Delivering to ${endpoint}`);

	const response = await fetch(endpoint, {
		method: 'POST',
		headers: {
			'Content-Type': 'application/json'
			// TODO: Add Authorization header with FEDERATION_SHARED_SECRET
			// 'Authorization': `Bearer ${FEDERATION_SHARED_SECRET}`
		},
		body: command.payload,
		// Add timeout to avoid hanging
		signal: AbortSignal.timeout(10000) // 10 second timeout
	});

	if (!response.ok) {
		const errorText = await response.text();
		throw new Error(`Community Bank returned ${response.status}: ${errorText}`);
	}

	const result = await response.json();
	console.log(`[deliverFlorenCommand] Success:`, result);
}

/**
 * Process all pending Floren commands
 * Can be called from a background worker or admin endpoint
 */
export async function processFlorenCommands(limit: number = 10): Promise<{
	processed: number;
	succeeded: number;
	failed: number;
}> {
	const commands = getPendingFlorenCommands(limit);
	let succeeded = 0;
	let failed = 0;

	for (const command of commands) {
		try {
			await deliverFlorenCommand(command);
			markFlorenCommandDelivered(command.uuid);
			succeeded++;
			console.log(`✓ Delivered Floren mint to society ${command.society_uuid}`);
		} catch (error) {
			const message = error instanceof Error ? error.message : 'Unknown error';
			console.error(`✗ Failed to deliver Floren mint ${command.uuid}:`, message);
			recordFlorenCommandFailure(command.uuid, message);
			failed++;
		}
	}

	return {
		processed: commands.length,
		succeeded,
		failed
	};
}

/**
 * Start background worker that processes Floren commands every 10 seconds
 * Returns a function to stop the worker
 */
export function startFlorenOutboxWorker(): () => void {
	let stopped = false;

	const poll = async () => {
		if (stopped) return;

		try {
			const result = await processFlorenCommands();
			if (result.processed > 0) {
				console.log(
					`[Floren Outbox Worker] Processed ${result.processed} commands: ${result.succeeded} succeeded, ${result.failed} failed`
				);
			}
		} catch (error) {
			console.error('[Floren Outbox Worker] Error processing commands:', error);
		}

		// Schedule next poll
		if (!stopped) {
			setTimeout(poll, 10000); // Poll every 10 seconds
		}
	};

	// Start first poll
	setTimeout(poll, 1000); // Initial delay of 1 second

	console.log('[Floren Outbox Worker] Started');

	// Return stop function
	return () => {
		stopped = true;
		console.log('[Floren Outbox Worker] Stopped');
	};
}
