import { error } from '@sveltejs/kit';
import type { PageServerLoad } from './$types.js';
import { getDocumentBySlug } from '$lib/server/documents.js';

export const load: PageServerLoad = async ({ params }) => {
	const document = getDocumentBySlug(params.slug);
	if (!document) error(404, 'Document not found');

	return { document };
};
