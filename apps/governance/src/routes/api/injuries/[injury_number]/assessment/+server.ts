import { json, error } from '@sveltejs/kit';
import { db } from '$lib/server/db.js';
import type { RequestHandler } from './$types.js';
import type { UpdateInjuryAssessmentRequest, InjuryRecord } from '$lib/server/injury-types.js';

/**
 * Update gravity and/or safety_risk assessment for an injury record
 * PATCH /api/injuries/:injury_number/assessment
 * 
 * Typically performed by College of Conciliation members during intake/review
 */
export const PATCH: RequestHandler = async ({ params, request, locals }) => {
	const session = locals.session;
	if (!session) {
		error(401, 'Unauthorized');
	}

	const injury_number = parseInt(params.injury_number);
	if (isNaN(injury_number)) {
		error(400, 'Invalid injury number');
	}

	const body = (await request.json()) as UpdateInjuryAssessmentRequest;

	// Validate gravity if provided
	if (body.gravity && !['minor', 'moderate', 'severe'].includes(body.gravity)) {
		error(400, `Invalid gravity value: ${body.gravity}`);
	}

	// Validate safety_risk if provided
	if (body.safety_risk && !['low', 'moderate', 'high'].includes(body.safety_risk)) {
		error(400, `Invalid safety_risk value: ${body.safety_risk}`);
	}

	if (!body.gravity && !body.safety_risk) {
		error(400, 'At least one of gravity or safety_risk must be provided');
	}

	// Check if record exists
	const existing = db
		.prepare('SELECT uuid FROM injury_record WHERE injury_number = ?')
		.get(injury_number) as { uuid: string } | undefined;

	if (!existing) {
		error(404, 'Injury record not found');
	}

	// Build update query dynamically based on what's provided
	const updates: string[] = [];
	const sqlParams: any[] = [];

	if (body.gravity) {
		updates.push('gravity = ?');
		sqlParams.push(body.gravity);
	}

	if (body.safety_risk) {
		updates.push('safety_risk = ?');
		sqlParams.push(body.safety_risk);
	}

	sqlParams.push(injury_number);

	const query = `
		UPDATE injury_record
		SET ${updates.join(', ')}
		WHERE injury_number = ?
	`;

	db.prepare(query).run(...sqlParams);

	// Return updated record
	const updated = db
		.prepare('SELECT * FROM injury_record WHERE injury_number = ?')
		.get(injury_number) as InjuryRecord;

	return json(updated);
};
