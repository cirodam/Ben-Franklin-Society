import type { PageServerLoad } from './$types.js';
import { getOutgoingAdoptionRequests } from '$lib/server/federation/lineage/adoption.js';

export const load: PageServerLoad = async () => {
	const requests = getOutgoingAdoptionRequests();

	return {
		requests
	};
};
