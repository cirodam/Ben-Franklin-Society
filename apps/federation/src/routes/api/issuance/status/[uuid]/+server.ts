import { json } from '@sveltejs/kit';
import { getIssuanceStatus } from '$lib/server/issuance.js';
import type { RequestHandler } from './$types.js';

/**
 * GET /api/issuance/status/:uuid
 * Get Floren issuance status for a society
 */
export const GET: RequestHandler = async ({ params }) => {
	const { uuid } = params;

	const status = getIssuanceStatus(uuid);

	if (!status) {
		return json({ error: 'Society not found' }, { status: 404 });
	}

	return json(status);
};
