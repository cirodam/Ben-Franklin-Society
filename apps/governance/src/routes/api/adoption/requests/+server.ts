import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types.js';
import { getPendingAdoptionRequests, getAllAdoptionRequests } from '$lib/server/federation/lineage/adoption.js';

/**
 * GET /api/adoption/requests
 * Get adoption requests for this society (as parent)
 */
export const GET: RequestHandler = async ({ url }) => {
	const showAll = url.searchParams.get('all') === 'true';

	try {
		const requests = showAll ? getAllAdoptionRequests() : getPendingAdoptionRequests();

		return json({
			requests: requests.map((r) => ({
				request_id: r.request_id,
				child_uuid: r.child_uuid,
				child_handle: r.child_handle,
				child_public_key: r.child_public_key,
				message: r.message,
				status: r.status,
				requested_at: r.requested_at,
				responded_at: r.responded_at,
				response_message: r.response_message,
				child_endpoint: r.child_endpoint,
				child_bfs_url: r.child_bfs_url
			}))
		});
	} catch (error) {
		console.error('Get adoption requests error:', error);
		return json({ error: 'Failed to retrieve adoption requests' }, { status: 500 });
	}
};
