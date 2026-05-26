import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types.js';
import { createAccount } from '$lib/server/domain/accounts.js';
import { GOVERNANCE_SHARED_SECRET } from '$env/static/private';

/**
 * Create a bank account.
 * This endpoint is called by the Governance app during setup for system accounts like Treasury.
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
