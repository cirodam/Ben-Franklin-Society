import type { PageServerLoad } from './$types.js';
import { listDocuments } from '$lib/server/documents.js';

export const load: PageServerLoad = async () => {
	return { documents: listDocuments() };
};
