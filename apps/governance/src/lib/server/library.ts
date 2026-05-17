import { readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { db } from './db.js';

// --- Types ---

export type DocumentStatus = 'draft' | 'adopted' | 'repealed';

export interface Section {
	title: string;
	body: string;
	rationale?: string;
}

export interface Article {
	number: string; // "I", "II", "III", etc.
	title: string;
	sections: Section[];
}

export interface Document {
	slug: string;
	title: string;
	type: 'governing_document';
	seniority: number; // 1=charter, 2=constitution, 3=bylaw, 4=ordinance, 5=regulation, 6=policy
	owner_uuid: string; // person or association UUID; society-owned documents form the Corpus of Law
	status: DocumentStatus;
	created_at: string;
	adopted_at?: string | null;
	adopted_by_motion_uuid?: string | null;
	repealed_at?: string | null;
	repealed_by_motion_uuid?: string | null;
	articles: Article[];
}

// --- File system helpers ---

const LIBRARY_DIR = join(process.cwd(), 'data', 'library');

/**
 * Get the society association UUID (the top-level association that owns the Corpus of Law)
 */
function getSocietyUuid(): string | null {
	const result = db.prepare("SELECT uuid FROM association WHERE type = 'society' LIMIT 1").get() as { uuid: string } | undefined;
	return result?.uuid ?? null;
}

function loadDocumentFile(slug: string): Document | null {
	try {
		const filePath = join(LIBRARY_DIR, `${slug}.json`);
		const content = readFileSync(filePath, 'utf-8');
		const doc = JSON.parse(content) as Document;
		
		// Handle special owner_uuid value "SOCIETY" by translating to actual society UUID
		if (doc.owner_uuid === 'SOCIETY') {
			const societyUuid = getSocietyUuid();
			if (societyUuid) {
				doc.owner_uuid = societyUuid;
			}
		}
		
		return doc;
	} catch (err) {
		return null;
	}
}

function listDocumentFiles(): Document[] {
	try {
		const files = readdirSync(LIBRARY_DIR);
		const documents: Document[] = [];
		
		for (const file of files) {
			if (file.endsWith('.json')) {
				const slug = file.replace('.json', '');
				const doc = loadDocumentFile(slug);
				if (doc) documents.push(doc);
			}
		}
		
		return documents.sort((a, b) => a.title.localeCompare(b.title));
	} catch (err) {
		return [];
	}
}

// --- Public API ---

export function getDocumentBySlug(slug: string): Document | null {
	return loadDocumentFile(slug);
}

export function listDocuments(opts: {
	status?: DocumentStatus;
	seniority?: number;
	owner_uuid?: string;
} = {}): Document[] {
	let documents = listDocumentFiles();
	
	if (opts.status) {
		documents = documents.filter(doc => doc.status === opts.status);
	}
	
	if (opts.seniority !== undefined) {
		documents = documents.filter(doc => doc.seniority === opts.seniority);
	}
	
	if (opts.owner_uuid !== undefined) {
		documents = documents.filter(doc => doc.owner_uuid === opts.owner_uuid);
	}
	
	return documents.sort((a, b) => a.seniority - b.seniority || a.title.localeCompare(b.title));
}

/**
 * Get all documents owned by the society - these constitute the Corpus of Law
 */
export function getCorpus(): Document[] {
	const societyUuid = getSocietyUuid();
	if (!societyUuid) return [];
	return listDocuments({ owner_uuid: societyUuid });
}

/**
 * Get documents by seniority within the corpus
 */
export function getConstitutionalDocs(): Document[] {
	return getCorpus().filter(doc => doc.seniority <= 2); // charter and constitution
}

export function getBylaws(): Document[] {
	return getCorpus().filter(doc => doc.seniority === 3);
}

export function getOrdinances(): Document[] {
	return getCorpus().filter(doc => doc.seniority === 4);
}

export function getRegulations(): Document[] {
	return getCorpus().filter(doc => doc.seniority === 5);
}

export function getPolicies(): Document[] {
	return getCorpus().filter(doc => doc.seniority === 6);
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
 * Save a document back to its JSON file
 */
function saveDocumentFile(doc: Document): void {
	const filePath = join(LIBRARY_DIR, `${doc.slug}.json`);
	
	// Create a clean copy without the runtime-transformed owner_uuid
	const toSave = { ...doc };
	const societyUuid = getSocietyUuid();
	if (societyUuid && toSave.owner_uuid === societyUuid) {
		toSave.owner_uuid = 'SOCIETY';
	}
	
	writeFileSync(filePath, JSON.stringify(toSave, null, 2), 'utf-8');
}

/**
 * Update a section within a document
 */
export function updateSection(
	slug: string,
	articleIdx: number,
	sectionIdx: number,
	updates: { title?: string; body?: string; rationale?: string }
): Document {
	const doc = getDocumentBySlug(slug);
	if (!doc) throw new Error(`Document not found: ${slug}`);
	if (!doc.articles[articleIdx]) throw new Error(`Article ${articleIdx} not found`);
	if (!doc.articles[articleIdx].sections[sectionIdx]) throw new Error(`Section ${sectionIdx} not found`);
	
	const section = doc.articles[articleIdx].sections[sectionIdx];
	if (updates.title !== undefined) section.title = updates.title;
	if (updates.body !== undefined) section.body = updates.body;
	if (updates.rationale !== undefined) section.rationale = updates.rationale || undefined;
	
	saveDocumentFile(doc);
	return doc;
}

/**
 * Add a new section to an article
 */
export function addSection(
	slug: string,
	articleIdx: number,
	section: Section
): Document {
	const doc = getDocumentBySlug(slug);
	if (!doc) throw new Error(`Document not found: ${slug}`);
	if (!doc.articles[articleIdx]) throw new Error(`Article ${articleIdx} not found`);
	
	doc.articles[articleIdx].sections.push(section);
	saveDocumentFile(doc);
	return doc;
}

/**
 * Delete a section from an article
 */
export function deleteSection(
	slug: string,
	articleIdx: number,
	sectionIdx: number
): Document {
	const doc = getDocumentBySlug(slug);
	if (!doc) throw new Error(`Document not found: ${slug}`);
	if (!doc.articles[articleIdx]) throw new Error(`Article ${articleIdx} not found`);
	if (!doc.articles[articleIdx].sections[sectionIdx]) throw new Error(`Section ${sectionIdx} not found`);
	
	doc.articles[articleIdx].sections.splice(sectionIdx, 1);
	saveDocumentFile(doc);
	return doc;
}

/**
 * Update an article's title
 */
export function updateArticle(
	slug: string,
	articleIdx: number,
	updates: { title?: string; number?: string }
): Document {
	const doc = getDocumentBySlug(slug);
	if (!doc) throw new Error(`Document not found: ${slug}`);
	if (!doc.articles[articleIdx]) throw new Error(`Article ${articleIdx} not found`);
	
	const article = doc.articles[articleIdx];
	if (updates.title !== undefined) article.title = updates.title;
	if (updates.number !== undefined) article.number = updates.number;
	
	saveDocumentFile(doc);
	return doc;
}

/**
 * Add a new article to a document
 */
export function addArticle(
	slug: string,
	article: Article
): Document {
	const doc = getDocumentBySlug(slug);
	if (!doc) throw new Error(`Document not found: ${slug}`);
	
	doc.articles.push(article);
	saveDocumentFile(doc);
	return doc;
}

/**
 * Delete an article from a document
 */
export function deleteArticle(
	slug: string,
	articleIdx: number
): Document {
	const doc = getDocumentBySlug(slug);
	if (!doc) throw new Error(`Document not found: ${slug}`);
	if (!doc.articles[articleIdx]) throw new Error(`Article ${articleIdx} not found`);
	
	doc.articles.splice(articleIdx, 1);
	saveDocumentFile(doc);
	return doc;
}

/**
 * Get a specific section from a document
 */
export function getDocumentSection(
	slug: string, 
	articleNumber: string, 
	sectionIndex: number
): Section | null {
	const doc = getDocumentBySlug(slug);
	if (!doc) return null;
	
	const article = doc.articles.find(a => a.number === articleNumber);
	if (!article) return null;
	
	return article.sections[sectionIndex] ?? null;
}

/**
 * Get full document tree (for compatibility with old API)
 */
export function getDocumentTree(slug: string): Document | null {
	return getDocumentBySlug(slug);
}
