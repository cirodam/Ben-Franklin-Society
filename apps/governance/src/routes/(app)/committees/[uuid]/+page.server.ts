import { error, fail, redirect } from '@sveltejs/kit';
import type { PageServerLoad, Actions } from './$types.js';
import {
	getAssociationByUuid,
	getRolesByAssociation,
	getSortitionConfig,
} from '$lib/server/associations.js';
import { getCurrentTermHolders, listSortitions, vacateSeatTerm } from '$lib/server/sortition.js';
import { hasPermission, PERMISSIONS } from '$lib/server/permissions.js';
import { addEntry, getBodyRecord } from '$lib/server/record.js';
import { audit } from '$lib/server/audit.js';
import { db } from '$lib/server/db.js';

export const load: PageServerLoad = async ({ params, locals }) => {
	const association = getAssociationByUuid(params.uuid);
	if (!association) error(404, 'Committee not found');
	if (association.type !== 'committee') redirect(302, `/associations/${params.uuid}`);

	const config = getSortitionConfig(association.uuid);
	const roles = getRolesByAssociation(association.uuid);

	const termHolders = getCurrentTermHolders(association.uuid).map((t) => {
		const person = db
			.prepare('SELECT uuid, handle, given_name, family_name FROM person WHERE uuid = ?')
			.get(t.person_uuid) as { uuid: string; handle: string; given_name: string; family_name: string } | undefined;
		return { ...t, person: person ?? null };
	});

	const draws = listSortitions(association.uuid);

	// Resolve source college name if set
	const sourceCollege = config?.source_college_uuid
		? (db.prepare('SELECT name FROM association WHERE uuid = ?').get(config.source_college_uuid) as { name: string } | undefined)
		: null;

	const motions = db
		.prepare('SELECT uuid, title, status, created_at FROM motion WHERE body_uuid = ? ORDER BY created_at DESC LIMIT 10')
		.all(association.uuid) as { uuid: string; title: string; status: string; created_at: string }[];

	const canVacate = locals.session
		? hasPermission(locals.session.acting_as_uuid, PERMISSIONS.SEAT_TERMS_VACATE, association.uuid)
		: false;

	const record = getBodyRecord(association.uuid, { limit: 20 }).map((e) => {
		const recorder = db
			.prepare('SELECT handle FROM person WHERE uuid = ?')
			.get(e.recorded_by) as { handle: string } | undefined;
		return { ...e, recorder_handle: recorder?.handle ?? null };
	});

	return { association, config, sourceCollege: sourceCollege ?? null, termHolders, draws, roles, motions, canVacate, record };
};

export const actions: Actions = {
	vacateTerm: async ({ params, locals, request }) => {
		if (!locals.session) error(401, 'Not authenticated');
		const actingAs = locals.session.acting_as_uuid;

		const association = getAssociationByUuid(params.uuid);
		if (!association) error(404, 'Committee not found');

		if (!hasPermission(actingAs, PERMISSIONS.SEAT_TERMS_VACATE, association.uuid)) {
			return fail(403, { error: 'Insufficient permissions' });
		}

		const data = await request.formData();
		const termUuid = data.get('term_uuid') as string | null;
		if (!termUuid) return fail(400, { error: 'Missing term_uuid' });

		vacateSeatTerm(termUuid);
		addEntry(association.uuid, actingAs, 'seat_term_vacated', 'seat_term', termUuid,
			'A seat term was vacated early');
		audit(actingAs, 'seat_term.vacate', 'seat_term', termUuid, 'Seat term vacated early');

		return { success: true };
	},
};
