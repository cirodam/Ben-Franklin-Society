import { json } from '@sveltejs/kit';
import {
	deleteDnsRecords,
	verifyUpdateRequest,
	checkRateLimit
} from '$lib/server/domains.js';
import type { RequestHandler } from './$types.js';

/**
 * DELETE /api/registry/society/:handle/dns/:type
 * Delete DNS records by type (requires signature authentication)
 * 
 * Headers: Authorization: Signature <base64-signature>
 * Body: {
 *   timestamp: number
 * }
 */
export const DELETE: RequestHandler = async ({ params, request, getClientAddress }) => {
	const { handle, type } = params;

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

	// Check rate limit
	if (!checkRateLimit(handle, 'dns_remove')) {
		return json(
			{ error: 'Rate limit exceeded (50 DNS removals per day)' },
			{ status: 429 }
		);
	}

	// Validate record type
	const validTypes = ['A', 'AAAA', 'CNAME', 'TXT', 'MX'];
	if (!validTypes.includes(type.toUpperCase())) {
		return json(
			{ error: `Invalid record type: ${type}. Must be one of: ${validTypes.join(', ')}` },
			{ status: 400 }
		);
	}

	// Delete records
	const result = deleteDnsRecords({
		handle,
		recordType: type.toUpperCase(),
		signature: signatureBase64,
		ipAddress: getClientAddress()
	});

	if (!result.success) {
		return json({ error: result.error || 'Failed to delete records' }, { status: 500 });
	}

	return json({
		success: true,
		deleted: result.deleted
	});
};
