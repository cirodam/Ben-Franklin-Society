import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types.js';
import * as injuries from '$lib/server/documents/library-injuries.js';

/**
 * Get a specific injury report
 * GET /api/injuries/[number]
 */
export const GET: RequestHandler = async ({ params, locals }) => {
	const session = locals.session;
	if (!session) {
		error(401, 'Unauthorized');
	}

	const injuryNumber = parseInt(params.number);
	if (isNaN(injuryNumber)) {
		error(400, 'Invalid injury number');
	}

	const report = injuries.getInjuryReport(injuryNumber);
	if (!report) {
		error(404, 'Injury report not found');
	}

	// Check permissions: user must be party to the report or College member
	// TODO: Add Mediation Service role check (full access)
	// TODO: Add College of Conciliation role check (oversight access)
	const isParty = injuries.isPartyToReport(report, session.acting_as_uuid);
	if (!isParty) {
		error(403, 'You do not have permission to view this injury report');
	}

	return json(report);
};
