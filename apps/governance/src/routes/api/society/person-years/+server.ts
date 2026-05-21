import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { getSocietyStatistics } from '$lib/server/organization/society.js';

/**
 * GET /api/society/person-years
 * Returns the total person-years for this society (sum of ages of all active members)
 */
export const GET: RequestHandler = async () => {
	const stats = getSocietyStatistics();
	
	return json({
		person_years: stats.person_years,
		member_count: stats.member_count,
		calculated_at: stats.calculated_at
	});
};
