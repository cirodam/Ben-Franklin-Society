import { json } from '@sveltejs/kit';
import { refreshLineage, getLineage } from '$lib/server/federation/lineage/walker.js';
import type { RequestHandler } from './$types.js';

/**
 * POST /api/societies/:handle/refresh-lineage
 * Refresh the cached lineage for a society by re-walking and re-verifying
 */
export const POST: RequestHandler = async ({ params }) => {
	try {
		const { handle } = params;

		const verified = await refreshLineage(handle);

		if (!verified) {
			return json(
				{ error: 'Failed to refresh lineage - society not found or unreachable' },
				{ status: 404 }
			);
		}

		const lineage = await getLineage(handle);

		return json({
			success: true,
			verified,
			lineage
		});
	} catch (error) {
		console.error('Refresh lineage error:', error);
		return json(
			{ error: 'Failed to refresh lineage' },
			{ status: 500 }
		);
	}
};
