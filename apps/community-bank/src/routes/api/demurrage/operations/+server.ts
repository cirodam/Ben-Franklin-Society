import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { getDemurrageOperations } from '$lib/server/domain/demurrage.js';

/**
 * GET /api/demurrage/operations
 * Returns history of demurrage collection operations
 */
export const GET: RequestHandler = async ({ url }) => {
	const limit = Number(url.searchParams.get('limit')) || 50;
	const offset = Number(url.searchParams.get('offset')) || 0;

	const operations = getDemurrageOperations({ limit, offset });

	return json({
		operations,
		pagination: {
			limit,
			offset
		}
	});
};
