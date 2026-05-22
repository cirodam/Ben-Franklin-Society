import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types.js';
import * as injuries from '$lib/server/documents/library-injuries.js';
import { db } from '$lib/server/db.js';

/**
 * Add an incident account to an injury report
 * POST /api/injuries/[number]/accounts
 */
export const POST: RequestHandler = async ({ params, request, locals }) => {
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

	const body = await request.json();

	// Validate account text
	if (!body.account || typeof body.account !== 'string' || body.account.trim().length === 0) {
		error(400, 'Account text required');
	}

	// Validate author_role
	if (!['complainant', 'respondent', 'witness'].includes(body.author_role)) {
		error(400, 'Invalid author role');
	}

	// Check permissions: user must be party to the report to add account
	// Or witness (anyone can be a witness, but College may want to verify this)
	const isParty = injuries.isPartyToReport(report, session.acting_as_uuid);
	if (!isParty && body.author_role !== 'witness') {
		error(
			403,
			'You must be a party to this injury report to add an account (unless adding as witness)'
		);
	}

	// Verify the author_role matches their actual role in the report
	if (body.author_role === 'complainant') {
		const isComplainant = report.content.complainants.some(
			(c) => c.party_uuid === session.acting_as_uuid
		);
		if (!isComplainant) {
			error(403, 'You are not a complainant on this report');
		}
	}

	if (body.author_role === 'respondent') {
		const isRespondent = report.content.respondents.some(
			(r) => r.party_uuid === session.acting_as_uuid
		);
		if (!isRespondent) {
			error(403, 'You are not a respondent on this report');
		}
	}

	// Get author name
	const person = db
		.prepare('SELECT given_name, family_name FROM person WHERE uuid = ?')
		.get(session.acting_as_uuid) as { given_name: string; family_name: string } | undefined;

	if (!person) {
		error(500, 'Could not find user information');
	}

	// Add the account
	const updatedReport = injuries.addAccount(injuryNumber, {
		author_uuid: session.acting_as_uuid,
		author_name: `${person.given_name} ${person.family_name}`,
		author_role: body.author_role,
		account: body.account.trim()
	});

	return json(updatedReport, { status: 201 });
};
