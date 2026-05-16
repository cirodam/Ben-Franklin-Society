import { json } from '@sveltejs/kit';
import { getLineageFromCache, lookupSociety } from '$lib/server/registry.js';
import type { RequestHandler } from './$types.js';

/**
 * GET /api/registry/lineage/:handle
 * Get the lineage chain for a society
 */
export const GET: RequestHandler = async ({ params }) => {
	const { handle } = params;

	const lineage = getLineageFromCache(handle);

	if (!lineage) {
		return json(
			{ error: 'Society not found' },
			{ status: 404 }
		);
	}

	const society = lookupSociety(handle);

	return json({
		lineage,
		verified: true, // All lineages in Federation are verified at registration
		society: society ? {
			handle: society.handle,
			uuid: society.uuid,
			founded_at: society.founded_at
		} : null
	});
};
