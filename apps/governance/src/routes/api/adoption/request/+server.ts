import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types.js';
import { receiveAdoptionRequest } from '$lib/server/federation/lineage/adoption.js';

/**
 * POST /api/adoption/request
 * Receive an adoption request from a child society
 */
export const POST: RequestHandler = async ({ request }) => {
	try {
		const body = await request.json();

		// Validate required fields
		if (!body.signature) {
			return json({ error: 'Signature is required' }, { status: 400 });
		}
		if (!body.requested_at) {
			return json({ error: 'requested_at timestamp is required' }, { status: 400 });
		}

		const result = receiveAdoptionRequest({
			request_id: body.request_id,
			child_uuid: body.child_uuid,
			child_handle: body.child_handle,
			child_public_key: body.child_public_key,
			message: body.message,
			child_endpoint: body.child_endpoint,
			child_bfs_url: body.child_bfs_url,
			child_ipv4: body.child_ipv4,
			child_ipv6: body.child_ipv6,
			requested_at: body.requested_at,
			signature: body.signature
		});

		if (!result.success) {
			return json({ error: result.error }, { status: 400 });
		}

		return json({ success: true, request_id: body.request_id });
	} catch (error) {
		console.error('Adoption request error:', error);
		return json({ error: 'Failed to process adoption request' }, { status: 500 });
	}
};
