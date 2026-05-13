import { db } from './db.js';
import { randomUUID } from 'node:crypto';

// --- Types ---

export type DocumentStatus = 'draft' | 'proposed' | 'adopted' | 'repealed';
export type DocumentType = 'regulation' | 'prose' | 'budget';

export interface Document {
	uuid: string;
	title: string;
	slug: string;
	type: DocumentType;
	body: string | null;
	owner_uuid: string | null;
	created_by_uuid: string | null;
	status: DocumentStatus;
	created_at: string;
	created_by_motion_uuid: string | null;
	proposal_motion_uuid: string | null;
	adopted_at: string | null;
	adopted_by_motion_uuid: string | null;
	repealed_at: string | null;
	repealed_by_motion_uuid: string | null;
	sunsets_at: string | null;
}

export interface Article {
	uuid: string;
	document_uuid: string;
	number: string; // stored as text, e.g. "I", "II", "III"
	title: string;
}

export interface Section {
	uuid: string;
	article_uuid: string;
	number: number;
	title: string;
	prose: string;
	rationale: string;
	version: number;
	amended_by_motion_uuid: string | null;
}

export interface SectionHistory {
	uuid: string;
	section_uuid: string;
	version: number;
	prose: string;
	rationale: string;
	editor_uuid: string;
	amended_by_motion_uuid: string | null;
	recorded_at: string;
}

// --- Document queries ---

export function getDocumentByUuid(uuid: string): Document | null {
	return (
		(db.prepare('SELECT * FROM document WHERE uuid = ?').get(uuid) as Document | undefined) ?? null
	);
}

export function getDocumentBySlug(slug: string): Document | null {
	return (
		(db.prepare('SELECT * FROM document WHERE slug = ?').get(slug) as Document | undefined) ?? null
	);
}

export function listDocuments(opts: {
	ownerUuid?: string;
	status?: Document['status'];
} = {}): Document[] {
	let query = 'SELECT * FROM document WHERE 1=1';
	const params: string[] = [];
	if (opts.ownerUuid) { query += ' AND owner_uuid = ?'; params.push(opts.ownerUuid); }
	if (opts.status)    { query += ' AND status = ?';     params.push(opts.status); }
	query += ' ORDER BY title';
	return db.prepare(query).all(...params) as Document[];
}

// --- Article queries ---

export function getArticlesByDocument(documentUuid: string): Article[] {
	return db
		.prepare('SELECT * FROM article WHERE document_uuid = ? ORDER BY number')
		.all(documentUuid) as Article[];
}

export function getArticleByUuid(uuid: string): Article | null {
	return (
		(db.prepare('SELECT * FROM article WHERE uuid = ?').get(uuid) as Article | undefined) ?? null
	);
}

// --- Section queries ---

export function getSectionsByArticle(articleUuid: string): Section[] {
	return db
		.prepare('SELECT * FROM section WHERE article_uuid = ? ORDER BY number')
		.all(articleUuid) as Section[];
}

export function getSectionByUuid(uuid: string): Section | null {
	return (
		(db.prepare('SELECT * FROM section WHERE uuid = ?').get(uuid) as Section | undefined) ?? null
	);
}

export function getSectionHistory(sectionUuid: string): SectionHistory[] {
	return db
		.prepare(
			'SELECT * FROM section_history WHERE section_uuid = ? ORDER BY version DESC'
		)
		.all(sectionUuid) as SectionHistory[];
}

export function updateSection(
	sectionUuid: string,
	input: { title: string; prose: string; rationale: string; editorUuid: string; motionUuid?: string | null }
): Section {
	const section = getSectionByUuid(sectionUuid);
	if (!section) throw new Error('Section not found');

	const now = new Date().toISOString();

	db.transaction(() => {
		// Archive current version
		db.prepare(
			`INSERT INTO section_history (uuid, section_uuid, version, prose, rationale, editor_uuid, amended_by_motion_uuid, recorded_at)
			 VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
		).run(
			randomUUID(),
			sectionUuid,
			section.version,
			section.prose,
			section.rationale,
			input.editorUuid,
			input.motionUuid ?? null,
			now
		);

		// Bump version and update content
		db.prepare(
			`UPDATE section SET title = ?, prose = ?, rationale = ?, version = version + 1,
			 amended_by_motion_uuid = ? WHERE uuid = ?`
		).run(input.title, input.prose, input.rationale, input.motionUuid ?? null, sectionUuid);
	})();

	return getSectionByUuid(sectionUuid)!;
}

// --- Full document tree ---
// Convenience: returns a document with its articles and sections nested.

export interface SectionWithHistory extends Section {
	history: SectionHistory[];
}

export interface ArticleWithSections extends Article {
	sections: SectionWithHistory[];
}

export interface DocumentTree extends Document {
	articles: ArticleWithSections[];
}

export function getDocumentTree(documentUuid: string): DocumentTree | null {
	const doc = getDocumentByUuid(documentUuid);
	if (!doc) return null;

	const articles = getArticlesByDocument(documentUuid);

	return {
		...doc,
		articles: articles.map((article) => ({
			...article,
			sections: getSectionsByArticle(article.uuid).map((section) => ({
				...section,
				history: getSectionHistory(section.uuid),
			})),
		})),
	};
}

// --- Document status ---

export function repealDocument(uuid: string, motionUuid: string): void {
	const repealedAt = new Date().toISOString();
	db.prepare(
		"UPDATE document SET status = 'repealed', repealed_at = ?, repealed_by_motion_uuid = ? WHERE uuid = ?"
	).run(repealedAt, motionUuid, uuid);
}

export function adoptDocument(uuid: string, motionUuid: string | null): void {
	const adoptedAt = new Date().toISOString();
	db.prepare(
		"UPDATE document SET status = 'adopted', adopted_at = ?, adopted_by_motion_uuid = ? WHERE uuid = ?"
	).run(adoptedAt, motionUuid, uuid);
}

// --- Import ---

export interface DocumentImportInput {
	slug: string;
	title: string;
	type?: DocumentType;
	owner_uuid?: string | null;
	created_by_uuid?: string | null;
	articles: Array<{
		number: string;
		title: string;
		sections: Array<{
			title: string;
			body: string;
			rationale: string;
		}>;
	}>;
}

/**
 * Import a document from structured data. Idempotent — skips if the slug already exists.
 * Returns the document uuid (existing or newly created).
 */
export function importDocument(input: DocumentImportInput): string {
	const existing = getDocumentBySlug(input.slug);
	if (existing) return existing.uuid;

	const docUuid = randomUUID();
	const createdAt = new Date().toISOString();

	db.transaction(() => {
		db.prepare(
			`INSERT INTO document (uuid, title, slug, type, owner_uuid, created_by_uuid, status, created_at, created_by_motion_uuid, proposal_motion_uuid, adopted_at, adopted_by_motion_uuid)
			 VALUES (?, ?, ?, ?, ?, ?, 'adopted', ?, NULL, NULL, ?, NULL)`
		).run(docUuid, input.title, input.slug, input.type ?? 'regulation', input.owner_uuid ?? null, input.created_by_uuid ?? null, createdAt, createdAt);

		for (const article of input.articles) {
			const articleUuid = randomUUID();
			db.prepare(
				'INSERT INTO article (uuid, document_uuid, number, title) VALUES (?, ?, ?, ?)'
			).run(articleUuid, docUuid, article.number, article.title);

			for (let i = 0; i < article.sections.length; i++) {
				const s = article.sections[i];
				db.prepare(
					`INSERT INTO section (uuid, article_uuid, number, title, prose, rationale, version)
					 VALUES (?, ?, ?, ?, ?, ?, 1)`
				).run(randomUUID(), articleUuid, i + 1, s.title, s.body, s.rationale);
			}
		}
	})();

	return docUuid;
}

/**
 * Create a simple unstructured document (prose or budget type).
 */
export function createSimpleDocument(input: {
	title: string;
	slug: string;
	type: 'prose' | 'budget';
	body: string;
	owner_uuid?: string | null;
	created_by_uuid?: string | null;
	status?: DocumentStatus;
}): Document {
	const uuid = randomUUID();
	const createdAt = new Date().toISOString();
	
	db.prepare(
		`INSERT INTO document (uuid, title, slug, type, body, owner_uuid, created_by_uuid, status, created_at)
		 VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
	).run(
		uuid,
		input.title,
		input.slug,
		input.type,
		input.body,
		input.owner_uuid ?? null,
		input.created_by_uuid ?? null,
		input.status ?? 'draft',
		createdAt
	);
	
	return getDocumentByUuid(uuid)!;
}

/**
 * Update the body of a simple document (prose or budget type).
 */
export function updateSimpleDocument(uuid: string, body: string): Document {
	db.prepare('UPDATE document SET body = ? WHERE uuid = ?').run(body, uuid);
	return getDocumentByUuid(uuid)!;
}

