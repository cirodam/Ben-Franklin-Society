import { getAllMarketplaces, getUpcomingSessions } from '$lib/server/physical.js';
import type { PageServerLoad } from './$types.js';

export const load: PageServerLoad = async () => {
	const marketplaces = getAllMarketplaces();
	const withNext = marketplaces.map((m) => {
		const sessions = getUpcomingSessions(m.uuid);
		return { ...m, nextSession: sessions[0] ?? null };
	});
	return { marketplaces: withNext };
};
