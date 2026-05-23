import { db } from '../../db.js';
import { randomUUID } from 'crypto';
import { getIdentity, signMessageWithOurKey, verifySignature, type FoundingRecord } from './identity.js';
import { createFoundingRecord } from './founding.js';
import { cacheSociety, canAdoptChild } from '../societies.js';

export interface AdoptionRequest {
	request_id: string;
	child_uuid: string;
	child_handle: string;
	child_public_key: string;
	parent_uuid: string;
	parent_handle: string;
	message: string | null;
	status: 'pending' | 'approved' | 'rejected';
	requested_at: number;
	responded_at: number | null;
	response_message: string | null;
	child_endpoint: string | null;
	child_bfs_url: string | null;
	child_ipv4: string | null;
	child_ipv6: string | null;
	signature: string | null; // Child's signature on the request
}

/**
 * Request adoption from a parent society
 * Called by the CHILD society wanting to be adopted
 */
export async function requestAdoption(params: {
	parentUrl: string; // URL of parent society (e.g., https://philadelphia.bfs)
	message?: string;
}): Promise<{
	success: boolean;
	request_id?: string;
	error?: string;
}> {
	const identity = getIdentity();
	if (!identity) {
		return { success: false, error: 'Society identity not initialized' };
	}

	// Check if we already have a parent
	if (identity.parent_uuid) {
		return { success: false, error: 'Already have a parent. Cannot request adoption.' };
	}

	try {
		// 1. Fetch parent's identity
		const response = await fetch(`${params.parentUrl}/api/federation/identity`);
		if (!response.ok) {
			return { success: false, error: 'Failed to fetch parent identity' };
		}

		const parentIdentity = await response.json();

		// 2. Create and sign adoption request
		const requestId = randomUUID();
		const requestTimestamp = Math.floor(Date.now() / 1000);
		
		// Create the request payload (what we'll sign)
		const requestPayload = {
			request_id: requestId,
			child_uuid: identity.uuid,
			child_handle: identity.handle,
			child_public_key: identity.public_key,
			parent_uuid: parentIdentity.uuid,
			message: params.message || null,
			requested_at: requestTimestamp,
			// Include our connectivity information
			child_endpoint: null, // TODO: Get from config
			child_bfs_url: null, // TODO: Get from config
			child_ipv4: null, // TODO: Get from config
			child_ipv6: null // TODO: Get from config
		};
		
		// Sign the request to prove we control our private key
		const messageToSign = JSON.stringify(requestPayload);
		const signature = signMessageWithOurKey(messageToSign);

		// 3. Send adoption request to parent with signature
		const adoptionResponse = await fetch(`${params.parentUrl}/api/federation/adoption/request`, {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({
				...requestPayload,
				signature
			})
		});

		if (!adoptionResponse.ok) {
			const error = await adoptionResponse.json();
			return { success: false, error: error.error || 'Adoption request failed' };
		}

		// 3. Cache parent society locally
		cacheSociety({
			uuid: parentIdentity.uuid,
			handle: parentIdentity.handle,
			url: params.parentUrl,
			publicKey: parentIdentity.public_key,
			parentUuid: parentIdentity.parent_uuid || null
		});

		return { success: true, request_id: requestId };
	} catch (error) {
		console.error('Adoption request error:', error);
		return { success: false, error: 'Failed to send adoption request' };
	}
}

/**
 * Receive an adoption request from a child society
 * Called by the PARENT society receiving the request
 */
export function receiveAdoptionRequest(params: {
	request_id: string;
	child_uuid: string;
	child_handle: string;
	child_public_key: string;
	message?: string;
	child_endpoint?: string;
	child_bfs_url?: string;
	child_ipv4?: string;
	child_ipv6?: string;
	requested_at: number;
	signature: string;
}): { success: boolean; error?: string } {
	const identity = getIdentity();
	if (!identity) {
		return { success: false, error: 'Society identity not initialized' };
	}

	// Verify the child's signature on the request
	const requestPayload = {
		request_id: params.request_id,
		child_uuid: params.child_uuid,
		child_handle: params.child_handle,
		child_public_key: params.child_public_key,
		parent_uuid: identity.uuid,
		message: params.message || null,
		requested_at: params.requested_at,
		child_endpoint: params.child_endpoint || null,
		child_bfs_url: params.child_bfs_url || null,
		child_ipv4: params.child_ipv4 || null,
		child_ipv6: params.child_ipv6 || null
	};
	
	const messageToVerify = JSON.stringify(requestPayload);
	const signatureValid = verifySignature(messageToVerify, params.signature, params.child_public_key);
	
	if (!signatureValid) {
		return { success: false, error: 'Invalid signature: Child does not control their private key' };
	}

	// Check if we can adopt another child (max 5)
	if (!canAdoptChild()) {
		return { success: false, error: 'Cannot adopt: Maximum children limit reached (5)' };
	}

	// Check if request already exists
	const existing = db
		.prepare('SELECT request_id FROM adoption_requests WHERE child_uuid = ? AND parent_uuid = ?')
		.get(params.child_uuid, identity.uuid) as { request_id: string } | undefined;

	if (existing) {
		return { success: false, error: 'Adoption request already exists' };
	}

	// Store the request with signature
	const stmt = db.prepare(/* sql */ `
		INSERT INTO adoption_requests (
			request_id,
			child_uuid,
			child_handle,
			child_public_key,
			parent_uuid,
			parent_handle,
			message,
			status,
			child_endpoint,
			child_bfs_url,
			child_ipv4,
			child_ipv6,
			requested_at,
			signature
		) VALUES (?, ?, ?, ?, ?, ?, ?, 'pending', ?, ?, ?, ?, ?, ?)
	`);

	stmt.run(
		params.request_id,
		params.child_uuid,
		params.child_handle,
		params.child_public_key,
		identity.uuid,
		identity.handle,
		params.message || null,
		params.child_endpoint || null,
		params.child_bfs_url || null,
		params.child_ipv4 || null,
		params.child_ipv6 || null,
		params.requested_at,
		params.signature
	);

	return { success: true };
}

/**
 * Get pending adoption requests for this society (as parent)
 */
export function getPendingAdoptionRequests(): AdoptionRequest[] {
	const identity = getIdentity();
	if (!identity) return [];

	const stmt = db.prepare(/* sql */ `
		SELECT * FROM adoption_requests
		WHERE parent_uuid = ? AND status = 'pending'
		ORDER BY requested_at DESC
	`);

	return stmt.all(identity.uuid) as AdoptionRequest[];
}

/**
 * Get all adoption requests (any status) for this society
 */
export function getAllAdoptionRequests(): AdoptionRequest[] {
	const identity = getIdentity();
	if (!identity) return [];

	const stmt = db.prepare(/* sql */ `
		SELECT * FROM adoption_requests
		WHERE parent_uuid = ?
		ORDER BY requested_at DESC
	`);

	return stmt.all(identity.uuid) as AdoptionRequest[];
}

/**
 * Approve an adoption request
 * Called by the PARENT society to approve a child
 */
export async function approveAdoption(params: {
	request_id: string;
	response_message?: string;
}): Promise<{
	success: boolean;
	founding_record?: FoundingRecord;
	error?: string;
}> {
	const identity = getIdentity();
	if (!identity) {
		return { success: false, error: 'Society identity not initialized' };
	}

	// Get the adoption request
	const request = db
		.prepare('SELECT * FROM adoption_requests WHERE request_id = ? AND parent_uuid = ?')
		.get(params.request_id, identity.uuid) as AdoptionRequest | undefined;

	if (!request) {
		return { success: false, error: 'Adoption request not found' };
	}

	if (request.status !== 'pending') {
		return { success: false, error: `Request already ${request.status}` };
	}

	// Check capacity again (in case it changed)
	if (!canAdoptChild()) {
		return { success: false, error: 'Cannot adopt: Maximum children limit reached (5)' };
	}

	try {
		// 1. Create founding record
		const foundingRecord = createFoundingRecord({
			childHandle: request.child_handle,
			childUuid: request.child_uuid,
			childPublicKey: request.child_public_key
		});

		// 2. Cache child in our societies table
		cacheSociety({
			uuid: request.child_uuid,
			handle: request.child_handle,
			url: request.child_endpoint || null,
			bfsUrl: request.child_bfs_url || null,
			ipv4: request.child_ipv4 || null,
			ipv6: request.child_ipv6 || null,
			publicKey: request.child_public_key,
			parentUuid: identity.uuid, // We are their parent!
			foundingRecordJson: JSON.stringify(foundingRecord),
			foundedAt: Math.floor(Date.now() / 1000)
		});

		// 3. Update adoption request status
		const now = Math.floor(Date.now() / 1000);
		db.prepare(/* sql */ `
			UPDATE adoption_requests 
			SET status = 'approved',
			    responded_at = ?,
			    response_message = ?
			WHERE request_id = ?
		`).run(now, params.response_message || null, params.request_id);

		// 4. Send founding record to child
		// The child will need to poll or we send it via callback
		// For now, child can fetch via /api/federation/adoption/status/:request_id

		return {
			success: true,
			founding_record: foundingRecord
		};
	} catch (error) {
		console.error('Adoption approval error:', error);
		return { success: false, error: 'Failed to approve adoption' };
	}
}

/**
 * Reject an adoption request
 * Called by the PARENT society to reject a child
 */
export function rejectAdoption(params: {
	request_id: string;
	response_message?: string;
}): { success: boolean; error?: string } {
	const identity = getIdentity();
	if (!identity) {
		return { success: false, error: 'Society identity not initialized' };
	}

	// Get the adoption request
	const request = db
		.prepare('SELECT * FROM adoption_requests WHERE request_id = ? AND parent_uuid = ?')
		.get(params.request_id, identity.uuid) as AdoptionRequest | undefined;

	if (!request) {
		return { success: false, error: 'Adoption request not found' };
	}

	if (request.status !== 'pending') {
		return { success: false, error: `Request already ${request.status}` };
	}

	// Update adoption request status
	const now = Math.floor(Date.now() / 1000);
	db.prepare(/* sql */ `
		UPDATE adoption_requests 
		SET status = 'rejected',
		    responded_at = ?,
		    response_message = ?
		WHERE request_id = ?
	`).run(now, params.response_message || null, params.request_id);

	return { success: true };
}

/**
 * Check adoption request status
 * Called by the CHILD to check if their request was approved/rejected
 */
export async function checkAdoptionStatus(params: {
	request_id: string;
	parent_url: string;
}): Promise<{
	status: 'pending' | 'approved' | 'rejected' | 'not_found';
	founding_record?: FoundingRecord;
	response_message?: string;
	error?: string;
}> {
	try {
		// 1. Check status
		const response = await fetch(
			`${params.parent_url}/api/federation/adoption/status/${params.request_id}`
		);

		if (!response.ok) {
			return { status: 'not_found', error: 'Failed to check status' };
		}

		const data = await response.json();

		// 2. If approved, fetch founding record
		if (data.status === 'approved') {
			const recordResponse = await fetch(
				`${params.parent_url}/api/federation/adoption/founding-record/${params.request_id}`
			);

			if (recordResponse.ok) {
				const recordData = await recordResponse.json();
				return {
					status: data.status,
					founding_record: recordData.founding_record,
					response_message: recordData.response_message || data.response_message
				};
			} else {
				return {
					status: data.status,
					response_message: data.response_message,
					error: 'Failed to fetch founding record'
				};
			}
		}

		// For pending/rejected, just return status
		return {
			status: data.status,
			response_message: data.response_message
		};
	} catch (error) {
		console.error('Status check error:', error);
		return { status: 'not_found', error: 'Failed to check adoption status' };
	}
}

/**
 * Complete adoption on child's side
 * Called by CHILD after receiving approved founding record
 */
export function completeAdoption(params: {
	founding_record: FoundingRecord;
}): { success: boolean; error?: string } {
	const identity = getIdentity();
	if (!identity) {
		return { success: false, error: 'Society identity not initialized' };
	}

	// Verify the founding record is for us
	if (params.founding_record.child.uuid !== identity.uuid) {
		return { success: false, error: 'Founding record UUID does not match' };
	}

	if (params.founding_record.child.handle !== identity.handle) {
		return { success: false, error: 'Founding record handle does not match' };
	}

	// Update our society_identity with parent_uuid and founding record
	const foundedAt = Math.floor(new Date(params.founding_record.founded_at).getTime() / 1000);

	db.prepare(/* sql */ `
		UPDATE society_identity
		SET parent_uuid = ?,
		    founding_record_json = ?,
		    founded_at = ?
		WHERE uuid = ?
	`).run(
		params.founding_record.parent.uuid,
		JSON.stringify(params.founding_record),
		foundedAt,
		identity.uuid
	);

	// Cache parent in our societies table
	cacheSociety({
		uuid: params.founding_record.parent.uuid,
		handle: params.founding_record.parent.handle,
		publicKey: params.founding_record.parent.public_key,
		parentUuid: null // Parent is likely root or we don't know their parent
	});

	return { success: true };
}

/**
 * Get adoption request by ID
 */
export function getAdoptionRequest(request_id: string): AdoptionRequest | null {
	const stmt = db.prepare(/* sql */ `
		SELECT * FROM adoption_requests WHERE request_id = ?
	`);

	return (stmt.get(request_id) as AdoptionRequest | undefined) || null;
}
