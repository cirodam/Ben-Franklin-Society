import type { PageServerLoad } from './$types.js';
import { listDocuments, getCorpus } from '$lib/server/documents.js';

export const load: PageServerLoad = async () => {
	const documents = listDocuments();
	const corpus = getCorpus();
	return { documents, corpus };
};
