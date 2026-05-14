import type { PageServerLoad } from './$types.js';
import { listDocuments } from '$lib/server/documents.js';

export const load: PageServerLoad = async ({ locals }) => {
	const personUuid = locals.person.uuid;
	
	return {
		documents: listDocuments({ owner_uuid: personUuid })
	};
};
