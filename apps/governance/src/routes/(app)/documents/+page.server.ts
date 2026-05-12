import type { PageServerLoad } from './$types.js';
import { listDocuments } from '$lib/server/documents.js';
import { db } from '$lib/server/db.js';

export const load: PageServerLoad = async () => {
	const documents = listDocuments().map((doc) => {
		const owner = doc.owner_uuid
			? (db.prepare('SELECT name FROM association WHERE uuid = ?').get(doc.owner_uuid) as { name: string } | undefined)
			: null;
		return { ...doc, owner_name: owner?.name ?? null };
	});
	return { documents };
};
