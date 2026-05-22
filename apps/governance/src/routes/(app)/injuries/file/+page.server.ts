import { redirect, fail } from '@sveltejs/kit';
import type { PageServerLoad, Actions } from './$types.js';
import { db } from '$lib/server/db.js';
import * as injuries from '$lib/server/documents/society-injuries.js';
import type { InjuryType, InjuryParty } from '@bfs/types';

export const load: PageServerLoad = async ({ locals }) => {
	if (!locals.session) {
		redirect(302, '/login');
	}

	// Load all active members for party selection
	const members = db
		.prepare('SELECT uuid, given_name, family_name, handle FROM person WHERE status = ? ORDER BY family_name, given_name')
		.all('active') as Array<{
		uuid: string;
		given_name: string;
		family_name: string;
		handle: string;
	}>;

	return {
		members
	};
};

export const actions: Actions = {
	default: async ({ request, locals }) => {
		if (!locals.session) {
			return fail(401, { error: 'Unauthorized' });
		}

		const formData = await request.formData();

		// Parse injury types
		const injuryTypes: InjuryType[] = [];
		if (formData.get('injury_type_physical')) injuryTypes.push('physical');
		if (formData.get('injury_type_material')) injuryTypes.push('material');
		if (formData.get('injury_type_relational')) injuryTypes.push('relational');
		if (formData.get('injury_type_systemic')) injuryTypes.push('systemic');
		if (formData.get('injury_type_communal')) injuryTypes.push('communal');

		if (injuryTypes.length === 0) {
			return fail(400, { error: 'At least one injury type required' });
		}

		// Parse dates
		const incident_start = formData.get('incident_start') as string;
		const incident_end = formData.get('incident_end') as string;
		const location = formData.get('location') as string;

		if (!incident_start) {
			return fail(400, { error: 'Incident start date required' });
		}

		// Parse complainants
		const complainantUuids = formData.getAll('complainants') as string[];
		if (complainantUuids.length === 0) {
			return fail(400, { error: 'At least one complainant required' });
		}

		const complainants: InjuryParty[] = [];
		for (const uuid of complainantUuids) {
			const person = db
				.prepare('SELECT given_name, family_name FROM person WHERE uuid = ?')
				.get(uuid) as { given_name: string; family_name: string } | undefined;
			if (!person) {
				return fail(400, { error: `Complainant not found: ${uuid}` });
			}
			complainants.push({
				party_uuid: uuid,
				party_name: `${person.given_name} ${person.family_name}`,
				party_type: 'person'
			});
		}

		// Parse respondents
		const respondentUuids = formData.getAll('respondents') as string[];
		if (respondentUuids.length === 0) {
			return fail(400, { error: 'At least one respondent required' });
		}

		const respondents: InjuryParty[] = [];
		for (const uuid of respondentUuids) {
			const person = db
				.prepare('SELECT given_name, family_name FROM person WHERE uuid = ?')
				.get(uuid) as { given_name: string; family_name: string } | undefined;
			if (person) {
				respondents.push({
					party_uuid: uuid,
					party_name: `${person.given_name} ${person.family_name}`,
					party_type: 'person'
				});
				continue;
			}

			// Try association
			const association = db
				.prepare('SELECT name FROM association WHERE uuid = ?')
				.get(uuid) as { name: string } | undefined;
			if (association) {
				respondents.push({
					party_uuid: uuid,
					party_name: association.name,
					party_type: 'association'
				});
				continue;
			}

			return fail(400, { error: `Respondent not found: ${uuid}` });
		}

		// Initial account (optional)
		const initial_account = formData.get('initial_account') as string;

		// Create the injury report
		const report = injuries.createInjuryReport({
			injury_types: injuryTypes,
			incident_start,
			incident_end: incident_end || null,
			location: location || null,
			complainants,
			respondents,
			filed_by_uuid: locals.session.acting_as_uuid,
			initial_account: initial_account || undefined
		});

		const injuryNumber = parseInt(report.document_id || '0');
		redirect(302, `/injuries/${injuryNumber}`);
	}
};
