import { json } from '@sveltejs/kit';
import { getPeerVerifications } from '$lib/server/federation/vouching/verifier.js';
import type { RequestHandler } from './$types.js';

/**
 * GET /api/vouching/verifications/:peer
 * Get all verifications for a peer by querying all their vouchers
 * Returns aggregated verification status
 */
export const GET: RequestHandler = async ({ params }) => {
	try {
		const { peer } = params;

		const result = await getPeerVerifications(peer);

		return json(result);
	} catch (error) {
		console.error('Get peer verifications error:', error);
		return json({ error: 'Failed to get peer verifications' }, { status: 500 });
	}
};
