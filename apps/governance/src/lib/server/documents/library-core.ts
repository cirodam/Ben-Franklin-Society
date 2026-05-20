/**
 * Library Core - Shared utilities and cross-type operations
 */
import { readFileSync, readdirSync, writeFileSync, mkdirSync, existsSync, unlinkSync } from 'node:fs';
import { join } from 'node:path';
import { db } from '../db.js';
import type { LibraryDocument } from './library-types.js';

// --- Constants ---

export const LIBRARY_DIR = join(process.cwd(), 'data', 'library');

// Ensure directory exists
if (!existsSync(LIBRARY_DIR)) {
	mkdirSync(LIBRARY_DIR, { recursive: true });
}

// --- Utilities ---

/**
 * Get the society association UUID (internal use only)
 */
export function getSocietyUuid(): string | null {
	const result = db
		.prepare("SELECT uuid FROM association WHERE type = 'society' LIMIT 1")
		.get() as { uuid: string } | undefined;
	return result?.uuid ?? null;
}

/**
 * Sync a library document to the database index
 */
export function syncToDatabase(doc: LibraryDocument): void {
	const existing = db
		.prepare('SELECT uuid FROM library_item WHERE slug = ?')
		.get(doc.slug) as { uuid: string } | undefined;

	if (existing) {
		// Update existing
		db.prepare(
			`UPDATE library_item 
			 SET type = ?, document_id = ?, version = ?, title = ?, owner_uuid = ?, updated_at = ?, file_path = ?
			 WHERE slug = ?`
		).run(
			doc.type,
			doc.document_id,
			doc.version,
			doc.title,
			doc.owner_uuid,
			doc.updated_at,
			doc.slug + '.json',
			doc.slug
		);
	} else {
		// Insert new
		db.prepare(
			`INSERT INTO library_item (uuid, type, slug, document_id, version, title, owner_uuid, created_at, updated_at, file_path)
			 VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
		).run(
			doc.uuid,
			doc.type,
			doc.slug,
			doc.document_id,
			doc.version,
			doc.title,
			doc.owner_uuid,
			doc.created_at,
			doc.updated_at,
			doc.slug + '.json'
		);
	}
}

// --- Search and Stats ---

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
	document_id: string | null;
	version: number;
	title: string;
	owner_uuid: string;
	created_at: string;
	updated_at: string;
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
		document_id: string | null;
		version: number;
		title: string;
		owner_uuid: string;
		created_at: string;
		updated_at: string;
		file_path: string;
	}>;

	return rows.map(row => ({
		uuid: row.uuid,
		type: row.type,
		slug: row.slug,
		document_id: row.document_id,
		version: row.version,
		title: row.title,
		owner_uuid: row.owner_uuid,
		created_at: row.created_at,
		updated_at: row.updated_at,
	}));
}

/**
 * Get library statistics by type
 */
export function getLibraryStats(): Record<string, { total: number }> {
	const items = db.prepare('SELECT type FROM library_item').all() as Array<{
		type: string;
	}>;

	const stats: Record<string, { total: number }> = {};

	for (const item of items) {
		if (!stats[item.type]) {
			stats[item.type] = { total: 0 };
		}
		stats[item.type].total++;
	}

	return stats;
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
 * Change the owner of a document by slug
 */
export function changeDocumentOwner(slug: string, newOwnerUuid: string): boolean {
	try {
		// Get document info from database
		const row = db.prepare('SELECT type, uuid FROM library_item WHERE slug = ?').get(slug) as { type: string; uuid: string } | undefined;
		
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
		
		// Load the file
		const filePath = join(LIBRARY_DIR, directory, `${slug}.json`);
		if (!existsSync(filePath)) {
			return false;
		}

		const content = readFileSync(filePath, 'utf-8');
		const doc = JSON.parse(content) as LibraryDocument;
		
		// Update owner
		doc.owner_uuid = newOwnerUuid;
		doc.updated_at = new Date().toISOString();
		
		// Write back to file
		writeFileSync(filePath, JSON.stringify(doc, null, 2), 'utf-8');
		
		// Sync to database
		syncToDatabase(doc);
		
		return true;
	} catch (err) {
		console.error(`Error changing owner for document ${slug}:`, err);
		return false;
	}
}
