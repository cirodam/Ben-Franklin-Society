import type { PageServerLoad } from './$types.js';
import { getPendingReports } from '$lib/server/moderation.js';

export const load: PageServerLoad = async () => {
	const reports = getPendingReports();
	return { reports };
};
