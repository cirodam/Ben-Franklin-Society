import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { getMonetaryOperations } from '$lib/server/monetary.js';

/**
 * GET /api/monetary/history
 * Returns history of monetary operations (mint/burn)
 */
export const GET: RequestHandler = async ({ url }) => {
	const limit = Number(url.searchParams.get('limit')) || 50;
	const offset = Number(url.searchParams.get('offset')) || 0;

	const operations = getMonetaryOperations({ limit, offset });

	return json({
		operations,
		pagination: {
			limit,
			offset
		}
	});
};
