import { json } from '@sveltejs/kit';
import { foundChildSociety, isHandleAvailable } from '$lib/server/lineage/founding.js';
import type { RequestHandler } from './$types.js';

/**
 * POST /api/founding/found
 * Found a child society (parent endpoint)
 * Body: {
 *   handle: string,
 *   public_key: string,
 *   endpoint: string,
 *   latitude?: number,
 *   longitude?: number,
 *   register_with_federation?: boolean
 * }
 */
export const POST: RequestHandler = async ({ request }) => {
	try {
		const body = await request.json();
		const { handle, public_key, endpoint, latitude, longitude, register_with_federation } = body;

		if (!handle || !public_key || !endpoint) {
			return json(
				{ error: 'Missing required fields: handle, public_key, endpoint' },
				{ status: 400 }
			);
		}

		// Check if handle is available
		if (!isHandleAvailable(handle)) {
			return json(
				{ error: `Handle '${handle}' is already used by one of our children` },
				{ status: 409 }
			);
		}

		const result = await foundChildSociety({
			proposal: {
				handle,
				public_key,
				endpoint,
				latitude,
				longitude
			},
			registerWithFed: register_with_federation !== false
		});

		return json({
			success: true,
			child_handle: handle,
			child_uuid: result.child_uuid,
			founding_record: result.founding_record,
			registered_with_federation: result.registered_with_federation
		});
	} catch (error) {
		console.error('Found child error:', error);
		return json(
			{ error: error instanceof Error ? error.message : 'Failed to found child society' },
			{ status: 500 }
		);
	}
};
