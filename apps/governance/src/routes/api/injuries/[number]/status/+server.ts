import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types.js';
import * as injuries from '$lib/server/documents/library-injuries.js';
import type { InjuryReportStatus } from '$lib/server/documents/library-types.js';

/**
 * Update status on an injury report
 * PATCH /api/injuries/[number]/status
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
	// For now, any authenticated user can update status (this should be restricted)

	const injuryNumber = parseInt(params.number);
	if (isNaN(injuryNumber)) {
		error(400, 'Invalid injury number');
	}

	const report = injuries.getInjuryReport(injuryNumber);
	if (!report) {
		error(404, 'Injury report not found');
	}

	const body = await request.json();

	// Validate status
	const validStatuses: InjuryReportStatus[] = [
		'filed',
		'under_review',
		'mediation',
		'resolved',
		'closed'
	];
	if (!body.status || !validStatuses.includes(body.status)) {
		error(400, 'Invalid status. Must be: filed, under_review, mediation, resolved, or closed');
	}

	// Validate status transitions (basic workflow rules)
	const currentStatus = report.content.status;
	
	// Can't go back to filed once it's been reviewed
	if (body.status === 'filed' && currentStatus !== 'filed') {
		error(400, 'Cannot change status back to filed');
	}

	// Should have assessment before moving to mediation
	if (body.status === 'mediation' && !report.content.gravity && !report.content.safety_risk) {
		error(400, 'Report must be assessed (gravity/safety_risk) before moving to mediation');
	}

	// Require resolution_summary when resolving
	if (body.status === 'resolved' && !body.resolution_summary && !report.content.resolution_summary) {
		error(400, 'resolution_summary required when marking as resolved');
	}

	// Require closing_notes when closing
	if (body.status === 'closed' && !body.closing_notes && !report.content.closing_notes) {
		error(400, 'closing_notes required when marking as closed');
	}

	// Update the status
	const updatedReport = injuries.updateStatus(injuryNumber, body.status, {
		mediation_notes: body.mediation_notes,
		resolution_summary: body.resolution_summary,
		closing_notes: body.closing_notes
	});

	return json(updatedReport);
};
