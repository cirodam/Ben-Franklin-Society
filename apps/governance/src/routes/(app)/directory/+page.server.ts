import type { PageServerLoad } from './$types.js';
import { listPeople } from '$lib/server/people.js';
import { listAssociations } from '$lib/server/associations.js';

export const load: PageServerLoad = async () => {
	return {
		people: listPeople(),
		associations: listAssociations({})
	};
};
