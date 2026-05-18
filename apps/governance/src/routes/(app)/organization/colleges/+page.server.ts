import type { PageServerLoad } from './$types.js';
import { listAssociations } from '$lib/server/organization/associations.js';

export const load: PageServerLoad = async () => {
	const allAssociations = listAssociations();
	const colleges = allAssociations.filter(a => a.type === 'college');
	return { colleges };
};
