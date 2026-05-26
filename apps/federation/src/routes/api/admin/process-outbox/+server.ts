import { json } from '@sveltejs/kit';
import { processFlorenCommands } from '$lib/server/outbox.js';
import type { RequestHandler } from './$types.js';

/**
 * POST /api/admin/process-outbox
 * Process pending Floren commands in the outbox
 * 
 * This can be called:
 * - Manually by administrators
 * - By a background worker/cron job
 * - After issuing new Florens to ensure delivery
 * 
 * TODO: Add admin authentication
 */
export const POST: RequestHandler = async ({ request }) => {
	// TODO: Validate admin credentials
	// For now, allow any request (development only)

	try {
		const body = await request.json().catch(() => ({}));
		const limit = body.limit || 10;

		const result = await processFlorenCommands(limit);

		return json({
			success: true,
			...result
		});
	} catch (error) {
		console.error('Error processing outbox:', error);
		return json(
			{
				success: false,
				error: error instanceof Error ? error.message : 'Unknown error'
			},
			{ status: 500 }
		);
	}
};
