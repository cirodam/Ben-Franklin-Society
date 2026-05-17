import { readFileSync, readdirSync, writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { randomUUID } from 'node:crypto';
import { db } from './db.js';
import type {
	LibraryDocument,
	GoverningDocument,
	GoverningDocContent,
	MotionDocument,
	MotionContent,
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
	adopted_at?: string | null;
	adopted_by_motion_uuid?: string | null;
	repealed_at?: string | null;
	repealed_by_motion_uuid?: string | null;
	articles: Article[];
}

// --- Constants ---

const LIBRARY_DIR = join(process.cwd(), 'data', 'library');
const GOVERNING_DIR = join(LIBRARY_DIR, 'governing');
const MOTIONS_DIR = join(LIBRARY_DIR, 'motions');

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

// --- Utilities ---

/**
 * Get the society association UUID (the top-level association that owns the Corpus of Law)
 */
function getSocietyUuid(): string | null {
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
		adopted_at: doc.content.adopted_at ?? null,
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
			adopted_at: legacy.adopted_at ?? undefined,
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
			adopted_at: content.adopted_at,
			repealed_at: content.repealed_at
		});
	}
	// Add other types as needed
	return JSON.stringify({});
}

// --- File I/O ---

/**
 * Load a governing document from file
 * Supports both legacy flat format and new wrapped format
 */
function loadGoverningDocument(slug: string): GoverningDocument | null {
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
	owner_uuid?: string;
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

	// Filter by owner
	if (options.owner_uuid) {
		query += ' AND owner_uuid = ?';
		params.push(options.owner_uuid);
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

	switch (row.type) {
		case 'governing':
			return getDocumentBySlug(row.slug);
		case 'motion':
			return getMotionBySlug(row.slug);
		default:
			return null;
	}
}

// ============================================================================
// Motion Functions
// ============================================================================

// Legacy Motion interface for backward compatibility
export interface LegacyMotion {
	uuid: string;
	slug: string;
	motion_number: number;
	title: string;
	type: string;
	seniority: number | null;
	owner_uuid: string;
	body: string;
	reasoning: string | null;
	introduced_by_uuid: string;
	body_uuid: string;
	deliberation_rule_uuid: string | null;
	vote_rule_uuid: string | null;
	status: string;
	clerk_notes: string | null;
	parliamentarian_notes: string | null;
	created_at: string;
	adopted_at: string | null;
	adopted_by_motion_uuid: string | null;
	repealed_at: string | null;
	repealed_by_motion_uuid: string | null;
	deliberation_opened_at: string | null;
	enacted_at: string | null;
	resolved_at: string | null;
}

/**
 * Convert new format to legacy format
 */
function motionToLegacy(doc: MotionDocument): LegacyMotion {
	// Extract motion number (strip M- prefix and parse)
	const motionNumberStr = doc.content.motion_number || '0';
	const motion_number = parseInt(motionNumberStr.split('-').pop() || '0', 10);

	return {
		uuid: doc.uuid,
		slug: doc.slug,
		motion_number,
		title: doc.title,
		type: 'motion',
		seniority: null,
		owner_uuid: doc.owner_uuid,
		body: doc.content.body,
		reasoning: doc.content.reasoning ?? null,
		introduced_by_uuid: doc.content.introducer_uuid,
		body_uuid: doc.content.body_uuid || doc.owner_uuid,
		deliberation_rule_uuid: doc.content.deliberation_rule_uuid ?? null,
		vote_rule_uuid: doc.content.vote_rule_uuid ?? null,
		status: doc.content.status,
		clerk_notes: doc.content.clerk_notes ?? null,
		parliamentarian_notes: doc.content.parliamentarian_notes ?? null,
		created_at: doc.created_at,
		adopted_at: doc.content.adopted_at ?? null,
		adopted_by_motion_uuid: doc.content.adopted_by_motion_uuid ?? null,
		repealed_at: doc.content.repealed_at ?? null,
		repealed_by_motion_uuid: doc.content.repealed_by_motion_uuid ?? null,
		deliberation_opened_at: doc.content.introduced_at ?? null,
		enacted_at: doc.content.enacted_at ?? null,
		resolved_at: doc.content.vote_closed_at ?? null,
	};
}

/**
 * Load a motion from file
 */
function loadMotion(slug: string): MotionDocument | null {
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
 * Get motion by slug
 */
export function getMotionBySlug(slug: string): LegacyMotion | null {
	const doc = loadMotion(slug);
	return doc ? motionToLegacy(doc) : null;
}

/**
 * Get motion by UUID
 */
export function getMotionByUuid(uuid: string): LegacyMotion | null {
	// Query library_item to find slug
	const row = db.prepare(
		'SELECT slug FROM library_item WHERE uuid = ? AND type = ?'
	).get(uuid, 'motion') as { slug: string } | undefined;
	
	if (!row) return null;
	const doc = loadMotion(row.slug);
	return doc ? motionToLegacy(doc) : null;
}

/**
 * List all motions
 */
export function listMotions(opts: {
	status?: string;
	owner_uuid?: string;
} = {}): LegacyMotion[] {
	const motions: LegacyMotion[] = [];

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
					motions.push(motionToLegacy(motion));
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
}): LegacyMotion {
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
		}
	};

	saveMotion(doc);
	return motionToLegacy(doc);
}

/**
 * Update motion content
 */
export function updateMotion(slug: string, updates: Partial<MotionContent>): LegacyMotion {
	const doc = loadMotion(slug);
	if (!doc) throw new Error(`Motion not found: ${slug}`);

	// Merge updates into content
	Object.assign(doc.content, updates);

	saveMotion(doc);
	return motionToLegacy(doc);
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
): LegacyMotion {
	const doc = loadMotion(slug);
	if (!doc) throw new Error(`Motion not found: ${slug}`);

	doc.content.status = status as any;
	if (metadata) {
		Object.assign(doc.content, metadata);
	}

	saveMotion(doc);
	return motionToLegacy(doc);
}
