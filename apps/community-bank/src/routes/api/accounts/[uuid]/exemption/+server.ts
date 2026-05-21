import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { getAccountByUuid } from '$lib/server/domain/accounts.js';
import { getOidcClient } from '$lib/server/auth/oidc.js';
import { hasAppWideAdmin } from '$lib/server/auth/authorization.js';
import { db } from '$lib/server/core/db.js';

/**
 * PUT /api/accounts/:uuid/exemption
 * Set demurrage exemption status (admin only)
 */
export const PUT: RequestHandler = async ({ params, request, cookies }) => {
	const client = getOidcClient();
	const session = await client.getSession(cookies);

	if (!session) {
		return json({ error: 'Unauthorized' }, { status: 401 });
	}

	// Check for admin permission
	if (!hasAppWideAdmin(session)) {
		return json({ error: 'Forbidden: bank:admin permission required' }, { status: 403 });
	}

	const account = getAccountByUuid(params.uuid);
	if (!account) {
		return json({ error: 'Account not found' }, { status: 404 });
	}

	const body = await request.json();
	const demurrageExempt = Boolean(body.demurrage_exempt);

	db.prepare('UPDATE account SET demurrage_exempt = ? WHERE uuid = ?').run(
		demurrageExempt ? 1 : 0,
		params.uuid
	);

	return json({
		success: true,
		account_uuid: params.uuid,
		demurrage_exempt: demurrageExempt
	});
};
