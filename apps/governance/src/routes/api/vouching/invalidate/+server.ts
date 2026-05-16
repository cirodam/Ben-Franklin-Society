import { json } from '@sveltejs/kit';
import { invalidateVouch } from '$lib/server/vouching/issuer.js';
import type { RequestHandler } from './$types.js';

/**
 * POST /api/vouching/invalidate
 * Invalidate a vouch we previously issued
 * Body: { vouch_id: string, reason: string }
 */
export const POST: RequestHandler = async ({ request }) => {
	try {
		const body = await request.json();
		const { vouch_id, reason } = body;

		if (!vouch_id || !reason) {
			return json(
				{ error: 'Missing required fields: vouch_id, reason' },
				{ status: 400 }
			);
		}

		const success = invalidateVouch(vouch_id, reason);

		if (!success) {
			return json(
				{ error: 'Vouch not found or already invalidated' },
				{ status: 404 }
			);
		}

		return json({
			success: true,
			vouch_id,
			invalidated_at: Math.floor(Date.now() / 1000)
		});
	} catch (error) {
		console.error('Invalidate vouch error:', error);
		return json(
			{ error: 'Failed to invalidate vouch' },
			{ status: 500 }
		);
	}
};
