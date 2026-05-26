import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types.js';
import { mintFranks } from '$lib/server/domain/monetary.js';
import { GOVERNANCE_SHARED_SECRET } from '$env/static/private';
import { db } from '$lib/server/core/db.js';

/**
 * Mint franks into an account.
 * This endpoint is called by the Governance app for initial issuance and birthday issuance.
 * 
 * Request must come from governance (validated by shared secret).
 */
export const POST: RequestHandler = async ({ request }) => {
	// Validate request is from governance
	const authHeader = request.headers.get('Authorization');
	
	if (!authHeader || !authHeader.startsWith('Bearer ') || !GOVERNANCE_SHARED_SECRET) {
		error(401, 'Unauthorized');
	}
	
	const providedSecret = authHeader.slice(7); // Remove 'Bearer ' prefix
	if (providedSecret !== GOVERNANCE_SHARED_SECRET) {
		error(401, 'Unauthorized');
	}

	const body = await request.json();
	const { amount, owner_uuid, reason, performed_by_uuid } = body;

	// Validate required fields
	if (
		typeof amount !== 'number' ||
		typeof owner_uuid !== 'string' ||
		typeof reason !== 'string' ||
		typeof performed_by_uuid !== 'string'
	) {
		error(400, 'Invalid request: amount, owner_uuid, reason, and performed_by_uuid are required');
	}

	if (amount <= 0) {
		error(400, 'Amount must be positive');
	}

	// Look up the account by owner_uuid
	const account = db
		.prepare('SELECT uuid FROM account WHERE owner_uuid = ? LIMIT 1')
		.get(owner_uuid) as { uuid: string } | undefined;

	if (!account) {
		error(404, 'Account not found for owner');
	}

	try {
		const operation = mintFranks({
			amount,
			account_uuid: account.uuid,
			reason,
			performed_by_uuid
		});

		return json({
			success: true,
			operation
		});
	} catch (err) {
		const message = err instanceof Error ? err.message : 'Unknown error';
		error(500, message);
	}
};
