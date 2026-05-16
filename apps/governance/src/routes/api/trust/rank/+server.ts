import { json } from '@sveltejs/kit';
import { getRankedSocieties } from '$lib/server/vouching/calculator.js';
import type { RequestHandler } from './$types.js';

/**
 * GET /api/trust/rank
 * Get ranked list of societies by trust score
 * Query params:
 *   - min_score: Minimum trust score (default: 0)
 *   - limit: Maximum number of results (default: 100)
 *   - lineage, vouches, history: Weight parameters (optional)
 */
export const GET: RequestHandler = async ({ url }) => {
	try {
		const minScore = parseFloat(url.searchParams.get('min_score') || '0');
		const limit = parseInt(url.searchParams.get('limit') || '100');

		// Parse optional weights
		let weights;
		if (url.searchParams.has('lineage')) {
			const lineageWeight = parseFloat(url.searchParams.get('lineage') || '0.4');
			const vouchesWeight = parseFloat(url.searchParams.get('vouches') || '0.4');
			const historyWeight = parseFloat(url.searchParams.get('history') || '0.2');

			const weightSum = lineageWeight + vouchesWeight + historyWeight;
			if (Math.abs(weightSum - 1.0) > 0.01) {
				return json({ error: 'Weights must sum to 1.0' }, { status: 400 });
			}

			weights = {
				lineage: lineageWeight,
				vouches: vouchesWeight,
				history: historyWeight
			};
		}

		const rankedSocieties = await getRankedSocieties({
			minScore,
			limit: Math.min(limit, 1000), // Cap at 1000
			weights
		});

		return json({
			societies: rankedSocieties,
			count: rankedSocieties.length
		});
	} catch (error) {
		console.error('Get ranked societies error:', error);
		return json({ error: 'Failed to get ranked societies' }, { status: 500 });
	}
};
