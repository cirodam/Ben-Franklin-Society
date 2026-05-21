import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { getDemurrageConfig, updateDemurrageConfig } from '$lib/server/demurrage.js';
import { getOidcClient } from '$lib/server/oidc.js';
import { hasAppWideAdmin } from '$lib/server/authorization.js';
import { getAccountByUuid } from '$lib/server/accounts.js';

/**
 * GET /api/demurrage/config
 * Returns current demurrage configuration
 */
export const GET: RequestHandler = async () => {
	const config = getDemurrageConfig();

	if (!config) {
		return json({
			rate_percent: null,
			destination_account_uuid: null,
			destination_account_name: null,
			enabled: false
		});
	}

	const destinationAccount = getAccountByUuid(config.destination_account_uuid);

	return json({
		rate_percent: config.rate_percent,
		destination_account_uuid: config.destination_account_uuid,
		destination_account_name: destinationAccount?.name ?? null,
		enabled: config.enabled
	});
};

/**
 * PUT /api/demurrage/config
 * Update demurrage configuration (admin only)
 */
export const PUT: RequestHandler = async ({ request, cookies }) => {
	const client = getOidcClient();
	const session = await client.getSession(cookies);

	if (!session) {
		return json({ error: 'Unauthorized' }, { status: 401 });
	}

	// Check for admin permission
	if (!hasAppWideAdmin(session)) {
		return json({ error: 'Forbidden: bank:admin permission required' }, { status: 403 });
	}

	const body = await request.json();
	const updates: Partial<{
		rate_percent: number;
		destination_account_uuid: string;
		enabled: boolean;
	}> = {};

	if (body.rate_percent !== undefined) {
		updates.rate_percent = Number(body.rate_percent);
		if (isNaN(updates.rate_percent) || updates.rate_percent < 0) {
			return json({ error: 'Invalid rate_percent' }, { status: 400 });
		}
	}

	if (body.destination_account_uuid !== undefined) {
		updates.destination_account_uuid = body.destination_account_uuid;
		if (updates.destination_account_uuid) {
			const account = getAccountByUuid(updates.destination_account_uuid);
			if (!account) {
				return json({ error: 'Destination account not found' }, { status: 400 });
			}
		}
	}

	if (body.enabled !== undefined) {
		updates.enabled = Boolean(body.enabled);
	}

	updateDemurrageConfig(updates);
	const config = getDemurrageConfig();

	return json({ success: true, config });
};
