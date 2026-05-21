import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { mintFranks } from '$lib/server/domain/monetary.js';
import { getOidcClient } from '$lib/server/auth/oidc.js';
import { canManageMonetary } from '$lib/server/auth/authorization.js';

/**
 * POST /api/monetary/mint
 * Mint new franks (requires manage_monetary permission)
 */
export const POST: RequestHandler = async ({ request, cookies }) => {
	const client = getOidcClient();
	const session = await client.getSession(cookies);

	if (!session) {
		return json({ error: 'Unauthorized' }, { status: 401 });
	}

	// Check for bank:manage_monetary permission
	if (!canManageMonetary(session)) {
		return json({ error: 'Forbidden: bank:manage_monetary permission required' }, { status: 403 });
	}

	const body = await request.json();
	const amount = Number(body.amount);
	const account_uuid = body.account_uuid;
	const reason = body.reason;

	if (isNaN(amount) || amount <= 0) {
		return json({ error: 'Invalid amount' }, { status: 400 });
	}

	if (!account_uuid || typeof account_uuid !== 'string') {
		return json({ error: 'Account UUID is required' }, { status: 400 });
	}

	if (!reason || typeof reason !== 'string' || reason.trim().length === 0) {
		return json({ error: 'Reason is required' }, { status: 400 });
	}

	try {
		const operation = mintFranks({
			amount,
			account_uuid,
			reason: reason.trim(),
			performed_by_uuid: session.acting_as_uuid
		});

		return json({ success: true, operation });
	} catch (error) {
		return json({ error: (error as Error).message }, { status: 400 });
	}
};
