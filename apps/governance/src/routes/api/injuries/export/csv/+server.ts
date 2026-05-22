import { error } from '@sveltejs/kit';
import type { RequestHandler } from './$types.js';
import * as injuries from '$lib/server/documents/library-injuries.js';

/**
 * GET /api/injuries/export/csv
 * Export injury reports as CSV
 * Only includes reports where user is a party
 */
export const GET: RequestHandler = async ({ locals, url }) => {
	const session = locals.session;
	if (!session) {
		error(401, 'Unauthorized');
	}

	// Get same filters as main list page
	const statusParam = url.searchParams.get('status');
	const gravityParam = url.searchParams.get('gravity');
	const safetyRiskParam = url.searchParams.get('safety_risk');

	// Load reports where user is party
	const allReports = injuries.listInjuryReports({
		status: statusParam as any,
		gravity: gravityParam as any,
		safety_risk: safetyRiskParam as any,
		limit: 1000 // Higher limit for export
	});

	// Filter to reports where user is party
	const reports = allReports.filter((report) =>
		injuries.isPartyToReport(report, session.acting_as_uuid)
	);

	// Generate CSV
	const headers = [
		'Injury Number',
		'Status',
		'Injury Types',
		'Incident Start',
		'Incident End',
		'Location',
		'Filed At',
		'Gravity',
		'Safety Risk',
		'Complainants',
		'Respondents',
		'Account Count',
		'Assessed At',
		'Resolved At',
		'Closed At'
	];

	const rows = reports.map((report) => {
		const content = report.content;
		return [
			report.document_id,
			content.status,
			content.injury_types.join('; '),
			content.incident_start,
			content.incident_end || '',
			content.location || '',
			content.filed_at,
			content.gravity || '',
			content.safety_risk || '',
			content.complainants.map((c) => c.party_name).join('; '),
			content.respondents.map((r) => r.party_name).join('; '),
			content.accounts.length.toString(),
			content.assessed_at || '',
			content.resolved_at || '',
			content.closed_at || ''
		];
	});

	// Escape CSV values
	const escapeCsvValue = (value: string): string => {
		if (value.includes(',') || value.includes('"') || value.includes('\n')) {
			return `"${value.replace(/"/g, '""')}"`;
		}
		return value;
	};

	// Build CSV content
	const csvLines = [
		headers.map(escapeCsvValue).join(','),
		...rows.map((row) => row.map(escapeCsvValue).join(','))
	];
	const csvContent = csvLines.join('\n');

	// Return CSV file
	return new Response(csvContent, {
		headers: {
			'Content-Type': 'text/csv',
			'Content-Disposition': `attachment; filename="injury-reports-${new Date().toISOString().split('T')[0]}.csv"`
		}
	});
};
