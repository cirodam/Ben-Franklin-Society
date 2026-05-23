import { json } from '@sveltejs/kit';
import { auditMemberCount } from '$lib/server/issuance.js';
import type { RequestHandler } from './$types.js';

/**
 * POST /api/issuance/audit
 * Audit a society's claimed member count against founding record
 * 
 * Body: {
 *   society_uuid: string,
 *   claimed_count: number
 * }
 */
export const POST: RequestHandler = async ({ request }) => {
	try {
		const body = await request.json();
		const { society_uuid, claimed_count } = body;

		if (!society_uuid || typeof claimed_count !== 'number') {
			return json(
				{ error: 'society_uuid and claimed_count required' },
				{ status: 400 }
			);
		}

		const result = auditMemberCount({
			societyUuid: society_uuid,
			claimedCount: claimed_count
		});

		if (!result.verified && result.error) {
			return json({
				verified: false,
				error: result.error,
				actual_count: result.actualCount
			}, { status: 200 });
		}

		return json({
			verified: result.verified,
			claimed_count,
			actual_count: result.actualCount,
			message: result.verified 
				? 'Member count verified' 
				: 'Member count mismatch'
		});
	} catch (error) {
		console.error('Error auditing member count:', error);
		return json(
			{ error: 'Internal server error' },
			{ status: 500 }
		);
	}
};
