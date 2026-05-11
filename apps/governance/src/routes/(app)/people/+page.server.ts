import type { PageServerLoad } from './$types.js';
import { listPeople } from '$lib/server/people.js';

export const load: PageServerLoad = async () => {
	return { people: listPeople() };
};
