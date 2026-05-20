/**
 * Library Simple Documents - Operations for prose, contracts, and org charts
 */
import { readFileSync, readdirSync, writeFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import type { ProseDocument, ContractDocument, OrgChartDocument } from './library-types.js';
import { PROSE_DIR, CONTRACTS_DIR, ORG_CHARTS_DIR, syncToDatabase } from './library-core.js';

// ============================================================================
// Prose Documents
// ============================================================================

/**
 * Load a prose document from file
 */
export function loadProseDocument(slug: string): ProseDocument | null {
	try {
		const filePath = join(PROSE_DIR, `${slug}.json`);
		if (!existsSync(filePath)) {
			return null;
		}

		const content = readFileSync(filePath, 'utf-8');
		const doc = JSON.parse(content) as ProseDocument;
		return doc;
	} catch (err) {
		console.error(`Error loading prose document ${slug}:`, err);
		return null;
	}
}

/**
 * Save a prose document to file and sync to database
 */
export function saveProseDocument(doc: ProseDocument): void {
	const filePath = join(PROSE_DIR, `${doc.slug}.json`);
	doc.updated_at = new Date().toISOString();
	
	writeFileSync(filePath, JSON.stringify(doc, null, 2), 'utf-8');
	syncToDatabase(doc);
}

// ============================================================================
// Contracts
// ============================================================================

/**
 * Load a contract document by slug
 */
export function loadContract(slug: string): ContractDocument | null {
	try {
		const filePath = join(CONTRACTS_DIR, `${slug}.json`);
		if (!existsSync(filePath)) {
			return null;
		}

		const content = readFileSync(filePath, 'utf-8');
		const doc = JSON.parse(content) as ContractDocument;
		return doc;
	} catch (err) {
		console.error(`Error loading contract ${slug}:`, err);
		return null;
	}
}

/**
 * Save a contract document to file and sync to database
 */
export function saveContract(doc: ContractDocument): void {
	const filePath = join(CONTRACTS_DIR, `${doc.slug}.json`);
	doc.updated_at = new Date().toISOString();
	
	writeFileSync(filePath, JSON.stringify(doc, null, 2), 'utf-8');
	syncToDatabase(doc);
}

// ============================================================================
// Org Charts
// ============================================================================

/**
 * Load an org chart document by slug
 */
export function loadOrgChartDocument(slug: string): OrgChartDocument | null {
	try {
		const filePath = join(ORG_CHARTS_DIR, `${slug}.json`);
		if (!existsSync(filePath)) {
			return null;
		}

		const content = readFileSync(filePath, 'utf-8');
		const doc = JSON.parse(content) as OrgChartDocument;
		return doc;
	} catch (err) {
		console.error(`Error loading org chart ${slug}:`, err);
		return null;
	}
}

/**
 * List all org chart documents
 */
export function listOrgChartDocuments(): OrgChartDocument[] {
	const documents: OrgChartDocument[] = [];

	if (!existsSync(ORG_CHARTS_DIR)) {
		return documents;
	}

	const files = readdirSync(ORG_CHARTS_DIR);
	for (const file of files) {
		if (file.endsWith('.json')) {
			const slug = file.replace('.json', '');
			const doc = loadOrgChartDocument(slug);
			if (doc) {
				documents.push(doc);
			}
		}
	}

	return documents;
}
