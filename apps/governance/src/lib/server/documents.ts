import { db } from './db.js';

// --- Types ---

export interface Document {
	uuid: string;
	title: string;
	slug: string;
	owner_uuid: string | null;
	status: 'active' | 'archived';
	created_at: string;
	created_by_motion_uuid: string | null;
}

export interface Article {
	uuid: string;
	document_uuid: string;
	number: number;
	title: string;
}

export interface Section {
	uuid: string;
	article_uuid: string;
	number: number;
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
	amended_by_motion_uuid: string;
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

export function archiveDocument(uuid: string): void {
	db.prepare("UPDATE document SET status = 'archived' WHERE uuid = ?").run(uuid);
}

