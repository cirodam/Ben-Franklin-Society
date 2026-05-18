import { readFileSync, readdirSync, writeFileSync, mkdirSync, existsSync, unlinkSync } from 'node:fs';
import { join } from 'node:path';
import { randomUUID } from 'node:crypto';
import { db } from '../db.js';
import type {
	LibraryDocument,
	GoverningDocument,
	GoverningDocContent,
	MotionDocument,
	MotionContent,
	MotionStatus,
	ProseDocument,
	ProseDocContent,
	ContractDocument,
	ContractContent,
	OrgChartDocument,
	OrgChartContent,
	Article,
	Section,
	LibraryItemRow
} from './library-types.js';

// Re-export types for backward compatibility
export type { Article, Section } from './library-types.js';
export type { GoverningDocContent as GoverningDocContentType } from './library-types.js';

// Legacy type aliases for backward compatibility
export type DocumentStatus = 'draft' | 'adopted' | 'repealed';
export type Document = LegacyDocument;

// Legacy Document interface - maintains old flat structure for compatibility
interface LegacyDocument {
	slug: string;
	title: string;
	type: 'governing_document';
	seniority: number;
	owner_uuid: string;
	status: DocumentStatus;
	created_at: string;
	adopted_by_motion_uuid?: string | null;
	repealed_at?: string | null;
	repealed_by_motion_uuid?: string | null;
	articles: Article[];
}

// --- Constants ---

const LIBRARY_DIR = join(process.cwd(), 'data', 'library');
const GOVERNING_DIR = join(LIBRARY_DIR, 'governing');
const MOTIONS_DIR = join(LIBRARY_DIR, 'motions');
const PROSE_DIR = join(LIBRARY_DIR, 'prose');
const CONTRACTS_DIR = join(LIBRARY_DIR, 'contracts');
const ORG_CHARTS_DIR = join(LIBRARY_DIR, 'org-charts');

// Ensure directories exist
if (!existsSync(LIBRARY_DIR)) {
	mkdirSync(LIBRARY_DIR, { recursive: true });
}
if (!existsSync(GOVERNING_DIR)) {
	mkdirSync(GOVERNING_DIR, { recursive: true });
}
if (!existsSync(MOTIONS_DIR)) {
	mkdirSync(MOTIONS_DIR, { recursive: true });
}
if (!existsSync(PROSE_DIR)) {
	mkdirSync(PROSE_DIR, { recursive: true });
}
if (!existsSync(CONTRACTS_DIR)) {
	mkdirSync(CONTRACTS_DIR, { recursive: true });
}
if (!existsSync(ORG_CHARTS_DIR)) {
	mkdirSync(ORG_CHARTS_DIR, { recursive: true });
}

// --- Utilities ---

/**
 * Get the society association UUID (the top-level association that owns the Corpus of Law)
 */
export function getSocietyUuid(): string | null {
	const result = db
		.prepare("SELECT uuid FROM association WHERE type = 'society' LIMIT 1")
		.get() as { uuid: string } | undefined;
	return result?.uuid ?? null;
}

/**
 * Convert new GoverningDocument format to legacy flat Document format
 */
function toLegacyDocument(doc: GoverningDocument): LegacyDocument {
	return {
		slug: doc.slug,
		title: doc.title,
		type: 'governing_document',
		seniority: doc.content.seniority,
		owner_uuid: doc.owner_uuid,
		status: doc.content.status,
		created_at: doc.created_at,
		adopted_by_motion_uuid: doc.content.adopted_by_motion_uuid ?? null,
		repealed_at: doc.content.repealed_at ?? null,
		repealed_by_motion_uuid: doc.content.repealed_by_motion_uuid ?? null,
		articles: doc.content.articles
	};
}

/**
 * Convert legacy flat Document format to new GoverningDocument format
 */
function fromLegacyDocument(legacy: LegacyDocument): GoverningDocument {
	return {
		uuid: randomUUID(),
		type: 'governing',
		slug: legacy.slug,
		title: legacy.title,
		owner_uuid: legacy.owner_uuid,
		created_at: legacy.created_at,
		updated_at: legacy.created_at,
		content: {
			status: legacy.status,
			seniority: legacy.seniority,
			articles: legacy.articles,
			adopted_by_motion_uuid: legacy.adopted_by_motion_uuid ?? undefined,
			repealed_at: legacy.repealed_at ?? undefined,
			repealed_by_motion_uuid: legacy.repealed_by_motion_uuid ?? undefined
		}
	};
}

// --- Database Sync ---

/**
 * Sync a library document to the database index
 */
function syncToDatabase(doc: LibraryDocument): void {
	const metadata = extractMetadata(doc);

	const existing = db
		.prepare('SELECT uuid FROM library_item WHERE slug = ?')
		.get(doc.slug) as { uuid: string } | undefined;

	if (existing) {
		// Update existing
		db.prepare(
			`UPDATE library_item 
			 SET type = ?, title = ?, owner_uuid = ?, updated_at = ?, file_path = ?, metadata_json = ?
			 WHERE slug = ?`
		).run(doc.type, doc.title, doc.owner_uuid, doc.updated_at, doc.type + '/' + doc.slug + '.json', metadata, doc.slug);
	} else {
		// Insert new
		db.prepare(
			`INSERT INTO library_item (uuid, type, slug, title, owner_uuid, created_at, updated_at, file_path, metadata_json)
			 VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
		).run(
			doc.uuid,
			doc.type,
			doc.slug,
			doc.title,
			doc.owner_uuid,
			doc.created_at,
			doc.updated_at,
			doc.type + '/' + doc.slug + '.json',
			metadata
		);
	}
}

/**
 * Extract searchable metadata from document content
 */
function extractMetadata(doc: LibraryDocument): string {
	if (doc.type === 'governing') {
		const content = doc.content as GoverningDocContent;
		return JSON.stringify({
			status: content.status,
			seniority: content.seniority,
			repealed_at: content.repealed_at
		});
	}
	
	if (doc.type === 'motion') {
		const content = doc.content as MotionContent;
		return JSON.stringify({
			status: content.status,
			motion_number: content.motion_number,
			introduced_at: content.introduced_at,
			enacted_at: content.enacted_at
		});
	}
	
	if (doc.type === 'prose') {
		const content = doc.content as ProseDocContent;
		return JSON.stringify({
			status: content.status,
			paragraph_count: content.paragraphs.length,
			tags: content.tags || [],
			published_at: content.published_at
		});
	}
	
	if (doc.type === 'contract') {
		const content = doc.content as ContractContent;
		return JSON.stringify({
			status: content.status,
			party_a_name: content.party_a.principal_name,
			party_b_name: content.party_b.principal_name,
			effective_date: content.effective_date,
			acknowledged_at: content.acknowledged_at
		});
	}
	
	if (doc.type === 'org_chart') {
		const content = doc.content as OrgChartContent;
		return JSON.stringify({
			status: content.status,
			version: content.version,
			role_count: content.roles.length,
			section_count: content.sections.length,
			template_count: content.templates.length,
			published_at: content.published_at
		});
	}
	
	// Default for unknown types
	return JSON.stringify({});
}

// --- File I/O ---

/**
 * Load a governing document from file
 * Supports both legacy flat format and new wrapped format
 */
export function loadGoverningDocument(slug: string): GoverningDocument | null {
	try {
		// Try new location first
		let filePath = join(GOVERNING_DIR, `${slug}.json`);
		if (!existsSync(filePath)) {
			// Fall back to old location
			filePath = join(LIBRARY_DIR, `${slug}.json`);
			if (!existsSync(filePath)) {
				return null;
			}
		}

		const content = readFileSync(filePath, 'utf-8');
		const parsed = JSON.parse(content);

		// Check if it's the new format (has uuid and type fields)
		if (parsed.uuid && parsed.type === 'governing') {
			const doc = parsed as GoverningDocument;
			
			// Handle special owner_uuid value "SOCIETY"
			if (doc.owner_uuid === 'SOCIETY') {
				const societyUuid = getSocietyUuid();
				if (societyUuid) {
					doc.owner_uuid = societyUuid;
				}
			}
			
			return doc;
		}

		// Legacy format - convert it
		const legacy = parsed as LegacyDocument;
		const doc = fromLegacyDocument(legacy);
		
		// Handle special owner_uuid value "SOCIETY"
		if (doc.owner_uuid === 'SOCIETY') {
			const societyUuid = getSocietyUuid();
			if (societyUuid) {
				doc.owner_uuid = societyUuid;
			}
		}

		return doc;
	} catch (err) {
		console.error(`Error loading document ${slug}:`, err);
		return null;
	}
}

/**
 * Save a governing document to file and sync to database
 */
function saveGoverningDocument(doc: GoverningDocument): void {
	const filePath = join(GOVERNING_DIR, `${doc.slug}.json`);

	// Create a clean copy for saving
	const toSave = { ...doc };
	const societyUuid = getSocietyUuid();
	if (societyUuid && toSave.owner_uuid === societyUuid) {
		toSave.owner_uuid = 'SOCIETY';
	}

	// Update timestamp
	toSave.updated_at = new Date().toISOString();

	// Write to file
	writeFileSync(filePath, JSON.stringify(toSave, null, 2), 'utf-8');

	// Sync to database
	syncToDatabase(toSave);
}

/**
 * List all governing document files
 */
function listGoverningDocumentFiles(): GoverningDocument[] {
	const documents: GoverningDocument[] = [];

	// Check both old and new locations
	const locations = [LIBRARY_DIR, GOVERNING_DIR];

	const seen = new Set<string>();

	for (const dir of locations) {
		if (!existsSync(dir)) continue;

		try {
			const files = readdirSync(dir);
			for (const file of files) {
				if (file.endsWith('.json') && !seen.has(file)) {
					seen.add(file);
					const slug = file.replace('.json', '');
					const doc = loadGoverningDocument(slug);
					if (doc) {
						documents.push(doc);
					}
				}
			}
		} catch (err) {
			console.error(`Error reading directory ${dir}:`, err);
		}
	}

	return documents;
}

// --- Public API (Legacy Compatibility) ---

/**
 * Get a document by slug (legacy API)
 */
/**
 * Get a document by slug (legacy API)
 */
export function getDocumentBySlug(slug: string): LegacyDocument | null {
	const doc = loadGoverningDocument(slug);
	return doc ? toLegacyDocument(doc) : null;
}

export function listDocuments(opts: {
	status?: DocumentStatus;
	seniority?: number;
	owner_uuid?: string;
} = {}): LegacyDocument[] {
	let documents = listGoverningDocumentFiles();

	// Apply filters
	if (opts.status) {
		documents = documents.filter((doc) => doc.content.status === opts.status);
	}

	if (opts.seniority !== undefined) {
		documents = documents.filter((doc) => doc.content.seniority === opts.seniority);
	}

	if (opts.owner_uuid !== undefined) {
		documents = documents.filter((doc) => doc.owner_uuid === opts.owner_uuid);
	}

	// Convert to legacy format and sort
	const legacyDocs = documents.map(toLegacyDocument);
	return legacyDocs.sort(
		(a, b) => a.seniority - b.seniority || a.title.localeCompare(b.title)
	);
}

/**
 * Get all documents owned by the society - these constitute the Corpus of Law
 */
export function getCorpus(): LegacyDocument[] {
	const societyUuid = getSocietyUuid();
	if (!societyUuid) return [];
	return listDocuments({ owner_uuid: societyUuid });
}

/**
 * Get documents by seniority within the corpus
 */
export function getConstitutionalDocs(): LegacyDocument[] {
	return getCorpus().filter((doc) => doc.seniority <= 2); // charter and constitution
}

export function getBylaws(): LegacyDocument[] {
	return getCorpus().filter((doc) => doc.seniority === 3);
}

export function getOrdinances(): LegacyDocument[] {
	return getCorpus().filter((doc) => doc.seniority === 4);
}

export function getRegulations(): LegacyDocument[] {
	return getCorpus().filter((doc) => doc.seniority === 5);
}

export function getPolicies(): LegacyDocument[] {
	return getCorpus().filter((doc) => doc.seniority === 6);
}

/**
 * Get the display name for a seniority level
 */
export function getSeniorityName(seniority: number): string {
	const names: Record<number, string> = {
		1: 'Charter',
		2: 'Constitution',
		3: 'Bylaw',
		4: 'Ordinance',
		5: 'Regulation',
		6: 'Policy'
	};
	return names[seniority] ?? 'Document';
}

// --- Write Operations ---

/**
 * Update a section within a document
 */
export function updateSection(
	slug: string,
	articleIdx: number,
	sectionIdx: number,
	updates: { title?: string; body?: string; rationale?: string }
): LegacyDocument {
	const doc = loadGoverningDocument(slug);
	if (!doc) throw new Error(`Document not found: ${slug}`);
	if (!doc.content.articles[articleIdx])
		throw new Error(`Article ${articleIdx} not found`);
	if (!doc.content.articles[articleIdx].sections[sectionIdx])
		throw new Error(`Section ${sectionIdx} not found`);

	const section = doc.content.articles[articleIdx].sections[sectionIdx];
	if (updates.title !== undefined) section.title = updates.title;
	if (updates.body !== undefined) section.body = updates.body;
	if (updates.rationale !== undefined) section.rationale = updates.rationale || undefined;

	saveGoverningDocument(doc);
	return toLegacyDocument(doc);
}

/**
 * Add a new section to an article
 */
export function addSection(slug: string, articleIdx: number, section: Section): LegacyDocument {
	const doc = loadGoverningDocument(slug);
	if (!doc) throw new Error(`Document not found: ${slug}`);
	if (!doc.content.articles[articleIdx])
		throw new Error(`Article ${articleIdx} not found`);

	doc.content.articles[articleIdx].sections.push(section);
	saveGoverningDocument(doc);
	return toLegacyDocument(doc);
}

/**
 * Delete a section from an article
 */
export function deleteSection(
	slug: string,
	articleIdx: number,
	sectionIdx: number
): LegacyDocument {
	const doc = loadGoverningDocument(slug);
	if (!doc) throw new Error(`Document not found: ${slug}`);
	if (!doc.content.articles[articleIdx])
		throw new Error(`Article ${articleIdx} not found`);
	if (!doc.content.articles[articleIdx].sections[sectionIdx])
		throw new Error(`Section ${sectionIdx} not found`);

	doc.content.articles[articleIdx].sections.splice(sectionIdx, 1);
	saveGoverningDocument(doc);
	return toLegacyDocument(doc);
}

/**
 * Update an article's title
 */
export function updateArticle(
	slug: string,
	articleIdx: number,
	updates: { title?: string; number?: string }
): LegacyDocument {
	const doc = loadGoverningDocument(slug);
	if (!doc) throw new Error(`Document not found: ${slug}`);
	if (!doc.content.articles[articleIdx])
		throw new Error(`Article ${articleIdx} not found`);

	const article = doc.content.articles[articleIdx];
	if (updates.title !== undefined) article.title = updates.title;
	if (updates.number !== undefined) article.number = updates.number;

	saveGoverningDocument(doc);
	return toLegacyDocument(doc);
}

/**
 * Add a new article to a document
 */
export function addArticle(slug: string, article: Article): LegacyDocument {
	const doc = loadGoverningDocument(slug);
	if (!doc) throw new Error(`Document not found: ${slug}`);

	doc.content.articles.push(article);
	saveGoverningDocument(doc);
	return toLegacyDocument(doc);
}

/**
 * Delete an article from a document
 */
export function deleteArticle(slug: string, articleIdx: number): LegacyDocument {
	const doc = loadGoverningDocument(slug);
	if (!doc) throw new Error(`Document not found: ${slug}`);
	if (!doc.content.articles[articleIdx])
		throw new Error(`Article ${articleIdx} not found`);

	doc.content.articles.splice(articleIdx, 1);
	saveGoverningDocument(doc);
	return toLegacyDocument(doc);
}

/**
 * Get a specific section from a document
 */
export function getDocumentSection(
	slug: string,
	articleNumber: string,
	sectionIndex: number
): Section | null {
	const doc = loadGoverningDocument(slug);
	if (!doc) return null;

	const article = doc.content.articles.find((a) => a.number === articleNumber);
	if (!article) return null;

	return article.sections[sectionIndex] ?? null;
}

/**
 * Get full document tree (for compatibility with old API)
 */
export function getDocumentTree(slug: string): LegacyDocument | null {
	return getDocumentBySlug(slug);
}

// ============================================================================
// Generalized Library Functions (Cross-Type)
// ============================================================================

export interface LibrarySearchOptions {
	type?: string | string[]; // 'governing', 'motion', etc. or array of types
	status?: string;
	owner_uuid?: string | string[]; // Single UUID or array of UUIDs
	query?: string; // Search in title/slug
	limit?: number;
	offset?: number;
}

export interface LibraryItemSummary {
	uuid: string;
	type: string;
	slug: string;
	title: string;
	owner_uuid: string;
	created_at: string;
	updated_at: string;
	metadata: any; // Parsed metadata_json
}

/**
 * Search library items across all types using the database index
 */
export function searchLibrary(options: LibrarySearchOptions = {}): LibraryItemSummary[] {
	let query = 'SELECT * FROM library_item WHERE 1=1';
	const params: any[] = [];

	// Filter by type(s)
	if (options.type) {
		if (Array.isArray(options.type)) {
			const placeholders = options.type.map(() => '?').join(', ');
			query += ` AND type IN (${placeholders})`;
			params.push(...options.type);
		} else {
			query += ' AND type = ?';
			params.push(options.type);
		}
	}

	// Filter by owner (supports single UUID or array)
	if (options.owner_uuid) {
		if (Array.isArray(options.owner_uuid)) {
			const placeholders = options.owner_uuid.map(() => '?').join(', ');
			query += ` AND owner_uuid IN (${placeholders})`;
			params.push(...options.owner_uuid);
		} else {
			query += ' AND owner_uuid = ?';
			params.push(options.owner_uuid);
		}
	}

	// Search in title/slug
	if (options.query) {
		query += ' AND (title LIKE ? OR slug LIKE ?)';
		const searchTerm = `%${options.query}%`;
		params.push(searchTerm, searchTerm);
	}

	// Order by updated_at descending (most recent first)
	query += ' ORDER BY updated_at DESC';

	// Pagination
	if (options.limit) {
		query += ' LIMIT ?';
		params.push(options.limit);
		if (options.offset) {
			query += ' OFFSET ?';
			params.push(options.offset);
		}
	}

	const rows = db.prepare(query).all(...params) as Array<{
		uuid: string;
		type: string;
		slug: string;
		title: string;
		owner_uuid: string;
		created_at: string;
		updated_at: string;
		file_path: string;
		metadata_json: string | null;
	}>;

	return rows.map(row => ({
		uuid: row.uuid,
		type: row.type,
		slug: row.slug,
		title: row.title,
		owner_uuid: row.owner_uuid,
		created_at: row.created_at,
		updated_at: row.updated_at,
		metadata: row.metadata_json ? JSON.parse(row.metadata_json) : {},
	}));
}

/**
 * Get library statistics by type
 */
export function getLibraryStats(): Record<string, { total: number; by_status?: Record<string, number> }> {
	const items = db.prepare('SELECT type, metadata_json FROM library_item').all() as Array<{
		type: string;
		metadata_json: string | null;
	}>;

	const stats: Record<string, { total: number; by_status?: Record<string, number> }> = {};

	for (const item of items) {
		if (!stats[item.type]) {
			stats[item.type] = { total: 0, by_status: {} };
		}
		stats[item.type].total++;

		if (item.metadata_json) {
			try {
				const metadata = JSON.parse(item.metadata_json);
				if (metadata.status) {
					if (!stats[item.type].by_status) {
						stats[item.type].by_status = {};
					}
					stats[item.type].by_status![metadata.status] = (stats[item.type].by_status![metadata.status] || 0) + 1;
				}
			} catch (err) {
				// Ignore parse errors
			}
		}
	}

	return stats;
}

/**
 * Load full document by UUID (any type)
 */
export function getDocumentByUuid(uuid: string): LibraryDocument | LegacyMotion | LegacyDocument | null {
	const row = db.prepare(
		'SELECT type, slug FROM library_item WHERE uuid = ?'
	).get(uuid) as { type: string; slug: string } | undefined;

	if (!row) return null;

	// Load document based on type
	switch (row.type) {
		case 'governing':
			return loadGoverningDocument(row.slug);
		case 'motion':
			return loadMotion(row.slug);
		case 'prose':
			return loadProseDocument(row.slug);
		case 'contract':
			return loadContract(row.slug);
		default:
			console.warn(`Unknown document type: ${row.type}`);
			return null;
	}
}

// ============================================================================
// Motion Functions
// ============================================================================

/**
 * Load a motion from file
 */
export function loadMotion(slug: string): MotionDocument | null {
	try {
		const filePath = join(MOTIONS_DIR, `${slug}.json`);
		if (!existsSync(filePath)) {
			return null;
		}

		const content = readFileSync(filePath, 'utf-8');
		const doc = JSON.parse(content) as MotionDocument;
		return doc;
	} catch (err) {
		console.error(`Error loading motion ${slug}:`, err);
		return null;
	}
}

/**
 * Save a motion to file and sync to database
 */
function saveMotion(doc: MotionDocument): void {
	const filePath = join(MOTIONS_DIR, `${doc.slug}.json`);
	doc.updated_at = new Date().toISOString();
	
	writeFileSync(filePath, JSON.stringify(doc, null, 2), 'utf-8');
	syncToDatabase(doc);
}

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
 * Save an org chart document to file and sync to database
 */
export function saveOrgChartDocument(doc: OrgChartDocument): void {
	const filePath = join(ORG_CHARTS_DIR, `${doc.slug}.json`);
	doc.updated_at = new Date().toISOString();
	
	writeFileSync(filePath, JSON.stringify(doc, null, 2), 'utf-8');
	syncToDatabase(doc);
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

/**
 * Delete a document by UUID
 */
export function deleteDocument(uuid: string): boolean {
	try {
		// Get document info from database
		const row = db.prepare('SELECT type, slug FROM library_item WHERE uuid = ?').get(uuid) as { type: string; slug: string } | undefined;
		
		if (!row) return false;
		
		// Get directory based on type
		let directory: string;
		switch (row.type) {
			case 'governing':
				directory = 'governing';
				break;
			case 'motion':
				directory = 'motions';
				break;
			case 'prose':
				directory = 'prose';
				break;
			case 'contract':
				directory = 'contracts';
				break;
			case 'org_chart':
				directory = 'org-charts';
				break;
			default:
				return false;
		}
		
		// Delete file
		const filePath = join(LIBRARY_DIR, directory, `${row.slug}.json`);
		if (existsSync(filePath)) {
			unlinkSync(filePath);
		}
		
		// Delete from database
		db.prepare('DELETE FROM library_item WHERE uuid = ?').run(uuid);
		
		return true;
	} catch (err) {
		console.error(`Error deleting document ${uuid}:`, err);
		return false;
	}
}

/**
 * Get motion by slug
 */
export function getMotionBySlug(slug: string): MotionDocument | null {
	return loadMotion(slug);
}

/**
 * Get motion by UUID
 */
export function getMotionByUuid(uuid: string): MotionDocument | null {
	// Query library_item to find slug
	const row = db.prepare(
		'SELECT slug FROM library_item WHERE uuid = ? AND type = ?'
	).get(uuid, 'motion') as { slug: string } | undefined;
	
	if (!row) return null;
	return loadMotion(row.slug);
}

/**
 * List all motions
 */
export function listMotions(opts: {
	status?: string;
	owner_uuid?: string;
} = {}): MotionDocument[] {
	const motions: MotionDocument[] = [];

	if (!existsSync(MOTIONS_DIR)) return motions;

	try {
		const files = readdirSync(MOTIONS_DIR);
		for (const file of files) {
			if (file.endsWith('.json')) {
				const slug = file.replace('.json', '');
				const motion = loadMotion(slug);
				if (motion) {
					// Apply filters
					if (opts.status && motion.content.status !== opts.status) continue;
					if (opts.owner_uuid && motion.owner_uuid !== opts.owner_uuid) continue;
					motions.push(motion);
				}
			}
		}
	} catch (err) {
		console.error(`Error listing motions:`, err);
	}

	return motions;
}

/**
 * Create a new motion
 */
export function createMotion(input: {
	slug: string;
	title: string;
	body: string;
	introducer_uuid: string;
	owner_uuid: string;
	motion_number: string;
	deliberation_rule_uuid?: string;
	vote_rule_uuid?: string;
	reasoning?: string;
	thread_uuid?: string;
}): MotionDocument {
	const uuid = randomUUID();
	const now = new Date().toISOString();

	const doc: MotionDocument = {
		uuid,
		type: 'motion',
		slug: input.slug,
		title: input.title,
		owner_uuid: input.owner_uuid,
		created_at: now,
		updated_at: now,
		content: {
			status: 'draft',
			body: input.body,
			introducer_uuid: input.introducer_uuid,
			motion_number: input.motion_number,
			deliberation_rule_uuid: input.deliberation_rule_uuid,
			vote_rule_uuid: input.vote_rule_uuid,
			reasoning: input.reasoning,
			body_uuid: input.owner_uuid,
			thread_uuid: input.thread_uuid,
		}
	};

	saveMotion(doc);
	return doc;
}

/**
 * Update motion content
 */
export function updateMotion(slug: string, updates: Partial<MotionContent>): MotionDocument {
	const doc = loadMotion(slug);
	if (!doc) throw new Error(`Motion not found: ${slug}`);

	// Merge updates into content
	Object.assign(doc.content, updates);

	saveMotion(doc);
	return doc;
}

/**
 * Update motion status and related timestamps
 */
export function updateMotionStatus(
	slug: string,
	status: string,
	metadata?: {
		introduced_at?: string;
		vote_opened_at?: string;
		vote_closed_at?: string;
		enacted_at?: string;
	}
): MotionDocument {
	const doc = loadMotion(slug);
	if (!doc) throw new Error(`Motion not found: ${slug}`);

	doc.content.status = status as any;
	if (metadata) {
		Object.assign(doc.content, metadata);
	}

	saveMotion(doc);
	return doc;
}
