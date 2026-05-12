import type { PageServerLoad } from './$types.js';
import { getRecentClassifieds, getRecentServices } from '$lib/server/listings.js';

export const load: PageServerLoad = async ({ locals }) => {
	const recentClassifieds = getRecentClassifieds(6);
	const recentServices    = getRecentServices(6);
	return { recentClassifieds, recentServices };
};
