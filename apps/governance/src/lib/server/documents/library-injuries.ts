/**
 * Library Injuries - Operations for injury report documents
 */
import { readFileSync, writeFileSync, existsSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { randomUUID } from 'node:crypto';
import { db } from '../db.js';
import type {
	InjuryReportDocument,
	InjuryReportContent,
	InjuryType,
	InjuryParty,
	IncidentAccount,
	Gravity,
	SafetyRisk,
	InjuryReportStatus
} from './library-types.js';
import { LIBRARY_DIR, syncToDatabase } from './library-core.js';

/**
 * Load an injury report from file
 */
export function loadInjuryReport(slug: string): InjuryReportDocument | null {
	try {
		const filePath = join(LIBRARY_DIR, `${slug}.json`);
		if (!existsSync(filePath)) {
			return null;
		}

		const content = readFileSync(filePath, 'utf-8');
		const doc = JSON.parse(content) as InjuryReportDocument;
		return doc;
	} catch (err) {
		console.error(`Error loading injury report ${slug}:`, err);
		return null;
	}
}

/**
 * Save an injury report to file and sync to database
 */
export function saveInjuryReport(doc: InjuryReportDocument): void {
	const filePath = join(LIBRARY_DIR, `${doc.slug}.json`);
	doc.updated_at = new Date().toISOString();

	writeFileSync(filePath, JSON.stringify(doc, null, 2), 'utf-8');
	syncToDatabase(doc);
}

/**
 * Get injury report by slug
 */
export function getInjuryReportBySlug(slug: string): InjuryReportDocument | null {
	return loadInjuryReport(slug);
}

/**
 * Get injury report by UUID
 */
export function getInjuryReportByUuid(uuid: string): InjuryReportDocument | null {
	const row = db
		.prepare('SELECT slug FROM library_item WHERE uuid = ? AND type = ?')
		.get(uuid, 'injury_report') as { slug: string } | undefined;

	if (!row) return null;
	return loadInjuryReport(row.slug);
}

/**
 * Get injury report by injury number
 */
export function getInjuryReport(injuryNumber: number): InjuryReportDocument | null {
	const row = db
		.prepare('SELECT slug FROM library_item WHERE type = ? AND document_id = ?')
		.get('injury_report', injuryNumber.toString()) as { slug: string } | undefined;

	if (!row) return null;
	return loadInjuryReport(row.slug);
}

/**
 * Get the next available injury number
 */
export function getNextInjuryNumber(): number {
	const result = db
		.prepare(
			`SELECT COALESCE(MAX(CAST(document_id AS INTEGER)), 0) + 1 as next_num 
			 FROM library_item 
			 WHERE type = 'injury_report' AND document_id IS NOT NULL`
		)
		.get() as { next_num: number };

	return result.next_num;
}

/**
 * List injury reports with filtering
 */
export function listInjuryReports(opts: {
	status?: InjuryReportStatus | InjuryReportStatus[];
	gravity?: Gravity;
	safety_risk?: SafetyRisk;
	party_uuid?: string; // Find reports involving this person/association
	limit?: number;
	offset?: number;
} = {}): InjuryReportDocument[] {
	const reports: InjuryReportDocument[] = [];

	if (!existsSync(LIBRARY_DIR)) return reports;

	try {
		const files = readdirSync(LIBRARY_DIR);
		for (const file of files) {
			if (file.endsWith('.json') && file.startsWith('injury-')) {
				const slug = file.replace('.json', '');
				const report = loadInjuryReport(slug);
				if (report && report.type === 'injury_report') {
					// Apply filters
					if (opts.status) {
						const statuses = Array.isArray(opts.status) ? opts.status : [opts.status];
						if (!statuses.includes(report.content.status)) continue;
					}
					if (opts.gravity && report.content.gravity !== opts.gravity) continue;
					if (opts.safety_risk && report.content.safety_risk !== opts.safety_risk) continue;
					if (opts.party_uuid) {
						const isParty =
							report.content.complainants.some((p) => p.party_uuid === opts.party_uuid) ||
							report.content.respondents.some((p) => p.party_uuid === opts.party_uuid);
						if (!isParty) continue;
					}

					reports.push(report);
				}
			}
		}

		// Sort by injury number descending (newest first)
		reports.sort((a, b) => {
			const numA = parseInt(a.document_id || '0');
			const numB = parseInt(b.document_id || '0');
			return numB - numA;
		});

		// Apply pagination
		const offset = opts.offset || 0;
		const limit = opts.limit || 50;
		return reports.slice(offset, offset + limit);
	} catch (err) {
		console.error(`Error listing injury reports:`, err);
	}

	return reports;
}

/**
 * Create a new injury report
 */
export function createInjuryReport(input: {
	injury_types: InjuryType[];
	incident_start: string;
	incident_end?: string | null;
	location?: string | null;
	complainants: InjuryParty[];
	respondents: InjuryParty[];
	filed_by_uuid: string;
	initial_account?: string; // Optional initial account from filer
}): InjuryReportDocument {
	const uuid = randomUUID();
	const now = new Date().toISOString();
	const injuryNumber = getNextInjuryNumber();
	const slug = `injury-${injuryNumber}`;
	const title = `Injury Report #${injuryNumber}`;

	// Get society UUID for owner
	const society = db
		.prepare("SELECT uuid FROM association WHERE type = 'society' LIMIT 1")
		.get() as { uuid: string } | undefined;

	if (!society) {
		throw new Error('Society association not found');
	}

	// Build accounts array
	const accounts: IncidentAccount[] = [];
	if (input.initial_account) {
		// Find the filer's name from the complainants
		const filer = input.complainants.find((c) => c.party_uuid === input.filed_by_uuid);
		accounts.push({
			uuid: randomUUID(),
			author_uuid: input.filed_by_uuid,
			author_name: filer?.party_name || 'Unknown',
			author_role: 'complainant',
			account: input.initial_account,
			provided_at: now
		});
	}

	const doc: InjuryReportDocument = {
		uuid,
		type: 'injury_report',
		slug,
		document_id: injuryNumber.toString(),
		version: 1,
		title,
		owner_uuid: society.uuid,
		created_at: now,
		updated_at: now,
		content: {
			status: 'filed',
			injury_types: input.injury_types,
			incident_start: input.incident_start,
			incident_end: input.incident_end || null,
			location: input.location || null,
			complainants: input.complainants,
			respondents: input.respondents,
			accounts,
			gravity: null,
			safety_risk: null,
			assessed_at: null,
			assessed_by_uuid: null,
			assessment_notes: null,
			mediation_notes: null,
			resolution_summary: null,
			resolved_at: null,
			closed_at: null,
			closing_notes: null,
			filed_by_uuid: input.filed_by_uuid,
			filed_at: now
		}
	};

	saveInjuryReport(doc);
	return doc;
}

/**
 * Add an incident account to an injury report
 */
export function addAccount(
	injuryNumber: number,
	input: {
		author_uuid: string;
		author_name: string;
		author_role: 'complainant' | 'respondent' | 'witness';
		account: string;
	}
): InjuryReportDocument {
	const doc = getInjuryReport(injuryNumber);
	if (!doc) throw new Error(`Injury report not found: ${injuryNumber}`);

	const newAccount: IncidentAccount = {
		uuid: randomUUID(),
		author_uuid: input.author_uuid,
		author_name: input.author_name,
		author_role: input.author_role,
		account: input.account,
		provided_at: new Date().toISOString()
	};

	doc.content.accounts.push(newAccount);
	saveInjuryReport(doc);
	return doc;
}

/**
 * Update assessment (gravity and/or safety risk)
 */
export function updateAssessment(
	injuryNumber: number,
	input: {
		gravity?: Gravity;
		safety_risk?: SafetyRisk;
		assessed_by_uuid: string;
		assessment_notes?: string;
	}
): InjuryReportDocument {
	const doc = getInjuryReport(injuryNumber);
	if (!doc) throw new Error(`Injury report not found: ${injuryNumber}`);

	if (input.gravity !== undefined) {
		doc.content.gravity = input.gravity;
	}
	if (input.safety_risk !== undefined) {
		doc.content.safety_risk = input.safety_risk;
	}
	if (input.assessment_notes !== undefined) {
		doc.content.assessment_notes = input.assessment_notes;
	}

	doc.content.assessed_by_uuid = input.assessed_by_uuid;
	doc.content.assessed_at = new Date().toISOString();

	// Auto-update status to under_review if still filed
	if (doc.content.status === 'filed') {
		doc.content.status = 'under_review';
	}

	saveInjuryReport(doc);
	return doc;
}

/**
 * Update status
 */
export function updateStatus(
	injuryNumber: number,
	status: InjuryReportStatus,
	updates?: {
		mediation_notes?: string;
		resolution_summary?: string;
		closing_notes?: string;
	}
): InjuryReportDocument {
	const doc = getInjuryReport(injuryNumber);
	if (!doc) throw new Error(`Injury report not found: ${injuryNumber}`);

	doc.content.status = status;

	if (updates?.mediation_notes !== undefined) {
		doc.content.mediation_notes = updates.mediation_notes;
	}
	if (updates?.resolution_summary !== undefined) {
		doc.content.resolution_summary = updates.resolution_summary;
	}
	if (updates?.closing_notes !== undefined) {
		doc.content.closing_notes = updates.closing_notes;
	}

	// Set timestamps based on status
	const now = new Date().toISOString();
	if (status === 'resolved' && !doc.content.resolved_at) {
		doc.content.resolved_at = now;
	}
	if (status === 'closed' && !doc.content.closed_at) {
		doc.content.closed_at = now;
	}

	saveInjuryReport(doc);
	return doc;
}

/**
 * Check if a person is party to an injury report
 */
export function isPartyToReport(doc: InjuryReportDocument, personUuid: string): boolean {
	return (
		doc.content.complainants.some((p) => p.party_uuid === personUuid) ||
		doc.content.respondents.some((p) => p.party_uuid === personUuid)
	);
}

/**
 * Check if a person has provided an account
 */
export function hasProvidedAccount(doc: InjuryReportDocument, personUuid: string): boolean {
	return doc.content.accounts.some((a) => a.author_uuid === personUuid);
}

/**
 * Get statistics for injury reports
 */
export function getInjuryStatistics(): {
	total: number;
	by_status: Record<InjuryReportStatus, number>;
	by_gravity: Record<Gravity, number>;
	by_safety_risk: Record<SafetyRisk, number>;
} {
	const all = listInjuryReports({ limit: 10000 });

	const stats = {
		total: all.length,
		by_status: {
			filed: 0,
			under_review: 0,
			mediation: 0,
			resolved: 0,
			closed: 0
		} as Record<InjuryReportStatus, number>,
		by_gravity: {
			minor: 0,
			moderate: 0,
			severe: 0
		} as Record<Gravity, number>,
		by_safety_risk: {
			low: 0,
			moderate: 0,
			high: 0
		} as Record<SafetyRisk, number>
	};

	for (const report of all) {
		stats.by_status[report.content.status]++;
		if (report.content.gravity) {
			stats.by_gravity[report.content.gravity]++;
		}
		if (report.content.safety_risk) {
			stats.by_safety_risk[report.content.safety_risk]++;
		}
	}

	return stats;
}
