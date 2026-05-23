import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types.js';
import { rejectAdoption } from '$lib/server/federation/lineage/adoption.js';

/**
 * POST /api/adoption/reject
 * Reject an adoption request
 */
export const POST: RequestHandler = async ({ request }) => {
	try {
		const body = await request.json();

		if (!body.request_id) {
			return json({ error: 'request_id is required' }, { status: 400 });
		}

		const result = rejectAdoption({
			request_id: body.request_id,
			response_message: body.response_message
		});

		if (!result.success) {
			return json({ error: result.error }, { status: 400 });
		}

		return json({ success: true });
	} catch (error) {
		console.error('Adoption rejection error:', error);
		return json({ error: 'Failed to reject adoption' }, { status: 500 });
	}
};
