import { redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types.js';
import * as injuries from '$lib/server/documents/library-injuries.js';
import type { InjuryType } from '$lib/server/documents/library-types.js';

export const load: PageServerLoad = async ({ locals, url }) => {
	if (!locals.session) {
		redirect(302, '/login');
	}

	// Get query parameters
	const statusParam = url.searchParams.get('status');
	const gravityParam = url.searchParams.get('gravity');
	const safetyRiskParam = url.searchParams.get('safety_risk');
	const injuryTypeParam = url.searchParams.get('injury_type');
	const sortParam = url.searchParams.get('sort') || 'filed_at_desc';
	const partySearchParam = url.searchParams.get('party_search');

	// Load reports where user is party
	let allReports = injuries.listInjuryReports({
		status: statusParam as any,
		gravity: gravityParam as any,
		safety_risk: safetyRiskParam as any,
		party_uuid: partySearchParam || undefined,
		limit: 200 // Increase limit for better filtering/sorting
	});

	// Filter to reports where user is party
	let reports = allReports.filter((report) =>
		injuries.isPartyToReport(report, locals.session!.acting_as_uuid)
	);

	// Filter by injury type if specified
	if (injuryTypeParam) {
		const requestedTypes = injuryTypeParam.split(',') as InjuryType[];
		reports = reports.filter((report) =>
			requestedTypes.some((type) => report.content.injury_types.includes(type))
		);
	}

	// Sort reports
	reports.sort((a, b) => {
		switch (sortParam) {
			case 'filed_at_desc':
				return new Date(b.content.filed_at).getTime() - new Date(a.content.filed_at).getTime();
			case 'filed_at_asc':
				return new Date(a.content.filed_at).getTime() - new Date(b.content.filed_at).getTime();
			case 'resolved_at_desc':
				if (!a.content.resolved_at && !b.content.resolved_at) return 0;
				if (!a.content.resolved_at) return 1;
				if (!b.content.resolved_at) return -1;
				return (
					new Date(b.content.resolved_at).getTime() - new Date(a.content.resolved_at).getTime()
				);
			case 'gravity':
				const gravityOrder = { severe: 3, moderate: 2, minor: 1 };
				const aGravity = a.content.gravity ? gravityOrder[a.content.gravity] : 0;
				const bGravity = b.content.gravity ? gravityOrder[b.content.gravity] : 0;
				return bGravity - aGravity;
			case 'safety_risk':
				const safetyOrder = { high: 3, moderate: 2, low: 1 };
				const aSafety = a.content.safety_risk ? safetyOrder[a.content.safety_risk] : 0;
				const bSafety = b.content.safety_risk ? safetyOrder[b.content.safety_risk] : 0;
				return bSafety - aSafety;
			default:
				return 0;
		}
	});

	// Get aggregate statistics for user's reports
	const stats = {
		total: reports.length,
		byStatus: {
			filed: reports.filter((r) => r.content.status === 'filed').length,
			under_review: reports.filter((r) => r.content.status === 'under_review').length,
			mediation: reports.filter((r) => r.content.status === 'mediation').length,
			resolved: reports.filter((r) => r.content.status === 'resolved').length,
			closed: reports.filter((r) => r.content.status === 'closed').length
		},
		byGravity: {
			minor: reports.filter((r) => r.content.gravity === 'minor').length,
			moderate: reports.filter((r) => r.content.gravity === 'moderate').length,
			severe: reports.filter((r) => r.content.gravity === 'severe').length,
			unassessed: reports.filter((r) => !r.content.gravity).length
		},
		bySafetyRisk: {
			low: reports.filter((r) => r.content.safety_risk === 'low').length,
			moderate: reports.filter((r) => r.content.safety_risk === 'moderate').length,
			high: reports.filter((r) => r.content.safety_risk === 'high').length,
			unassessed: reports.filter((r) => !r.content.safety_risk).length
		}
	};

	return {
		reports,
		stats,
		filters: {
			status: statusParam,
			gravity: gravityParam,
			safety_risk: safetyRiskParam,
			injury_type: injuryTypeParam,
			sort: sortParam,
			party_search: partySearchParam
		}
	};
};
