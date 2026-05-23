import { json } from '@sveltejs/kit';
import { issueFlorenForMembers } from '$lib/server/issuance.js';
import type { RequestHandler } from './$types.js';

/**
 * POST /api/issuance/endowment
 * Issue Florens to a society based on verified member count
 * Can be called multiple times as society grows - only issues for new members
 * 
 * Body: {
 *   society_uuid: string,
 *   verified_member_count: number,
 *   admin_key: string
 * }
 * 
 * Note: This requires admin authentication
 * In production, this would verify admin_key against Federation admin credentials
 */
export const POST: RequestHandler = async ({ request }) => {
	try {
		const body = await request.json();
		const { society_uuid, verified_member_count, admin_key } = body;

		if (!society_uuid || !verified_member_count) {
			return json(
				{ success: false, error: 'society_uuid and verified_member_count required' },
				{ status: 400 }
			);
		}

		// TODO: Verify admin_key against Federation admin credentials
		// For now, we'll allow any request (development only)
		// if (!verifyAdminKey(admin_key)) {
		//   return json({ error: 'Unauthorized' }, { status: 401 });
		// }

		const result = issueFlorenForMembers({
			societyUuid: society_uuid,
			verifiedMemberCount: verified_member_count
		});

		if (!result.success) {
			return json(result, { status: 400 });
		}

		return json({
			success: true,
			society_uuid,
			new_members: result.newMembers,
			issuance_amount: result.amount,
			message: `Issued ${result.amount} Florens for ${result.newMembers} new members`
		});
	} catch (error) {
		console.error('Error issuing Florens:', error);
		return json(
			{ success: false, error: 'Internal server error' },
			{ status: 500 }
		);
	}
};
