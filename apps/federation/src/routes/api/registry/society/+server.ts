import { json } from '@sveltejs/kit';
import { registerSociety } from '$lib/server/registry.js';
import type { RequestHandler } from './$types.js';

/**
 * POST /api/registry/society
 * Register a new society in the Federation index
 * 
 * Body: {
 *   founding_record: FoundingRecord,
 *   endpoint: "https://society.bfs/"
 * }
 */
export const POST: RequestHandler = async ({ request }) => {
	try {
		const body = await request.json();
		const { founding_record, endpoint } = body;

		if (!founding_record || !endpoint) {
			return json(
				{ success: false, error: 'founding_record and endpoint required' },
				{ status: 400 }
			);
		}

		const result = registerSociety({
			foundingRecord: founding_record,
			endpoint
		});

		if (!result.success) {
			return json(result, { status: 400 });
		}

		// Get the registered society
		const { lookupSociety, getLineageFromCache } = await import('$lib/server/registry.js');
		const society = lookupSociety(founding_record.child.handle);
		const lineage = getLineageFromCache(founding_record.child.handle);

		return json({
			success: true,
			society: {
				...society,
				lineage
			}
		});
	} catch (error) {
		console.error('Error registering society:', error);
		return json(
			{ success: false, error: 'Internal server error' },
			{ status: 500 }
		);
	}
};
