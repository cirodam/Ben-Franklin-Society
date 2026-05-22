import { error, redirect, fail } from '@sveltejs/kit';
import type { PageServerLoad, Actions } from './$types.js';
import * as injuries from '$lib/server/documents/library-injuries.js';
import { db } from '$lib/server/db.js';

export const load: PageServerLoad = async ({ params, locals }) => {
	if (!locals.session) {
		redirect(302, '/login');
	}

	const injuryNumber = parseInt(params.number);
	if (isNaN(injuryNumber)) {
		error(400, 'Invalid injury number');
	}

	const report = injuries.getInjuryReport(injuryNumber);
	if (!report) {
		error(404, 'Injury report not found');
	}

	// Check if user is party to the report
	const isParty = injuries.isPartyToReport(report, locals.session.acting_as_uuid);
	if (!isParty) {
		error(403, 'You do not have permission to view this injury report');
	}

	return {
		report
	};
};

export const actions: Actions = {
	addAccount: async ({ request, params, locals }) => {
		if (!locals.session) {
			return fail(401, { error: 'Unauthorized' });
		}

		const injuryNumber = parseInt(params.number);
		if (isNaN(injuryNumber)) {
			return fail(400, { error: 'Invalid injury number' });
		}

		const report = injuries.getInjuryReport(injuryNumber);
		if (!report) {
			return fail(404, { error: 'Injury report not found' });
		}

		const formData = await request.formData();
		const author_role = formData.get('author_role') as string;
		const account = formData.get('account') as string;

		if (!author_role || !['complainant', 'respondent', 'witness'].includes(author_role)) {
			return fail(400, { error: 'Invalid author role' });
		}

		if (!account || account.trim().length === 0) {
			return fail(400, { error: 'Account text required' });
		}

		// Check permissions
		const isParty = injuries.isPartyToReport(report, locals.session.acting_as_uuid);
		if (!isParty && author_role !== 'witness') {
			return fail(403, {
				error: 'You must be a party to this injury report to add an account (unless adding as witness)'
			});
		}

		// Verify role matches actual role in report
		if (author_role === 'complainant') {
			const isComplainant = report.content.complainants.some(
				(c) => c.party_uuid === locals.session!.acting_as_uuid
			);
			if (!isComplainant) {
				return fail(403, { error: 'You are not a complainant on this report' });
			}
		}

		if (author_role === 'respondent') {
			const isRespondent = report.content.respondents.some(
				(r) => r.party_uuid === locals.session!.acting_as_uuid
			);
			if (!isRespondent) {
				return fail(403, { error: 'You are not a respondent on this report' });
			}
		}

		// Get author name
		const person = db
			.prepare('SELECT given_name, family_name FROM person WHERE uuid = ?')
			.get(locals.session.acting_as_uuid) as
			| { given_name: string; family_name: string }
			| undefined;

		if (!person) {
			return fail(500, { error: 'Could not find user information' });
		}

		// Add the account
		injuries.addAccount(injuryNumber, {
			author_uuid: locals.session.acting_as_uuid,
			author_name: `${person.given_name} ${person.family_name}`,
			author_role: author_role as 'complainant' | 'respondent' | 'witness',
			account: account.trim()
		});

		return { success: true };
	},

	assess: async ({ request, params, locals }) => {
		if (!locals.session) {
			return fail(401, { error: 'Unauthorized' });
		}

		// TODO: Add Mediation Service role check
		// TODO: Add College of Conciliation oversight check
		// For now, any authenticated user can assess

		const injuryNumber = parseInt(params.number);
		if (isNaN(injuryNumber)) {
			return fail(400, { error: 'Invalid injury number' });
		}

		const report = injuries.getInjuryReport(injuryNumber);
		if (!report) {
			return fail(404, { error: 'Injury report not found' });
		}

		const formData = await request.formData();
		const gravity = formData.get('gravity') as string;
		const safetyRisk = formData.get('safetyRisk') as string;
		const assessmentNotes = formData.get('assessmentNotes') as string;

		if (!gravity || !['minor', 'moderate', 'severe'].includes(gravity)) {
			return fail(400, { error: 'Invalid gravity value' });
		}

		if (!safetyRisk || !['low', 'moderate', 'high'].includes(safetyRisk)) {
			return fail(400, { error: 'Invalid safety risk value' });
		}

		injuries.updateAssessment(
			injuryNumber,
			{
				gravity: gravity as 'minor' | 'moderate' | 'severe',
				safety_risk: safetyRisk as 'low' | 'moderate' | 'high',
				assessment_notes: assessmentNotes || null
			},
			locals.session.acting_as_uuid
		);

		return { success: true };
	},

	updateStatus: async ({ request, params, locals }) => {
		if (!locals.session) {
			return fail(401, { error: 'Unauthorized' });
		}

		// TODO: Add Mediation Service role check
		// TODO: Add College of Conciliation oversight check
		// For now, any authenticated user can update status

		const injuryNumber = parseInt(params.number);
		if (isNaN(injuryNumber)) {
			return fail(400, { error: 'Invalid injury number' });
		}

		const report = injuries.getInjuryReport(injuryNumber);
		if (!report) {
			return fail(404, { error: 'Injury report not found' });
		}

		const formData = await request.formData();
		const status = formData.get('status') as string;
		const mediationNotes = formData.get('mediationNotes') as string;
		const resolutionSummary = formData.get('resolutionSummary') as string;
		const closingNotes = formData.get('closingNotes') as string;

		if (
			!status ||
			!['filed', 'under_review', 'mediation', 'resolved', 'closed'].includes(status)
		) {
			return fail(400, { error: 'Invalid status value' });
		}

		// Validation based on status
		if (status === 'resolved' && !resolutionSummary?.trim()) {
			return fail(400, { error: 'Resolution summary required when resolving' });
		}

		if (status === 'closed' && !closingNotes?.trim()) {
			return fail(400, { error: 'Closing notes required when closing' });
		}

		injuries.updateStatus(injuryNumber, {
			status: status as any,
			mediation_notes: mediationNotes || null,
			resolution_summary: resolutionSummary || null,
			closing_notes: closingNotes || null
		});

		return { success: true };
	}
};
