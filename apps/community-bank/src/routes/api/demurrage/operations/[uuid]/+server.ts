import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { getDemurrageOperationByUuid } from '$lib/server/domain/demurrage.js';

/**
 * GET /api/demurrage/operations/:uuid
 * Returns specific demurrage operation
 */
export const GET: RequestHandler = async ({ params }) => {
	const operation = getDemurrageOperationByUuid(params.uuid);

	if (!operation) {
		return json({ error: 'Operation not found' }, { status: 404 });
	}

	return json(operation);
};
