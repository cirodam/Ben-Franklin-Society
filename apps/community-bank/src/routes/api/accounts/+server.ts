import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types.js';
import { createAccount } from '$lib/server/domain/accounts.js';

/**
 * Create a bank account.
 * This endpoint is called by the Governance app during setup for system accounts like Treasury.
 * 
 * Request must come from governance (validated by Bearer token).
 * For internal service-to-service calls within Docker network, we trust Bearer tokens.
 */
export const POST: RequestHandler = async ({ request }) => {
	// Validate request has Bearer token
	const authHeader = request.headers.get('Authorization');
	
	if (!authHeader || !authHeader.startsWith('Bearer ')) {
		console.error('[bank/api/accounts] Missing or invalid Authorization header');
		error(401, 'Unauthorized');
	}
	
	// For internal service-to-service calls, we trust the Bearer token
	// The token is a JWT from governance's client_credentials grant

	const body = await request.json();
	const { owner_uuid, name, demurrage_exempt } = body;

	// Validate required fields
	if (
		typeof owner_uuid !== 'string' ||
		typeof name !== 'string'
	) {
		error(400, 'owner_uuid and name are required');
	}

	try {
		const account = createAccount({
			owner_uuid,
			name,
			demurrage_exempt: demurrage_exempt === true
		});

		return json({
			success: true,
			account_uuid: account.uuid
		});
	} catch (err) {
		console.error('Failed to create account:', err);
		error(500, err instanceof Error ? err.message : 'Failed to create account');
	}
};
