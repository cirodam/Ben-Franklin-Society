import { json } from '@sveltejs/kit';
import { walkLineage } from '$lib/server/lineage/walker.js';
import type { RequestHandler } from './$types.js';

/**
 * POST /api/lineage/walk
 * Walk a society's lineage by querying their endpoint and parent chain
 * Body: { endpoint: "https://columbus.bfs/" }
 * Returns: { lineage: string[], verified: boolean, records: FoundingRecord[] }
 */
export const POST: RequestHandler = async ({ request }) => {
	try {
		const body = await request.json();
		const { endpoint } = body;

		if (!endpoint) {
			return json(
				{ error: 'endpoint required' },
				{ status: 400 }
			);
		}

		const result = await walkLineage(endpoint);

		return json({
			lineage: result.lineage,
			verified: result.verified,
			records: result.records,
			total_depth: result.lineage.length
		});
	} catch (error) {
		console.error('Lineage walk error:', error);
		return json(
			{ error: 'Failed to walk lineage' },
			{ status: 500 }
		);
	}
};
