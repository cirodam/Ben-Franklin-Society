import { json } from '@sveltejs/kit';
import {
	getDnsRecords,
	upsertDnsRecords,
	verifyUpdateRequest,
	checkRateLimit
} from '$lib/server/domains.js';
import type { RequestHandler } from './$types.js';

/**
 * GET /api/registry/society/:handle/dns
 * Get DNS records for a society
 */
export const GET: RequestHandler = async ({ params }) => {
	const { handle } = params;

	const records = getDnsRecords(handle);

	return json({
		handle,
		records
	});
};

/**
 * POST /api/registry/society/:handle/dns
 * Add or update DNS records (requires signature authentication)
 * 
 * Headers: Authorization: Signature <base64-signature>
 * Body: {
 *   records: [
 *     { type: 'A', value: '1.2.3.4', ttl?: 3600, priority?: null },
 *     { type: 'AAAA', value: '2001:db8::1' }
 *   ],
 *   timestamp: number
 * }
 */
export const POST: RequestHandler = async ({ params, request, getClientAddress }) => {
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

	// Check rate limit
	if (!checkRateLimit(handle, 'dns_add')) {
		return json(
			{ error: 'Rate limit exceeded (50 DNS additions per day)' },
			{ status: 429 }
		);
	}

	// Parse body
	let body: any;
	try {
		body = JSON.parse(requestBody);
	} catch {
		return json({ error: 'Invalid JSON' }, { status: 400 });
	}

	const { records } = body;

	if (!records || !Array.isArray(records)) {
		return json({ error: 'Missing or invalid records array' }, { status: 400 });
	}

	// Validate records
	for (const record of records) {
		if (!record.type || !record.value) {
			return json(
				{ error: 'Each record must have type and value' },
				{ status: 400 }
			);
		}

		// Validate record type
		const validTypes = ['A', 'AAAA', 'CNAME', 'TXT', 'MX'];
		if (!validTypes.includes(record.type)) {
			return json(
				{ error: `Invalid record type: ${record.type}. Must be one of: ${validTypes.join(', ')}` },
				{ status: 400 }
			);
		}
	}

	// Add/update records
	const result = upsertDnsRecords({
		handle,
		records,
		signature: signatureBase64,
		ipAddress: getClientAddress()
	});

	if (!result.success) {
		return json({ error: result.error || 'Failed to add records' }, { status: 500 });
	}

	return json({
		success: true,
		added: result.added,
		records: getDnsRecords(handle)
	});
};
