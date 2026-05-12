import { error } from '@sveltejs/kit';
import type { PageServerLoad } from './$types.js';
import { getDocumentBySlug, getDocumentTree } from '$lib/server/documents.js';

export const load: PageServerLoad = async ({ params }) => {
	const doc = getDocumentBySlug(params.slug);
	if (!doc) error(404, 'Document not found');

	const tree = getDocumentTree(doc.uuid);
	if (!tree) error(404, 'Document not found');

	return { tree };
};
