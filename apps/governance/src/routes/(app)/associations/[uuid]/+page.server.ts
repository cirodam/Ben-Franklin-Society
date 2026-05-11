import { error, redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types.js';
import {
	getAssociationByUuid,
	getCurrentMembers,
	getRolesByAssociation,
} from '$lib/server/associations.js';
import { db } from '$lib/server/db.js';

export const load: PageServerLoad = async ({ params }) => {
	const association = getAssociationByUuid(params.uuid);
	if (!association) error(404, 'Association not found');

	// Redirect to canonical routes for typed pages
	const canonicalRoutes: Record<string, string> = {
		general_assembly:      '/general-assembly',
		central_bank:          '/central-bank',
		social_insurance_fund: '/social-insurance',
		community_bank:        '/community-bank',
		service:               `/services/${params.uuid}`,
		committee:             `/committees/${params.uuid}`,
		college:               `/colleges/${params.uuid}`,
	};
	if (canonicalRoutes[association.type]) {
		redirect(302, canonicalRoutes[association.type]);
	}

	const members = getCurrentMembers(association.uuid);
	const roles = getRolesByAssociation(association.uuid);

	// Pull person details for current members
	const memberDetails = members.map((m) => {
		const person = db
			.prepare('SELECT uuid, handle, given_name, family_name FROM person WHERE uuid = ?')
			.get(m.person_uuid) as { uuid: string; handle: string; given_name: string; family_name: string } | undefined;
		return { ...m, person: person ?? null };
	});

	// Motions where this association is the body
	const motions = db
		.prepare(`SELECT uuid, title, status, created_at FROM motion WHERE body_uuid = ? ORDER BY created_at DESC LIMIT 10`)
		.all(association.uuid) as { uuid: string; title: string; status: string; created_at: string }[];

	return { association, members: memberDetails, roles, motions };
};
