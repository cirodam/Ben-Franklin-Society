import { db } from '../db.js';
import { randomUUID } from 'crypto';
import { getIdentity, signMessage, verifySignature } from '../lineage/identity.js';
import { getVouchById } from './issuer.js';

export interface VouchVerificationRequest {
	type: 'vouch_verification_request';
	voucher: string; // Handle of the society that issued the vouch
	vouched_for: string; // Handle of the society being vouched for
	requester: string; // Handle of the society requesting verification
	requested_at: string; // ISO timestamp
}

export interface VouchVerificationResponse {
	type: 'vouch_verification_response';
	voucher: string;
	vouched_for: string;
	currently_valid: boolean;
	confidence?: 'strong' | 'moderate' | 'weak';
	statement?: string;
	checked_at: string;
	signature: string; // Voucher's signature over response
}

/**
 * Query a voucher society to verify if a vouch is still valid
 * This queries the voucher's /api/vouching/verify endpoint
 */
export async function queryVoucherForVerification(params: {
	voucherHandle: string;
	vouchedFor: string;
	voucherEndpoint: string;
}): Promise<VouchVerificationResponse | null> {
	const { voucherHandle, vouchedFor, voucherEndpoint } = params;

	const identity = getIdentity();
	if (!identity) {
		throw new Error('Society identity not initialized');
	}

	const request: VouchVerificationRequest = {
		type: 'vouch_verification_request',
		voucher: voucherHandle,
		vouched_for: vouchedFor,
		requester: identity.handle,
		requested_at: new Date().toISOString()
	};

	try {
		const response = await fetch(`${voucherEndpoint}/api/vouching/verify`, {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json'
			},
			body: JSON.stringify(request)
		});

		if (!response.ok) {
			return null;
		}

		const verificationResponse = (await response.json()) as VouchVerificationResponse;

		// Verify the signature
		const message = JSON.stringify({
			type: verificationResponse.type,
			voucher: verificationResponse.voucher,
			vouched_for: verificationResponse.vouched_for,
			currently_valid: verificationResponse.currently_valid,
			confidence: verificationResponse.confidence,
			statement: verificationResponse.statement,
			checked_at: verificationResponse.checked_at
		});

		// Get voucher's public key from societies cache
		const stmt = db.prepare('SELECT public_key FROM societies WHERE handle = ?');
		const row = stmt.get(voucherHandle) as { public_key: string } | undefined;

		if (!row) {
			console.error(`Public key not found for voucher: ${voucherHandle}`);
			return null;
		}

		const isValid = verifySignature(message, verificationResponse.signature, row.public_key);

		if (!isValid) {
			console.error(`Invalid signature on verification response from ${voucherHandle}`);
			return null;
		}

		return verificationResponse;
	} catch (error) {
		console.error(`Failed to query voucher ${voucherHandle}:`, error);
		return null;
	}
}

/**
 * Cache a verification response
 */
export function cacheVerification(response: VouchVerificationResponse): void {
	const verificationId = randomUUID();
	const checkedAt = Math.floor(new Date(response.checked_at).getTime() / 1000);

	const stmt = db.prepare(/* sql */ `
		INSERT INTO vouch_verifications (
			verification_id,
			peer_handle,
			voucher_handle,
			currently_valid,
			confidence,
			checked_at,
			response_signature
		) VALUES (?, ?, ?, ?, ?, ?, ?)
		ON CONFLICT(verification_id) DO UPDATE SET
			currently_valid = excluded.currently_valid,
			confidence = excluded.confidence,
			checked_at = excluded.checked_at,
			response_signature = excluded.response_signature
	`);

	stmt.run(
		verificationId,
		response.vouched_for,
		response.voucher,
		response.currently_valid ? 1 : 0,
		response.confidence || null,
		checkedAt,
		response.signature
	);
}

/**
 * Get cached verification for a peer-voucher pair
 * Returns null if not cached or cache is stale (>24 hours)
 */
export function getCachedVerification(params: {
	peerHandle: string;
	voucherHandle: string;
}): VouchVerificationResponse | null {
	const { peerHandle, voucherHandle } = params;

	const stmt = db.prepare(/* sql */ `
		SELECT *
		FROM vouch_verifications
		WHERE peer_handle = ? AND voucher_handle = ?
		ORDER BY checked_at DESC
		LIMIT 1
	`);

	const row = stmt.get(peerHandle, voucherHandle) as
		| {
				verification_id: string;
				peer_handle: string;
				voucher_handle: string;
				currently_valid: number;
				confidence: string | null;
				checked_at: number;
				response_signature: string;
		  }
		| undefined;

	if (!row) return null;

	// Check if cache is fresh (within 24 hours)
	const now = Math.floor(Date.now() / 1000);
	const age = now - row.checked_at;

	if (age > 86400) {
		// Stale cache (>24 hours)
		return null;
	}

	return {
		type: 'vouch_verification_response',
		voucher: row.voucher_handle,
		vouched_for: row.peer_handle,
		currently_valid: Boolean(row.currently_valid),
		confidence: row.confidence as 'strong' | 'moderate' | 'weak' | undefined,
		checked_at: new Date(row.checked_at * 1000).toISOString(),
		signature: row.response_signature
	};
}

/**
 * Verify a vouch by querying the voucher (with caching)
 * Uses cached response if fresh, otherwise queries voucher endpoint
 */
export async function verifyVouch(params: {
	peerHandle: string;
	voucherHandle: string;
}): Promise<VouchVerificationResponse | null> {
	const { peerHandle, voucherHandle } = params;

	// Check cache first
	const cached = getCachedVerification({ peerHandle, voucherHandle });
	if (cached) {
		return cached;
	}

	// Get voucher endpoint from societies cache
	const stmt = db.prepare('SELECT endpoint FROM societies WHERE handle = ?');
	const row = stmt.get(voucherHandle) as { endpoint: string } | undefined;

	if (!row) {
		console.error(`Endpoint not found for voucher: ${voucherHandle}`);
		return null;
	}

	// Query voucher
	const response = await queryVoucherForVerification({
		voucherHandle,
		vouchedFor: peerHandle,
		voucherEndpoint: row.endpoint
	});

	if (response) {
		// Cache the response
		cacheVerification(response);
	}

	return response;
}

/**
 * Respond to a verification request
 * This is called when another society asks us if we still vouch for someone
 */
export function respondToVerificationRequest(
	request: VouchVerificationRequest
): VouchVerificationResponse {
	const identity = getIdentity();
	if (!identity) {
		throw new Error('Society identity not initialized');
	}

	// Make sure this request is for us
	if (request.voucher !== identity.handle) {
		throw new Error('Verification request is not for this society');
	}

	// Find all vouches we've issued to the vouched_for society
	const stmt = db.prepare(/* sql */ `
		SELECT *
		FROM vouches_issued
		WHERE vouched_for_handle = ?
		ORDER BY issued_at DESC
	`);

	const vouches = stmt.all(request.vouched_for) as Array<{
		vouch_id: string;
		vouched_for_handle: string;
		vouch_type: string;
		confidence: string;
		statement: string | null;
		issued_at: number;
		currently_valid: number;
		invalidated_at: number | null;
		invalidation_reason: string | null;
		signature: string;
	}>;

	// Check if we have any valid vouches
	const validVouches = vouches.filter((v) => v.currently_valid === 1);

	let currently_valid = false;
	let confidence: 'strong' | 'moderate' | 'weak' | undefined;
	let statement: string | undefined;

	if (validVouches.length > 0) {
		// Use the most recent valid vouch
		const mostRecent = validVouches[0];
		currently_valid = true;
		confidence = mostRecent.confidence as 'strong' | 'moderate' | 'weak';
		statement = mostRecent.statement || undefined;
	}

	const checkedAt = new Date().toISOString();

	// Create response (without signature)
	const response: Omit<VouchVerificationResponse, 'signature'> = {
		type: 'vouch_verification_response',
		voucher: identity.handle,
		vouched_for: request.vouched_for,
		currently_valid,
		confidence,
		statement,
		checked_at: checkedAt
	};

	// Sign the response
	const message = JSON.stringify({
		type: response.type,
		voucher: response.voucher,
		vouched_for: response.vouched_for,
		currently_valid: response.currently_valid,
		confidence: response.confidence,
		statement: response.statement,
		checked_at: response.checked_at
	});

	const signature = signMessage(message);

	return {
		...response,
		signature
	};
}

/**
 * Get all verifications for a peer
 * Queries multiple vouchers and aggregates results
 */
export async function getPeerVerifications(peerHandle: string): Promise<{
	peer_handle: string;
	verifications: VouchVerificationResponse[];
	valid_count: number;
	invalid_count: number;
}> {
	// Get all credentials the peer holds (vouchers who have vouched for them)
	const stmt = db.prepare(/* sql */ `
		SELECT DISTINCT voucher_handle
		FROM vouch_credentials
		WHERE vouched_for = ?
	`);

	const vouchers = stmt.all(peerHandle) as Array<{ voucher_handle: string }>;

	const verifications: VouchVerificationResponse[] = [];
	let validCount = 0;
	let invalidCount = 0;

	// Query each voucher
	for (const { voucher_handle } of vouchers) {
		const verification = await verifyVouch({
			peerHandle,
			voucherHandle: voucher_handle
		});

		if (verification) {
			verifications.push(verification);
			if (verification.currently_valid) {
				validCount++;
			} else {
				invalidCount++;
			}
		}
	}

	return {
		peer_handle: peerHandle,
		verifications,
		valid_count: validCount,
		invalid_count: invalidCount
	};
}
