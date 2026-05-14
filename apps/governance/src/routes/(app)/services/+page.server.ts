import type { PageServerLoad } from './$types.js';
import { listAssociations } from '$lib/server/associations.js';

export const load: PageServerLoad = async () => {
	const allAssociations = listAssociations();
	const services = allAssociations.filter(a => a.type === 'service');
	return { services };
};
