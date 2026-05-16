import { json, error } from '@sveltejs/kit';
import { db } from '$lib/server/db.js';
import type { RequestHandler } from './$types.js';
import type { InjuryRecord, InjuryRecordWithDetails } from '$lib/server/injury-types.js';

/**
 * Get injury record by injury number with full details
 * GET /api/injuries/:injury_number
 */
export const GET: RequestHandler = async ({ params, locals }) => {
	const session = locals.session;
	if (!session) {
		error(401, 'Unauthorized');
	}

	const injury_number = parseInt(params.injury_number);
	if (isNaN(injury_number)) {
		error(400, 'Invalid injury number');
	}

	// Get the injury record
	const record = db
		.prepare('SELECT * FROM injury_record WHERE injury_number = ?')
		.get(injury_number) as InjuryRecord | undefined;

	if (!record) {
		error(404, 'Injury record not found');
	}

	// Get complainants with person details
	const complainants = db
		.prepare(
			`
			SELECT 
				ip.party_uuid as uuid,
				p.handle,
				p.given_name || ' ' || p.family_name as name
			FROM injury_party ip
			LEFT JOIN person p ON ip.party_uuid = p.uuid
			WHERE ip.injury_uuid = ? AND ip.role = 'complainant'
		`
		)
		.all(record.uuid) as Array<{ uuid: string; handle?: string; name?: string }>;

	// Get respondents with person details
	const respondents = db
		.prepare(
			`
			SELECT 
				ip.party_uuid as uuid,
				p.handle,
				p.given_name || ' ' || p.family_name as name
			FROM injury_party ip
			LEFT JOIN person p ON ip.party_uuid = p.uuid
			WHERE ip.injury_uuid = ? AND ip.role = 'respondent'
		`
		)
		.all(record.uuid) as Array<{ uuid: string; handle?: string; name?: string }>;

	// Get all incident accounts
	const accounts = db
		.prepare(
			`
			SELECT *
			FROM incident_account
			WHERE injury_uuid = ?
			ORDER BY provided_at ASC
		`
		)
		.all(record.uuid) as InjuryRecordWithDetails['accounts'];

	const detailedRecord: InjuryRecordWithDetails = {
		...record,
		complainants,
		respondents,
		accounts
	};

	return json(detailedRecord);
};
