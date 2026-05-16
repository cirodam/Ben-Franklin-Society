import { json } from '@sveltejs/kit';
import { isHandleAvailable } from '$lib/server/lineage/founding.js';
import type { RequestHandler } from './$types.js';

/**
 * GET /api/founding/check-handle/:handle
 * Check if a handle is available for founding a child
 */
export const GET: RequestHandler = async ({ params }) => {
	try {
		const { handle } = params;

		const available = isHandleAvailable(handle);

		return json({
			handle,
			available
		});
	} catch (error) {
		console.error('Check handle error:', error);
		return json(
			{ error: 'Failed to check handle availability' },
			{ status: 500 }
		);
	}
};
