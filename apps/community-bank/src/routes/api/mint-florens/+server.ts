import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types.js';
import { mintFlorens } from '$lib/server/domain/monetary.js';
import { db } from '$lib/server/core/db.js';

/**
 * Mint florens into an account.
 * This endpoint is called by the Federation for initial endowment and growth issuance.
 * 
 * Request validation will be added later.
 */
export const POST: RequestHandler = async ({ request }) => {
	// TODO: Validate request is from Federation
	// Will add FEDERATION_SHARED_SECRET authentication later

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

	// Resolve owner_uuid
	// If it's "treasury", look up the Treasury association from governance
	let resolvedOwnerUuid = owner_uuid;
	
	if (owner_uuid === 'treasury') {
		// Look up Treasury association by handle
		// For now, we'll need to query governance or have a local cache
		// Simplest: look for an account named "Treasury" owned by an association
		const treasuryAccount = db
			.prepare("SELECT owner_uuid FROM account WHERE name = 'Treasury' LIMIT 1")
			.get() as { owner_uuid: string } | undefined;
		
		if (treasuryAccount) {
			resolvedOwnerUuid = treasuryAccount.owner_uuid;
		} else {
			error(404, 'Treasury account not found');
		}
	}

	// Look up the account by owner_uuid
	const account = db
		.prepare('SELECT uuid FROM account WHERE owner_uuid = ? LIMIT 1')
		.get(resolvedOwnerUuid) as { uuid: string } | undefined;

	if (!account) {
		error(404, 'Account not found for owner');
	}

	try {
		const operation = mintFlorens({
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
