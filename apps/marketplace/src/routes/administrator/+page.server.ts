import { getPendingReports } from '$lib/server/moderation.js';
import type { PageServerLoad } from './$types.js';

export const load: PageServerLoad = async () => {
	return { reports: getPendingReports() };
};
