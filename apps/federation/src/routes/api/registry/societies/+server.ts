import { json } from '@sveltejs/kit';
import { getAllSocieties } from '$lib/server/queries.js';
import type { RequestHandler } from './$types.js';

/**
 * GET /api/registry/societies
 * List all societies (paginated)
 * Query params: ?page=1&limit=100&parent_uuid=uuid
 */
export const GET: RequestHandler = async ({ url }) => {
	const page = parseInt(url.searchParams.get('page') || '1');
	const limit = parseInt(url.searchParams.get('limit') || '100');
	const parentUuid = url.searchParams.get('parent_uuid') || undefined;

	const result = getAllSocieties({
		page,
		limit: Math.min(limit, 1000), // Cap at 1000
		parentUuid
	});

	return json(result);
};
