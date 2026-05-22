import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types.js';
import * as injuries from '$lib/server/documents/library-injuries.js';
import { db } from '$lib/server/db.js';
import type { InjuryType, InjuryParty } from '$lib/server/documents/library-types.js';

/**
 * Create a new injury report
 * POST /api/injuries
 */
export const POST: RequestHandler = async ({ request, locals }) => {
	const session = locals.session;
	if (!session) {
		error(401, 'Unauthorized');
	}

	const body = await request.json();

	// Validate injury types
	const validTypes: InjuryType[] = ['physical', 'material', 'relational', 'systemic', 'communal'];
	if (!Array.isArray(body.injury_types) || body.injury_types.length === 0) {
		error(400, 'At least one injury type required');
	}
	for (const type of body.injury_types) {
		if (!validTypes.includes(type)) {
			error(400, `Invalid injury type: ${type}`);
		}
	}

	// Validate required fields
	if (!body.incident_start) {
		error(400, 'incident_start required');
	}
	if (!Array.isArray(body.complainants) || body.complainants.length === 0) {
		error(400, 'At least one complainant required');
	}
	if (!Array.isArray(body.respondents) || body.respondents.length === 0) {
		error(400, 'At least one respondent required');
	}

	// Build complainants with cached names
	const complainants: InjuryParty[] = [];
	for (const uuid of body.complainants) {
		const person = db
			.prepare('SELECT given_name, family_name FROM person WHERE uuid = ?')
			.get(uuid) as { given_name: string; family_name: string } | undefined;
		if (!person) {
			error(400, `Complainant not found: ${uuid}`);
		}
		complainants.push({
			party_uuid: uuid,
			party_name: `${person.given_name} ${person.family_name}`,
			party_type: 'person'
		});
	}

	// Build respondents with cached names
	const respondents: InjuryParty[] = [];
	for (const uuid of body.respondents) {
		// Try person first
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

		error(400, `Respondent not found: ${uuid}`);
	}

	// Create the injury report
	const report = injuries.createInjuryReport({
		injury_types: body.injury_types,
		incident_start: body.incident_start,
		incident_end: body.incident_end || null,
		location: body.location || null,
		complainants,
		respondents,
		filed_by_uuid: session.acting_as_uuid,
		initial_account: body.initial_account || undefined
	});

	return json(report, { status: 201 });
};

/**
 * List injury reports
 * GET /api/injuries?status=filed&gravity=severe&safety_risk=high&limit=50&offset=0
 */
export const GET: RequestHandler = async ({ url, locals }) => {
	const session = locals.session;
	if (!session) {
		error(401, 'Unauthorized');
	}

	// TODO: Check if user is Mediation Service staff for full access
	// TODO: Check if user is College of Conciliation member for oversight access
	// For now, users can only see reports they're party to

	// Query parameters
	const statusParam = url.searchParams.get('status');
	const gravityParam = url.searchParams.get('gravity');
	const safetyRiskParam = url.searchParams.get('safety_risk');
	const limitParam = parseInt(url.searchParams.get('limit') || '50');
	const offsetParam = parseInt(url.searchParams.get('offset') || '0');

	// List reports
	const reports = injuries.listInjuryReports({
		status: statusParam as any,
		gravity: gravityParam as any,
		safety_risk: safetyRiskParam as any,
		limit: limitParam,
		offset: offsetParam
	});

	// Filter to only reports the user is party to (unless College member)
		// TODO: Add Mediation Service role check
		// TODO: Add College of Conciliation oversight check
	const filteredReports = reports.filter((report) =>
		injuries.isPartyToReport(report, session.acting_as_uuid)
	);

	return json(filteredReports);
};
