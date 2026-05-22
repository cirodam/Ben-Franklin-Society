import { error } from '@sveltejs/kit';
import type { PageServerLoad } from './$types.js';
import * as injuries from '$lib/server/documents/library-injuries.js';

export const load: PageServerLoad = async ({ locals }) => {
	const session = locals.session;
	if (!session) {
		error(401, 'Unauthorized');
	}

	// TODO: Add proper Mediation Service role check
	// TODO: Add College of Conciliation oversight check
	// For now, any authenticated user can access (this should be restricted)

	// Load all injury reports (Mediation Service has full access)
	const allReports = await injuries.listInjuryReports({});

	// Get aggregate statistics
	const stats = await injuries.getInjuryStatistics();

	// Sort by priority: high safety + severe gravity first
	const prioritySorted = [...allReports].sort((a, b) => {
		// Define priority scores
		const getPriority = (report: typeof a) => {
			const gravityScore =
				report.content.gravity === 'severe' ? 3 : report.content.gravity === 'moderate' ? 2 : 1;
			const safetyScore =
				report.content.safety_risk === 'high'
					? 3
					: report.content.safety_risk === 'moderate'
						? 2
						: 1;
			return gravityScore + safetyScore;
		};

		return getPriority(b) - getPriority(a);
	});

	// Group by status
	const byStatus = {
		filed: allReports.filter((r) => r.content.status === 'filed'),
		under_review: allReports.filter((r) => r.content.status === 'under_review'),
		mediation: allReports.filter((r) => r.content.status === 'mediation'),
		resolved: allReports.filter((r) => r.content.status === 'resolved'),
		closed: allReports.filter((r) => r.content.status === 'closed')
	};

	return {
		allReports: prioritySorted,
		byStatus,
		stats
	};
};
