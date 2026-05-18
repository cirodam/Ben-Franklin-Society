import { json } from '@sveltejs/kit';
import { getLineage } from '$lib/server/federation/lineage/walker.js';
import type { RequestHandler } from './$types.js';

/**
 * GET /api/societies/:handle/lineage
 * Get the verified lineage for a society (from cache or walk if needed)
 */
export const GET: RequestHandler = async ({ params }) => {
	try {
		const { handle } = params;

		const lineage = await getLineage(handle);

		if (!lineage) {
			return json(
				{ error: 'Society not found or lineage unavailable' },
				{ status: 404 }
			);
		}

		return json({
			handle,
			lineage,
			depth: lineage.length
		});
	} catch (error) {
		console.error('Get lineage error:', error);
		return json(
			{ error: 'Failed to get lineage' },
			{ status: 500 }
		);
	}
};
