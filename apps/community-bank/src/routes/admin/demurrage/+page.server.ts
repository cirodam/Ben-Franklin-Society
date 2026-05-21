import { getDemurrageConfig, getDemurrageOperations } from '$lib/server/demurrage.js';
import type { PageServerLoad } from './$types.js';

export const load: PageServerLoad = async () => {
	const config = getDemurrageConfig();
	const recentOperations = getDemurrageOperations({ limit: 10 });

	return {
		config,
		recentOperations
	};
};
