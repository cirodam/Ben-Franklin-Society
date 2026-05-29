/**
 * Library Governing Documents - Operations for governing documents
 */
import { readFileSync, readdirSync, writeFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { randomUUID } from 'node:crypto';
import type { GoverningDocument, Article, Section } from '@bfs/types';
import { 
	SOCIETY_CODE_FOLDERS, 
	getSocietyUuid, 
	getGoverningFolder,
	getGoverningStatusFromPath,
	moveGoverningDocument
} from './society-core.js';

// --- File I/O ---

/**
 * Load a governing document from file (searches all status folders if status not specified)
 */
export function loadGoverningDocument(slug: string, status?: keyof typeof SOCIETY_CODE_FOLDERS): GoverningDocument | null {
	try {
		// If status is specified, look in that folder only
		if (status) {
			const filePath = join(SOCIETY_CODE_FOLDERS[status], `${slug}.json`);
			if (!existsSync(filePath)) {
				return null;
			}
			return readAndParseGoverningDoc(filePath);
		}

		// Otherwise search all status folders
		for (const folder of Object.values(SOCIETY_CODE_FOLDERS)) {
			const filePath = join(folder, `${slug}.json`);
			if (existsSync(filePath)) {
				return readAndParseGoverningDoc(filePath);
			}
		}

		return null;
	} catch (err) {
		console.error(`Error loading document ${slug}:`, err);
		return null;
	}
}

/**
 * Read and parse a governing document file
 */
function readAndParseGoverningDoc(filePath: string): GoverningDocument {
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
}

/**
 * Save a governing document to file in the appropriate status folder
 */
export function saveGoverningDocument(doc: GoverningDocument, status: keyof typeof SOCIETY_CODE_FOLDERS = 'inbox'): void {
	const folder = SOCIETY_CODE_FOLDERS[status];
	const filePath = join(folder, `${doc.slug}.json`);

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
}

/**
 * Get all governing documents in a specific status folder
 */
export function getAllGoverningDocs(status?: keyof typeof SOCIETY_CODE_FOLDERS): GoverningDocument[] {
	const docs: GoverningDocument[] = [];

	// If status specified, only search that folder
	const foldersToSearch = status 
		? [SOCIETY_CODE_FOLDERS[status]]
		: Object.values(SOCIETY_CODE_FOLDERS);

	for (const folder of foldersToSearch) {
		if (!existsSync(folder)) continue;

		const files = readdirSync(folder).filter(f => f.endsWith('.json'));
		for (const file of files) {
			const filePath = join(folder, file);
			try {
				const doc = readAndParseGoverningDoc(filePath);
				docs.push(doc);
			} catch (err) {
				console.error(`Error reading ${filePath}:`, err);
			}
		}
	}

	return docs;
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
 * Update a section within a document (must be in inbox to edit)
 */
export function updateSection(
	slug: string,
	articleIdx: number,
	sectionIdx: number,
	updates: { title?: string; body?: string; rationale?: string }
): GoverningDocument {
	const doc = loadGoverningDocument(slug, 'inbox');
	if (!doc) throw new Error(`Document not found in inbox: ${slug}`);
	if (!doc.content.articles[articleIdx])
		throw new Error(`Article ${articleIdx} not found`);
	if (!doc.content.articles[articleIdx].sections[sectionIdx])
		throw new Error(`Section ${sectionIdx} not found`);

	const section = doc.content.articles[articleIdx].sections[sectionIdx];
	if (updates.title !== undefined) section.title = updates.title;
	if (updates.body !== undefined) section.body = updates.body;
	if (updates.rationale !== undefined) section.rationale = updates.rationale || undefined;

	saveGoverningDocument(doc, 'inbox');
	return doc;
}

/**
 * Add a new section to an article (must be in inbox to edit)
 */
export function addSection(slug: string, articleIdx: number, section: Section): GoverningDocument {
	const doc = loadGoverningDocument(slug, 'inbox');
	if (!doc) throw new Error(`Document not found in inbox: ${slug}`);
	if (!doc.content.articles[articleIdx])
		throw new Error(`Article ${articleIdx} not found`);

	doc.content.articles[articleIdx].sections.push(section);
	saveGoverningDocument(doc, 'inbox');
	return doc;
}

/**
 * Delete a section from an article (must be in inbox to edit)
 */
export function deleteSection(
	slug: string,
	articleIdx: number,
	sectionIdx: number
): GoverningDocument {
	const doc = loadGoverningDocument(slug, 'inbox');
	if (!doc) throw new Error(`Document not found in inbox: ${slug}`);
	if (!doc.content.articles[articleIdx])
		throw new Error(`Article ${articleIdx} not found`);
	if (!doc.content.articles[articleIdx].sections[sectionIdx])
		throw new Error(`Section ${sectionIdx} not found`);

	doc.content.articles[articleIdx].sections.splice(sectionIdx, 1);
	saveGoverningDocument(doc, 'inbox');
	return doc;
}

/**
 * Update an article's title (must be in inbox to edit)
 */
export function updateArticle(
	slug: string,
	articleIdx: number,
	updates: { title?: string; number?: string }
): GoverningDocument {
	const doc = loadGoverningDocument(slug, 'inbox');
	if (!doc) throw new Error(`Document not found in inbox: ${slug}`);
	if (!doc.content.articles[articleIdx])
		throw new Error(`Article ${articleIdx} not found`);

	const article = doc.content.articles[articleIdx];
	if (updates.title !== undefined) article.title = updates.title;
	if (updates.number !== undefined) article.number = updates.number;

	saveGoverningDocument(doc, 'inbox');
	return doc;
}

/**
 * Add a new article to a document (must be in inbox to edit)
 */
export function addArticle(slug: string, article: Article): GoverningDocument {
	const doc = loadGoverningDocument(slug, 'inbox');
	if (!doc) throw new Error(`Document not found in inbox: ${slug}`);

	doc.content.articles.push(article);
	saveGoverningDocument(doc, 'inbox');
	return doc;
}

/**
 * Delete an article from a document (must be in inbox to edit)
 */
export function deleteArticle(slug: string, articleIdx: number): GoverningDocument {
	const doc = loadGoverningDocument(slug, 'inbox');
	if (!doc) throw new Error(`Document not found in inbox: ${slug}`);
	if (!doc.content.articles[articleIdx])
		throw new Error(`Article ${articleIdx} not found`);

	doc.content.articles.splice(articleIdx, 1);
	saveGoverningDocument(doc, 'inbox');
	return doc;
}
