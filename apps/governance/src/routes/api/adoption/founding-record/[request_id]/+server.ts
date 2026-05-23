import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types.js';
import { getAdoptionRequest } from '$lib/server/federation/lineage/adoption.js';
import { getSociety } from '$lib/server/federation/societies.js';

/**
 * GET /api/adoption/founding-record/[request_id]
 * Get the founding record for an approved adoption request
 * Called by the child society after their request is approved
 */
export const GET: RequestHandler = async ({ params }) => {
	try {
		const request = getAdoptionRequest(params.request_id);

		if (!request) {
			return json({ error: 'Adoption request not found' }, { status: 404 });
		}

		if (request.status !== 'approved') {
			return json({ error: 'Adoption request not approved' }, { status: 400 });
		}

		// Get the child from societies table (where we stored their founding record)
		const child = getSociety(request.child_uuid);

		if (!child || !child.founding_record_json) {
			return json({ error: 'Founding record not found' }, { status: 404 });
		}

		const foundingRecord = JSON.parse(child.founding_record_json);

		return json({
			founding_record: foundingRecord,
			response_message: request.response_message
		});
	} catch (error) {
		console.error('Founding record fetch error:', error);
		return json({ error: 'Failed to retrieve founding record' }, { status: 500 });
	}
};
