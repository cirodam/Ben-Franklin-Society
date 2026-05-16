import { json, error } from '@sveltejs/kit';
import { db } from '$lib/server/db.js';
import type { RequestHandler } from './$types.js';
import type { CreateIncidentAccountRequest, IncidentAccount } from '$lib/server/injury-types.js';
import { randomUUID } from 'crypto';

/**
 * Add an incident account to an injury record
 * POST /api/injuries/:injury_number/accounts
 * 
 * Allows complainants, respondents, or witnesses to provide their narrative
 */
export const POST: RequestHandler = async ({ params, request, locals }) => {
	const session = locals.session;
	if (!session) {
		error(401, 'Unauthorized');
	}

	const injury_number = parseInt(params.injury_number);
	if (isNaN(injury_number)) {
		error(400, 'Invalid injury number');
	}

	const body = (await request.json()) as CreateIncidentAccountRequest;

	// Validate author_role
	if (!['complainant', 'respondent', 'witness'].includes(body.author_role)) {
		error(400, `Invalid author_role: ${body.author_role}`);
	}

	if (!body.account || body.account.trim().length === 0) {
		error(400, 'Account text is required');
	}

	// Get the injury record UUID
	const record = db
		.prepare('SELECT uuid FROM injury_record WHERE injury_number = ?')
		.get(injury_number) as { uuid: string } | undefined;

	if (!record) {
		error(404, 'Injury record not found');
	}

	// If author_role is complainant or respondent, verify they are actually a party to this injury
	if (body.author_role === 'complainant' || body.author_role === 'respondent') {
		const party = db
			.prepare(
				`
				SELECT 1 FROM injury_party
				WHERE injury_uuid = ? AND party_uuid = ? AND role = ?
			`
			)
			.get(record.uuid, body.author_uuid, body.author_role);

		if (!party) {
			error(
				403,
				`User is not a ${body.author_role} on this injury record and cannot provide an account as ${body.author_role}`
			);
		}
	}

	const uuid = randomUUID();
	const now = new Date().toISOString();

	db.prepare(
		`
		INSERT INTO incident_account (
			uuid, injury_uuid, author_uuid, author_role, account, provided_at, created_at
		) VALUES (?, ?, ?, ?, ?, ?, ?)
	`
	).run(uuid, record.uuid, body.author_uuid, body.author_role, body.account, now, now);

	const created = db
		.prepare('SELECT * FROM incident_account WHERE uuid = ?')
		.get(uuid) as IncidentAccount;

	return json(created, { status: 201 });
};
