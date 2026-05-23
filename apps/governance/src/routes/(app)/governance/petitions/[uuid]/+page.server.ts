import { error, fail } from '@sveltejs/kit';
import type { PageServerLoad, Actions } from './$types.js';
import {
	getPetitionByUuid,
	signPetition,
	unsignPetition,
} from '$lib/server/governance/petitions.js';
import { db } from '$lib/server/db.js';

export const load: PageServerLoad = async ({ params, locals }) => {
	const petition = getPetitionByUuid(params.uuid);
	if (!petition) error(404, 'Petition not found');

	const actingAs = locals.session?.acting_as_uuid ?? null;

	// Get signature count
	const sigCountStmt = db.prepare(`
		SELECT COUNT(*) as count 
		FROM petition_signature 
		WHERE petition_uuid = ? AND unsigned_at IS NULL
	`);
	const sigCount = (sigCountStmt.get(petition.uuid) as { count: number }).count;

	// Get all current signatures with person details
	const sigStmt = db.prepare(`
		SELECT ps.person_uuid, p.handle as person_handle, p.given_name, p.family_name, ps.signed_at
		FROM petition_signature ps
		JOIN person p ON ps.person_uuid = p.uuid
		WHERE ps.petition_uuid = ? AND ps.unsigned_at IS NULL
		ORDER BY ps.signed_at DESC
	`);
	const signatures = sigStmt.all(petition.uuid) as Array<{
		person_uuid: string;
		person_handle: string;
		given_name: string;
		family_name: string;
		signed_at: string;
	}>;

	// Check if current user has signed
	let isSigned = false;
	if (actingAs) {
		const checkStmt = db.prepare(`
			SELECT 1 FROM petition_signature 
			WHERE petition_uuid = ? AND person_uuid = ? AND unsigned_at IS NULL
		`);
		isSigned = !!checkStmt.get(petition.uuid, actingAs);
	}

	// Get creator details
	const creator = db.prepare(`
		SELECT given_name, family_name, handle 
		FROM person 
		WHERE uuid = ?
	`).get(petition.created_by_uuid) as { given_name: string; family_name: string; handle: string } | undefined;

	return {
		petition,
		signatureCount: sigCount,
		signatures,
		isSigned,
		creator,
	};
};

export const actions: Actions = {
	sign: async ({ params, locals }) => {
		if (!locals.session) return fail(401, { message: 'Not authenticated' });
		const actingAs = locals.session.acting_as_uuid;

		const petition = getPetitionByUuid(params.uuid);
		if (!petition) return fail(404, { message: 'Petition not found' });
		if (petition.status !== 'open') return fail(400, { message: 'Petition is not open for signatures' });

		signPetition(params.uuid, actingAs);
		return { success: true };
	},

	unsign: async ({ params, locals }) => {
		if (!locals.session) return fail(401, { message: 'Not authenticated' });
		const actingAs = locals.session.acting_as_uuid;

		const petition = getPetitionByUuid(params.uuid);
		if (!petition) return fail(404, { message: 'Petition not found' });

		unsignPetition(params.uuid, actingAs);
		return { success: true };
	},
};
