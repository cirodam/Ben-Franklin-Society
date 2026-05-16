import { json } from '@sveltejs/kit';
import { calculateTrustScore } from '$lib/server/vouching/calculator.js';
import type { RequestHandler } from './$types.js';

/**
 * GET /api/trust/:handle
 * Calculate and return trust score for a society
 * Query params: ?lineage=0.4&vouches=0.4&history=0.2 (optional weights)
 */
export const GET: RequestHandler = async ({ params, url }) => {
	try {
		const { handle } = params;

		// Parse optional weights from query params
		const lineageWeight = parseFloat(url.searchParams.get('lineage') || '0.4');
		const vouchesWeight = parseFloat(url.searchParams.get('vouches') || '0.4');
		const historyWeight = parseFloat(url.searchParams.get('history') || '0.2');

		// Validate weights
		const weightSum = lineageWeight + vouchesWeight + historyWeight;
		if (Math.abs(weightSum - 1.0) > 0.01) {
			return json(
				{ error: 'Weights must sum to 1.0' },
				{ status: 400 }
			);
		}

		const weights = {
			lineage: lineageWeight,
			vouches: vouchesWeight,
			history: historyWeight
		};

		const score = await calculateTrustScore(handle, weights);

		return json(score);
	} catch (error) {
		console.error('Calculate trust score error:', error);
		return json(
			{ error: error instanceof Error ? error.message : 'Failed to calculate trust score' },
			{ status: 500 }
		);
	}
};
