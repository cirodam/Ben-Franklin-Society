import type { PageServerLoad } from './$types.js';
import { listAssociations } from '$lib/server/associations.js';

export const load: PageServerLoad = async () => {
	return { associations: listAssociations() };
};
