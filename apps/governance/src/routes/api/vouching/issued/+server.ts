import { json } from '@sveltejs/kit';
import { getIssuedVouches } from '$lib/server/vouching/issuer.js';
import type { RequestHandler } from './$types.js';

/**
 * GET /api/vouching/issued
 * Get vouches we've issued to other societies
 * Query params: ?vouched_for=handle&currently_valid=true
 */
export const GET: RequestHandler = async ({ url }) => {
	try {
		const vouchedFor = url.searchParams.get('vouched_for') || undefined;
		const currentlyValidStr = url.searchParams.get('currently_valid');
		const currentlyValid = currentlyValidStr ? currentlyValidStr === 'true' : undefined;

		const vouches = getIssuedVouches({
			vouchedFor,
			currentlyValid
		});

		return json({
			vouches,
			total: vouches.length
		});
	} catch (error) {
		console.error('Get issued vouches error:', error);
		return json(
			{ error: 'Failed to get issued vouches' },
			{ status: 500 }
		);
	}
};
