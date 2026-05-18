import { json, error } from '@sveltejs/kit';
import { db } from '$lib/server/db.js';
import type { RequestHandler } from './$types.js';
import type {
	CreateInjuryRequest,
	InjuryRecord,
	InjuryRecordWithDetails
} from '$lib/server/injuries/injury-types.js';
import { randomUUID } from 'crypto';

/**
 * Create a new injury record
 * POST /api/injuries
 */
export const POST: RequestHandler = async ({ request, locals }) => {
	const session = locals.session;
	if (!session) {
		error(401, 'Unauthorized');
	}

	const body = (await request.json()) as CreateInjuryRequest;

	// Validate injury types
	const validTypes = ['physical', 'material', 'relational', 'systemic', 'communal'];
	for (const type of body.injury_types) {
		if (!validTypes.includes(type)) {
			error(400, `Invalid injury type: ${type}`);
		}
	}

	// Validate required fields
	if (!body.injury_types.length) {
		error(400, 'At least one injury type required');
	}
	if (!body.incident_start) {
		error(400, 'incident_start required');
	}
	if (!body.complainants?.length) {
		error(400, 'At least one complainant required');
	}
	if (!body.respondents?.length) {
		error(400, 'At least one respondent required');
	}

	const uuid = randomUUID();
	const now = new Date().toISOString();
	const injury_types_csv = body.injury_types.join(',');

	// Get next injury number
	const result = db
		.prepare('SELECT COALESCE(MAX(injury_number), 0) + 1 as next_num FROM injury_record')
		.get() as { next_num: number };
	const injury_number = result.next_num;

	// Begin transaction
	const insertInjury = db.prepare(`
		INSERT INTO injury_record (
			uuid, injury_number, injury_types, incident_start, incident_end,
			location, filed_at, created_at
		) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
	`);

	const insertParty = db.prepare(`
		INSERT INTO injury_party (injury_uuid, party_uuid, role)
		VALUES (?, ?, ?)
	`);

	const insertAccount = db.prepare(`
		INSERT INTO incident_account (
			uuid, injury_uuid, author_uuid, author_role, account, provided_at, created_at
		) VALUES (?, ?, ?, ?, ?, ?, ?)
	`);

	const transaction = db.transaction(() => {
		// Insert injury record
		insertInjury.run(
			uuid,
			injury_number,
			injury_types_csv,
			body.incident_start,
			body.incident_end || null,
			body.location || null,
			now,
			now
		);

		// Insert complainants
		for (const complainant_uuid of body.complainants) {
			insertParty.run(uuid, complainant_uuid, 'complainant');
		}

		// Insert respondents
		for (const respondent_uuid of body.respondents) {
			insertParty.run(uuid, respondent_uuid, 'respondent');
		}

		// Insert initial account if provided
		if (body.complainant_account) {
			insertAccount.run(
				randomUUID(),
				uuid,
				session.acting_as_uuid,
				'complainant',
				body.complainant_account,
				now,
				now
			);
		}
	});

	transaction();

	const record = db
		.prepare('SELECT * FROM injury_record WHERE uuid = ?')
		.get(uuid) as InjuryRecord;

	return json(record, { status: 201 });
};

/**
 * List injury records
 * GET /api/injuries?gravity=severe&safety_risk=high&status=open
 */
export const GET: RequestHandler = async ({ url, locals }) => {
	const session = locals.session;
	if (!session) {
		error(401, 'Unauthorized');
	}

	// Query parameters for filtering
	const gravity = url.searchParams.get('gravity');
	const safety_risk = url.searchParams.get('safety_risk');
	const limit = parseInt(url.searchParams.get('limit') || '50');
	const offset = parseInt(url.searchParams.get('offset') || '0');

	let query = `
		SELECT *
		FROM injury_record
		WHERE 1=1
	`;
	const params: any[] = [];

	if (gravity) {
		query += ' AND gravity = ?';
		params.push(gravity);
	}

	if (safety_risk) {
		query += ' AND safety_risk = ?';
		params.push(safety_risk);
	}

	query += ' ORDER BY filed_at DESC LIMIT ? OFFSET ?';
	params.push(limit, offset);

	const records = db.prepare(query).all(...params) as InjuryRecord[];

	// Get total count for pagination
	let countQuery = 'SELECT COUNT(*) as total FROM injury_record WHERE 1=1';
	const countParams: any[] = [];

	if (gravity) {
		countQuery += ' AND gravity = ?';
		countParams.push(gravity);
	}

	if (safety_risk) {
		countQuery += ' AND safety_risk = ?';
		countParams.push(safety_risk);
	}

	const { total } = db.prepare(countQuery).get(...countParams) as { total: number };

	return json({
		records,
		total,
		limit,
		offset
	});
};
