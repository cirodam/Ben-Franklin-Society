import { error }                                     from '@sveltejs/kit';
import { getMarketplace, getUpcomingSessions, getStalls } from '$lib/server/physical.js';
import type { PageServerLoad }                        from './$types.js';

export const load: PageServerLoad = async ({ params }) => {
	const marketplace = getMarketplace(params.uuid);
	if (!marketplace) error(404, 'Marketplace not found.');
	const sessions = getUpcomingSessions(params.uuid);
	const stalls   = getStalls(params.uuid);
	return { marketplace, sessions, stallCount: stalls.filter((s) => s.status === 'active').length };
};
