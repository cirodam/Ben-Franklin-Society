import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types.js';
import { getAdoptionRequest } from '$lib/server/federation/lineage/adoption.js';

/**
 * GET /api/adoption/status/[request_id]
 * Check the status of an adoption request
 */
export const GET: RequestHandler = async ({ params }) => {
	try {
		const request = getAdoptionRequest(params.request_id);

		if (!request) {
			return json({ error: 'Adoption request not found' }, { status: 404 });
		}

		return json({
			status: request.status,
			response_message: request.response_message,
			responded_at: request.responded_at,
			// If approved, the child can fetch the founding record
			// from GET /api/adoption/founding-record/[request_id]
		});
	} catch (error) {
		console.error('Status check error:', error);
		return json({ error: 'Failed to check adoption status' }, { status: 500 });
	}
};
