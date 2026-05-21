import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { getMonetaryPolicy, updateMonetaryPolicy } from '$lib/server/domain/monetary.js';
import { getOidcClient } from '$lib/server/auth/oidc.js';
import { canManageMonetary } from '$lib/server/auth/authorization.js';

/**
 * GET /api/monetary/policy
 * Returns current monetary policy settings
 */
export const GET: RequestHandler = async () => {
	const policy = getMonetaryPolicy();
	return json(policy);
};

/**
 * PUT /api/monetary/policy
 * Update monetary policy settings (requires manage_monetary permission)
 */
export const PUT: RequestHandler = async ({ request, cookies }) => {
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
	const updates: { franks_per_person_year?: number; tolerance_percent?: number } = {};

	if (body.franks_per_person_year !== undefined) {
		updates.franks_per_person_year = Number(body.franks_per_person_year);
		if (isNaN(updates.franks_per_person_year) || updates.franks_per_person_year <= 0) {
			return json({ error: 'Invalid franks_per_person_year' }, { status: 400 });
		}
	}

	if (body.tolerance_percent !== undefined) {
		updates.tolerance_percent = Number(body.tolerance_percent);
		if (isNaN(updates.tolerance_percent) || updates.tolerance_percent < 0) {
			return json({ error: 'Invalid tolerance_percent' }, { status: 400 });
		}
	}

	updateMonetaryPolicy(updates);
	const policy = getMonetaryPolicy();

	return json({ success: true, policy });
};
