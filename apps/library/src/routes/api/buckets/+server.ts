import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types.js';
import { getUserBuckets } from '$lib/server/buckets.js';

/**
 * GET /api/buckets
 * List buckets accessible to the authenticated user
 */
export const GET: RequestHandler = async ({ locals }) => {
	const session = locals.session;
	if (!session) {
		return json({ error: 'Not authenticated' }, { status: 401 });
	}

	try {
		const buckets = getUserBuckets(session.acting_as_uuid);
		return json({ buckets });
	} catch (err: any) {
		console.error('[library/api/buckets] List error:', err);
		return json({ error: 'Failed to list buckets' }, { status: 500 });
	}
};
