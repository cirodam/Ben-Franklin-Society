import type { PageServerLoad } from './$types.js';
import { listDocuments } from '$lib/server/documents.js';

export const load: PageServerLoad = async ({ locals }) => {
	if (!locals.person) {
		return { documents: [] };
	}
	const personUuid = locals.person.uuid;
	
	return {
		documents: listDocuments({ owner_uuid: personUuid })
	};
};
