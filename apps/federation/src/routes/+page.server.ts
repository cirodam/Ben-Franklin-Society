import type { PageServerLoad } from './$types';
import { getNetworkStats, getRecentRegistrations } from '$lib/server/stats.js';

export const load: PageServerLoad = async () => {
	const stats = getNetworkStats();
	const recentRegistrations = getRecentRegistrations(10);

	return {
		stats,
		recentRegistrations
	};
};
