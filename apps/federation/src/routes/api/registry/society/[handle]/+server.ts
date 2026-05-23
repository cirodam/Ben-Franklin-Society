import { json } from '@sveltejs/kit';
import {
	lookupSociety,
	computeLineage
} from '$lib/server/queries.js';
import {
	verifyUpdateRequest,
	updateConnectivity
} from '$lib/server/updates.js';
import type { RequestHandler } from './$types.js';

/**
 * GET /api/registry/society/:handle
 * Look up a society by handle
 */
export const GET: RequestHandler = async ({ params }) => {
	const { handle } = params;

	const society = lookupSociety(handle);

	if (!society) {
		return json({ error: 'Society not found' }, { status: 404 });
	}

	const lineage = computeLineage(handle);

	return json({
		...society,
		lineage
	});
};

/**
 * PATCH /api/registry/society/:handle
 * Update society connectivity (requires signature authentication)
 * 
 * Headers: Authorization: Signature <base64-signature>
 * Body: {
 *   bfs_url?: string,
 *   url?: string,
 *   ip_address?: string,
 *   port?: number,
 *   timestamp: number
 * }
 */
export const PATCH: RequestHandler = async ({ params, request, getClientAddress }) => {
	const { handle } = params;

	// Extract signature from Authorization header
	const authHeader = request.headers.get('Authorization');
	if (!authHeader || !authHeader.startsWith('Signature ')) {
		return json({ error: 'Missing or invalid Authorization header' }, { status: 401 });
	}

	const signatureBase64 = authHeader.substring('Signature '.length);

	// Get request body
	const requestBody = await request.text();

	// Verify signature
	const verification = verifyUpdateRequest({
		handle,
		requestBody,
		signatureBase64
	});

	if (!verification.valid) {
		return json({ error: verification.error || 'Invalid signature' }, { status: 401 });
	}

	// Parse body
	let body: any;
	try {
		body = JSON.parse(requestBody);
	} catch {
		return json({ error: 'Invalid JSON' }, { status: 400 });
	}

	const { bfs_url, url, ip_address, port } = body;

	// Update connectivity
	const result = updateConnectivity({
		handle,
		bfsUrl: bfs_url,
		url,
		ipAddress: ip_address,
		port,
		signature: signatureBase64
	});

	if (!result.success) {
		return json({ error: result.error || 'Update failed' }, { status: 500 });
	}

	// Return updated society
	const society = lookupSociety(handle);

	return json({
		success: true,
		society
	});
};
