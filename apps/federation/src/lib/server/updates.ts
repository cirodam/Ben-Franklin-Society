import { db } from './db.js';
import { verify } from 'crypto';
import { lookupSociety } from './queries.js';

/**
 * Verify a signed update request
 * Ensures request is authentic and recent (< 5 minutes old)
 */
export function verifyUpdateRequest(params: {
	handle: string;
	requestBody: string;
	signatureBase64: string;
}): { valid: boolean; error?: string } {
	const { handle, requestBody, signatureBase64 } = params;

	// 1. Get society's public key
	const society = lookupSociety(handle);
	if (!society) {
		return { valid: false, error: 'Society not found' };
	}

	// 2. Parse request body to check timestamp
	let request: any;
	try {
		request = JSON.parse(requestBody);
	} catch {
		return { valid: false, error: 'Invalid JSON in request body' };
	}

	if (!request.timestamp) {
		return { valid: false, error: 'Missing timestamp' };
	}

	// Check timestamp is recent (< 5 minutes old)
	const age = Date.now() - request.timestamp;
	if (age > 300_000) {
		return { valid: false, error: 'Request expired (timestamp too old)' };
	}

	if (age < -60_000) {
		return { valid: false, error: 'Request timestamp in future' };
	}

	// 3. Verify signature
	try {
		const signature = Buffer.from(signatureBase64, 'base64');
		const valid = verify(
			null,
			Buffer.from(requestBody),
			society.public_key,
			signature
		);

		if (!valid) {
			return { valid: false, error: 'Invalid signature' };
		}

		return { valid: true };
	} catch (error) {
		return { valid: false, error: 'Signature verification failed' };
	}
}

/**
 * Update society connectivity information
 */
export function updateConnectivity(params: {
	handle: string;
	bfsUrl?: string;
	url?: string;
	ipAddress?: string;
	port?: number;
	signature: string;
}): { success: boolean; error?: string } {
	const { handle, bfsUrl, url, ipAddress, port, signature } = params;

	const society = lookupSociety(handle);
	if (!society) {
		return { success: false, error: 'Society not found' };
	}

	// Check status - revoked societies cannot update
	if (society.status === 'revoked') {
		return { success: false, error: 'Cannot update: Society has been revoked' };
	}

	// Update society record - only update fields that are provided
	const updates: string[] = [];
	const values: any[] = [];

	if (bfsUrl !== undefined) {
		updates.push('bfs_url = ?');
		values.push(bfsUrl);
	}
	if (url !== undefined) {
		updates.push('url = ?');
		values.push(url);
	}
	if (ipAddress !== undefined) {
		updates.push('ip_address = ?');
		values.push(ipAddress);
	}
	if (port !== undefined) {
		updates.push('port = ?');
		values.push(port);
	}

	if (updates.length === 0) {
		return { success: false, error: 'No updates provided' };
	}

	values.push(handle);

	const stmt = db.prepare(/* sql */ `
		UPDATE societies 
		SET ${updates.join(', ')}
		WHERE handle = ?
	`);

	stmt.run(...values);

	return { success: true };
}

/**
 * Change society status
 */
export function changeStatus(params: {
	handle: string;
	newStatus: 'active' | 'suspended' | 'revoked';
	reason?: string;
	changedBy: string;
}): { success: boolean; error?: string } {
	const { handle, newStatus } = params;

	const society = lookupSociety(handle);
	if (!society) {
		return { success: false, error: 'Society not found' };
	}

	// No-op if status hasn't changed
	if (society.status === newStatus) {
		return { success: true };
	}

	// Validate status transition
	const validStatuses = ['active', 'suspended', 'revoked'];
	if (!validStatuses.includes(newStatus)) {
		return { success: false, error: `Invalid status: ${newStatus}` };
	}

	// Update society status
	db.prepare(/* sql */ `
		UPDATE societies 
		SET status = ?
		WHERE handle = ?
	`).run(newStatus, handle);

	return { success: true };
}

/**
 * Update society metrics (self-reported data)
 * Societies report their current member count and person-years
 */
export function updateMetrics(params: {
	handle: string;
	peopleCount?: number;
	personYears?: number;
}): { success: boolean; error?: string } {
	const { handle, peopleCount, personYears } = params;

	const society = lookupSociety(handle);
	if (!society) {
		return { success: false, error: 'Society not found' };
	}

	// Check status - revoked societies cannot update
	if (society.status === 'revoked') {
		return { success: false, error: 'Cannot update: Society has been revoked' };
	}

	// Update society metrics - only update fields that are provided
	const updates: string[] = [];
	const values: any[] = [];

	if (peopleCount !== undefined) {
		updates.push('people_count = ?');
		values.push(peopleCount);
	}
	if (personYears !== undefined) {
		updates.push('person_years = ?');
		values.push(personYears);
	}

	if (updates.length === 0) {
		return { success: false, error: 'No updates provided' };
	}

	values.push(handle);

	const stmt = db.prepare(/* sql */ `
		UPDATE societies 
		SET ${updates.join(', ')}
		WHERE handle = ?
	`);

	stmt.run(...values);

	return { success: true };
}

/**
 * Record Floren issuance to a society
 * Called internally by Federation when minting Florens
 */
export function recordFlorenIssuance(params: {
	uuid: string;
	amount: number;
}): { success: boolean; error?: string } {
	const { uuid, amount } = params;

	if (amount <= 0) {
		return { success: false, error: 'Amount must be positive' };
	}

	// Update issued_florens (increment by amount)
	const stmt = db.prepare(/* sql */ `
		UPDATE societies 
		SET issued_florens = issued_florens + ?
		WHERE uuid = ?
	`);

	const result = stmt.run(amount, uuid);

	if (result.changes === 0) {
		return { success: false, error: 'Society not found' };
	}

	return { success: true };
}

