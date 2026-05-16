import { json } from '@sveltejs/kit';
import { lookupSociety, getLineageFromCache } from '$lib/server/registry.js';
import type { RequestHandler } from './$types.js';

/**
 * GET /api/registry/society/:handle
 * Look up a society by handle
 */
export const GET: RequestHandler = async ({ params }) => {
	const { handle } = params;

	const society = lookupSociety(handle);

	if (!society) {
		return json(
			{ error: 'Society not found' },
			{ status: 404 }
		);
	}

	const lineage = getLineageFromCache(handle);

	return json({
		...society,
		lineage
	});
};
