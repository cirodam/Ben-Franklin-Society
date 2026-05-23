import { json } from '@sveltejs/kit';
import { registerSociety } from '$lib/server/registration.js';
import { lookupSociety, computeLineage } from '$lib/server/queries.js';
import type { RequestHandler } from './$types.js';

/**
 * POST /api/registry/society
 * Register a new society in the Federation index
 * 
 * Body: {
 *   founding_record: FoundingRecord,
 *   bfs_url?: string,
 *   url?: string,
 *   ip_address?: string,
 *   port?: number
 * }
 */
export const POST: RequestHandler = async ({ request }) => {
	try {
		const body = await request.json();
		const { founding_record, bfs_url, url, ip_address, port } = body;

		if (!founding_record) {
			return json(
				{ success: false, error: 'founding_record required' },
				{ status: 400 }
			);
		}

		const result = registerSociety({
			foundingRecord: founding_record,
			bfsUrl: bfs_url,
			url,
			ipAddress: ip_address,
			port
		});

		if (!result.success) {
			return json(result, { status: 400 });
		}

		// Get the registered society
		const society = lookupSociety(founding_record.child.handle);
		const lineage = computeLineage(founding_record.child.handle);

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
