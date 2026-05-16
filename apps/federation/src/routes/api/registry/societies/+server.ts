import { json } from '@sveltejs/kit';
import { getAllSocieties } from '$lib/server/registry.js';
import type { RequestHandler } from './$types.js';

/**
 * GET /api/registry/societies
 * List all societies (paginated)
 * Query params: ?page=1&limit=100&parent=handle
 */
export const GET: RequestHandler = async ({ url }) => {
	const page = parseInt(url.searchParams.get('page') || '1');
	const limit = parseInt(url.searchParams.get('limit') || '100');
	const parentHandle = url.searchParams.get('parent') || undefined;

	const result = getAllSocieties({
		page,
		limit: Math.min(limit, 1000), // Cap at 1000
		parentHandle
	});

	return json(result);
};
