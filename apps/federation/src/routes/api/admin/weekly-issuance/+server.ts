import { json } from '@sveltejs/kit';
import { db } from '$lib/server/db.js';
import { issueFlorenForMembers, getIssuanceStatus } from '$lib/server/issuance.js';
import type { RequestHandler } from './$types.js';

interface Society {
	uuid: string;
	handle: string;
	people_count: number | null;
	issued_florens: number;
}

/**
 * POST /api/admin/weekly-issuance
 * Check all active societies for population growth and issue Florens as needed
 * 
 * This endpoint should be called:
 * - Weekly by a cron job
 * - Manually by administrators
 * 
 * For each active society with reported people_count:
 * - Compare people_count to already-issued Florens
 * - If growth detected, issue delta
 * 
 * TODO: Add admin authentication
 */
export const POST: RequestHandler = async () => {
	// TODO: Validate admin credentials

	try {
		// Get all active societies with member counts
		const societies = db
			.prepare(
				`SELECT uuid, handle, people_count, issued_florens 
				 FROM societies 
				 WHERE status = 'active' 
				   AND people_count IS NOT NULL 
				   AND people_count > 0
				 ORDER BY handle`
			)
			.all() as Society[];

		const results = [];
		let totalIssued = 0;
		let societiesProcessed = 0;

		for (const society of societies) {
			const status = getIssuanceStatus(society.uuid);

			if (!status) {
				results.push({
					society: society.handle,
					status: 'error',
					error: 'Could not fetch issuance status'
				});
				continue;
			}

			// Check if this society needs new issuance
			if (status.potential_new_issuance > 0) {
				const result = issueFlorenForMembers({
					societyUuid: society.uuid,
					verifiedMemberCount: society.people_count!
				});

				if (result.success) {
					results.push({
						society: society.handle,
						status: 'issued',
						new_members: result.newMembers,
						amount: result.amount,
						previous_members: status.members_issued_for,
						current_members: society.people_count
					});
					totalIssued += result.amount!;
					societiesProcessed++;
				} else {
					results.push({
						society: society.handle,
						status: 'error',
						error: result.error
					});
				}
			} else {
				results.push({
					society: society.handle,
					status: 'no_growth',
					members: society.people_count,
					already_issued_for: status.members_issued_for
				});
			}
		}

		return json({
			success: true,
			timestamp: new Date().toISOString(),
			societies_checked: societies.length,
			societies_issued: societiesProcessed,
			total_florens_issued: totalIssued,
			results
		});
	} catch (error) {
		console.error('Error in weekly issuance:', error);
		return json(
			{
				success: false,
				error: error instanceof Error ? error.message : 'Unknown error'
			},
			{ status: 500 }
		);
	}
};
