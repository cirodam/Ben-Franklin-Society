import { error, redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types.js';
import {
	getAssociationByUuid,
	getCurrentMembers,
	getRolesByAssociation,
} from '$lib/server/associations.js';
import { db } from '$lib/server/db.js';
import { getDocumentBySlug } from '$lib/server/documents.js';

export const load: PageServerLoad = async ({ params }) => {
	const association = getAssociationByUuid(params.uuid);
	if (!association) error(404, 'College not found');
	if (association.type !== 'college') redirect(302, `/associations/${params.uuid}`);

	const members = getCurrentMembers(association.uuid);
	const roles = getRolesByAssociation(association.uuid);

	const memberDetails = members.map((m) => {
		const person = db
			.prepare('SELECT uuid, handle, given_name, family_name FROM person WHERE uuid = ?')
			.get(m.person_uuid) as { uuid: string; handle: string; given_name: string; family_name: string } | undefined;
		return { ...m, person: person ?? null };
	});

	const motions = db
		.prepare('SELECT uuid, title, status, created_at FROM motion WHERE body_uuid = ? ORDER BY created_at DESC LIMIT 10')
		.all(association.uuid) as { uuid: string; title: string; status: string; created_at: string }[];

	// Load governing document if slug is set
	const governingDocument = association.governing_document_slug
		? getDocumentBySlug(association.governing_document_slug)
		: null;

	return { association, members: memberDetails, roles, motions, governingDocument };
};
