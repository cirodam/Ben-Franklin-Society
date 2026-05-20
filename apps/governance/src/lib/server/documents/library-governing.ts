/**
 * Library Governing Documents - Operations for governing documents
 */
import { readFileSync, readdirSync, writeFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { randomUUID } from 'node:crypto';
import type { GoverningDocument, Article, Section } from './library-types.js';
import { LIBRARY_DIR, getSocietyUuid, syncToDatabase } from './library-core.js';

// --- File I/O ---

/**
 * Load a governing document from file
 */
export function loadGoverningDocument(slug: string): GoverningDocument | null {
	try {
		const filePath = join(LIBRARY_DIR, `${slug}.json`);
		if (!existsSync(filePath)) {
			return null;
		}

		const content = readFileSync(filePath, 'utf-8');
		const doc = JSON.parse(content) as GoverningDocument;

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
export function saveGoverningDocument(doc: GoverningDocument): void {
	const filePath = join(LIBRARY_DIR, `${doc.slug}.json`);

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

// --- Public API ---

/**
 * Get a document by slug
 */
export function getDocumentBySlug(slug: string): GoverningDocument | null {
	return loadGoverningDocument(slug);
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
): GoverningDocument {
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
	return doc;
}

/**
 * Add a new section to an article
 */
export function addSection(slug: string, articleIdx: number, section: Section): GoverningDocument {
	const doc = loadGoverningDocument(slug);
	if (!doc) throw new Error(`Document not found: ${slug}`);
	if (!doc.content.articles[articleIdx])
		throw new Error(`Article ${articleIdx} not found`);

	doc.content.articles[articleIdx].sections.push(section);
	saveGoverningDocument(doc);
	return doc;
}

/**
 * Delete a section from an article
 */
export function deleteSection(
	slug: string,
	articleIdx: number,
	sectionIdx: number
): GoverningDocument {
	const doc = loadGoverningDocument(slug);
	if (!doc) throw new Error(`Document not found: ${slug}`);
	if (!doc.content.articles[articleIdx])
		throw new Error(`Article ${articleIdx} not found`);
	if (!doc.content.articles[articleIdx].sections[sectionIdx])
		throw new Error(`Section ${sectionIdx} not found`);

	doc.content.articles[articleIdx].sections.splice(sectionIdx, 1);
	saveGoverningDocument(doc);
	return doc;
}

/**
 * Update an article's title
 */
export function updateArticle(
	slug: string,
	articleIdx: number,
	updates: { title?: string; number?: string }
): GoverningDocument {
	const doc = loadGoverningDocument(slug);
	if (!doc) throw new Error(`Document not found: ${slug}`);
	if (!doc.content.articles[articleIdx])
		throw new Error(`Article ${articleIdx} not found`);

	const article = doc.content.articles[articleIdx];
	if (updates.title !== undefined) article.title = updates.title;
	if (updates.number !== undefined) article.number = updates.number;

	saveGoverningDocument(doc);
	return doc;
}

/**
 * Add a new article to a document
 */
export function addArticle(slug: string, article: Article): GoverningDocument {
	const doc = loadGoverningDocument(slug);
	if (!doc) throw new Error(`Document not found: ${slug}`);

	doc.content.articles.push(article);
	saveGoverningDocument(doc);
	return doc;
}

/**
 * Delete an article from a document
 */
export function deleteArticle(slug: string, articleIdx: number): GoverningDocument {
	const doc = loadGoverningDocument(slug);
	if (!doc) throw new Error(`Document not found: ${slug}`);
	if (!doc.content.articles[articleIdx])
		throw new Error(`Article ${articleIdx} not found`);

	doc.content.articles.splice(articleIdx, 1);
	saveGoverningDocument(doc);
	return doc;
}
