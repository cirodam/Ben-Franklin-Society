import type { PageServerLoad } from './$types.js';
import { listAssociations } from '$lib/server/organization/associations.js';

export const load: PageServerLoad = async () => {
	return { associations: listAssociations() };
};
