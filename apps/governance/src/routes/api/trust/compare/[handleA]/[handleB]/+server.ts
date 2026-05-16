import { json } from '@sveltejs/kit';
import { compareTrust } from '$lib/server/vouching/calculator.js';
import type { RequestHandler } from './$types.js';

/**
 * GET /api/trust/compare/:handleA/:handleB
 * Compare trust scores between two societies
 */
export const GET: RequestHandler = async ({ params }) => {
	try {
		const { handleA, handleB } = params;

		if (!handleA || !handleB) {
			return json(
				{ error: 'Both handleA and handleB are required' },
				{ status: 400 }
			);
		}

		const comparison = await compareTrust(handleA, handleB);

		return json(comparison);
	} catch (error) {
		console.error('Compare trust error:', error);
		return json(
			{ error: error instanceof Error ? error.message : 'Failed to compare trust' },
			{ status: 500 }
		);
	}
};
