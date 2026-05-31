/**
 * Bank Command Outbox - Transactional outbox pattern for reliable command delivery to Community Bank
 * 
 * Commands are written to the outbox in the same transaction as the domain event that triggered them.
 * A background worker polls for undelivered commands and attempts delivery with exponential backoff.
 */

import { randomUUID } from 'node:crypto';
import { db } from '../db.js';
import { getCommunityConfig } from '../infrastructure/config.js';
import { issueServiceToken } from '../infrastructure/oidc/tokens.js';

// Cached service token with expiration
let cachedServiceToken: { token: string; expiresAt: number } | null = null;

/**
 * Get a valid service access token for calling satellite apps
 * Governance issues tokens for itself directly (it's the auth server)
 */
async function getServiceAccessToken(): Promise<string> {
	// Return cached token if still valid (with 5min buffer)
	if (cachedServiceToken && cachedServiceToken.expiresAt > Date.now() + 300000) {
		return cachedServiceToken.token;
	}

	// Issue a service token for governance itself
	// Use a special "governance-internal" client ID that doesn't need registration
	const tokenResponse = issueServiceToken({ clientId: 'governance-internal' });
	
	// Cache the token
	cachedServiceToken = {
		token: tokenResponse.access_token,
		expiresAt: Date.now() + (tokenResponse.expires_in * 1000)
	};

	return cachedServiceToken.token;
}

export interface BankCommand {
	uuid: string;
	command_type: string;
	payload: string; // JSON
	created_at: string;
	delivered_at: string | null;
	failed_attempts: number;
	last_error: string | null;
	next_retry_after: string | null;
}

export interface MintCommandPayload {
	amount: number;
	owner_uuid: string; // Association UUID - bank will look up the account
	reason: string;
	performed_by_uuid: string;
}

export interface CreateAccountCommandPayload {
	owner_uuid: string;
	name: string;
	demurrage_exempt: boolean;
}

/**
 * Queue a mint command to be sent to the bank
 */
export function queueMintCommand(payload: MintCommandPayload): string {
	const uuid = randomUUID();
	const now = new Date().toISOString();
	
	db.prepare(
		`INSERT INTO bank_command_outbox (uuid, command_type, payload, created_at, failed_attempts)
		 VALUES (?, 'mint', ?, ?, 0)`
	).run(uuid, JSON.stringify(payload), now);
	
	return uuid;
}

/**
 * Queue an account creation command to be sent to the bank
 */
export function queueCreateAccountCommand(payload: CreateAccountCommandPayload): string {
	const uuid = randomUUID();
	const now = new Date().toISOString();
	
	db.prepare(
		`INSERT INTO bank_command_outbox (uuid, command_type, payload, created_at, failed_attempts)
		 VALUES (?, 'create_account', ?, ?, 0)`
	).run(uuid, JSON.stringify(payload), now);
	
	return uuid;
}

/**
 * Get pending commands ready to be delivered (not yet delivered and past retry backoff)
 */
export function getPendingCommands(limit: number = 10): BankCommand[] {
	const now = new Date().toISOString();
	
	return db.prepare(
		`SELECT * FROM bank_command_outbox
		 WHERE delivered_at IS NULL
		   AND (next_retry_after IS NULL OR next_retry_after <= ?)
		 ORDER BY created_at
		 LIMIT ?`
	).all(now, limit) as BankCommand[];
}

/**
 * Mark a command as successfully delivered
 */
export function markCommandDelivered(uuid: string): void {
	const now = new Date().toISOString();
	
	db.prepare(
		`UPDATE bank_command_outbox
		 SET delivered_at = ?
		 WHERE uuid = ?`
	).run(now, uuid);
}

/**
 * Record a failed delivery attempt with exponential backoff
 */
export function recordFailedAttempt(uuid: string, error: string): void {
	const command = db.prepare(
		'SELECT failed_attempts FROM bank_command_outbox WHERE uuid = ?'
	).get(uuid) as { failed_attempts: number } | undefined;
	
	if (!command) return;
	
	const attempts = command.failed_attempts + 1;
	
	// Exponential backoff: 1min, 2min, 4min, 8min, 16min, 32min, 1hr, 2hr, 4hr, 8hr
	const backoffMinutes = Math.min(Math.pow(2, attempts - 1), 480); // Cap at 8 hours
	const nextRetry = new Date(Date.now() + backoffMinutes * 60 * 1000).toISOString();
	
	db.prepare(
		`UPDATE bank_command_outbox
		 SET failed_attempts = ?,
		     last_error = ?,
		     next_retry_after = ?
		 WHERE uuid = ?`
	).run(attempts, error, nextRetry, uuid);
}

/**
 * Attempt to deliver a single command to the bank
 */
export async function deliverCommand(command: BankCommand): Promise<void> {
	const bankUrl = getCommunityConfig('bank_url');
	
	if (!bankUrl) {
		throw new Error('Bank URL not configured');
	}
	
	// Map command types to API endpoints
	const endpointMap: Record<string, string> = {
		'mint': '/api/mint',
		'create_account': '/api/accounts'
	};
	
	const path = endpointMap[command.command_type];
	if (!path) {
		throw new Error(`Unknown command type: ${command.command_type}`);
	}
	
	const endpoint = `${bankUrl}${path}`;
	
	// Get service access token for authentication
	const serviceToken = await getServiceAccessToken();
	
	const response = await fetch(endpoint, {
		method: 'POST',
		headers: {
			'Content-Type': 'application/json',
			'Authorization': `Bearer ${serviceToken}`
		},
		body: command.payload,
		// Add timeout to avoid hanging
		signal: AbortSignal.timeout(10000) // 10 second timeout
	});
	
	if (!response.ok) {
		const errorText = await response.text();
		throw new Error(`Bank returned ${response.status}: ${errorText}`);
	}
}

/**
 * Process pending commands - to be called by background worker
 */
export async function processPendingCommands(): Promise<{ 
	processed: number; 
	succeeded: number; 
	failed: number 
}> {
	const commands = getPendingCommands(10);
	let succeeded = 0;
	let failed = 0;
	
	for (const command of commands) {
		try {
			await deliverCommand(command);
			markCommandDelivered(command.uuid);
			succeeded++;
			console.log(`✓ Delivered ${command.command_type} command ${command.uuid}`);
		} catch (error) {
			const errorMessage = error instanceof Error ? error.message : 'Unknown error';
			recordFailedAttempt(command.uuid, errorMessage);
			failed++;
			console.error(`✗ Failed to deliver ${command.command_type} command ${command.uuid}:`, errorMessage);
		}
	}
	
	return {
		processed: commands.length,
		succeeded,
		failed
	};
}

/**
 * Start background worker that processes commands every 10 seconds
 * Returns a function to stop the worker
 */
export function startOutboxWorker(): () => void {
	let stopped = false;
	
	const poll = async () => {
		if (stopped) return;
		
		try {
			const result = await processPendingCommands();
			if (result.processed > 0) {
				console.log(`[Outbox Worker] Processed ${result.processed} commands: ${result.succeeded} succeeded, ${result.failed} failed`);
			}
		} catch (error) {
			console.error('[Outbox Worker] Error processing commands:', error);
		}
		
		// Schedule next poll
		if (!stopped) {
			setTimeout(poll, 10000); // Poll every 10 seconds
		}
	};
	
	// Start first poll
	setTimeout(poll, 1000); // Initial delay of 1 second
	
	console.log('[Outbox Worker] Started');
	
	// Return stop function
	return () => {
		stopped = true;
		console.log('[Outbox Worker] Stopped');
	};
}
