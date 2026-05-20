/**
 * Library Governing Documents - Operations for governing documents
 */
import { readFileSync, readdirSync, writeFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { randomUUID } from 'node:crypto';
import type { GoverningDocument, Article, Section } from './library-types.js';
import { LIBRARY_DIR, GOVERNING_DIR, getSocietyUuid, syncToDatabase } from './library-core.js';

// Legacy type aliases for backward compatibility
export type DocumentStatus = 'draft' | 'adopted' | 'repealed';
export type Document = LegacyDocument;

// Legacy Document interface - maintains old flat structure for compatibility
export interface LegacyDocument {
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

// --- Format Converters ---

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
		document_id: null,
		version: 1,
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

// --- Public API (Legacy Compatibility) ---

/**
 * Get a document by slug (legacy API)
 */
export function getDocumentBySlug(slug: string): LegacyDocument | null {
	const doc = loadGoverningDocument(slug);
	return doc ? toLegacyDocument(doc) : null;
}

// --- Edit Operations ---

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
