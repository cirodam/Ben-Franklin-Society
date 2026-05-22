import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types.js';
import * as injuries from '$lib/server/documents/society-injuries.js';
import type { Gravity, SafetyRisk } from '@bfs/types';

/**
 * Update assessment (gravity and/or safety risk) on an injury report
 * PATCH /api/injuries/[number]/assessment
 * 
 * Restricted to Mediation Service staff (overseen by College of Conciliation)
 */
export const PATCH: RequestHandler = async ({ params, request, locals }) => {
	const session = locals.session;
	if (!session) {
		error(401, 'Unauthorized');
	}

	// TODO: Add proper Mediation Service role check
	// TODO: Add College of Conciliation oversight check
	// For now, any authenticated user can assess (this should be restricted)
	// Will need to check against sortition system once implemented

	const injuryNumber = parseInt(params.number);
	if (isNaN(injuryNumber)) {
		error(400, 'Invalid injury number');
	}

	const report = injuries.getInjuryReport(injuryNumber);
	if (!report) {
		error(404, 'Injury report not found');
	}

	const body = await request.json();

	// Validate gravity if provided
	if (body.gravity !== undefined && body.gravity !== null) {
		const validGravity: Gravity[] = ['minor', 'moderate', 'severe'];
		if (!validGravity.includes(body.gravity)) {
			error(400, 'Invalid gravity value. Must be: minor, moderate, or severe');
		}
	}

	// Validate safety_risk if provided
	if (body.safety_risk !== undefined && body.safety_risk !== null) {
		const validRisk: SafetyRisk[] = ['low', 'moderate', 'high'];
		if (!validRisk.includes(body.safety_risk)) {
			error(400, 'Invalid safety_risk value. Must be: low, moderate, or high');
		}
	}

	// At least one assessment field must be provided
	if (body.gravity === undefined && body.safety_risk === undefined && !body.assessment_notes) {
		error(400, 'Must provide at least one of: gravity, safety_risk, or assessment_notes');
	}

	// Update the assessment
	const updatedReport = injuries.updateAssessment(injuryNumber, {
		gravity: body.gravity,
		safety_risk: body.safety_risk,
		assessed_by_uuid: session.acting_as_uuid,
		assessment_notes: body.assessment_notes
	});

	return json(updatedReport);
};
