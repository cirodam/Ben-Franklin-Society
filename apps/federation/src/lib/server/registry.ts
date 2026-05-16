import { db } from '../db.js';
import { sign, verify } from 'crypto';

export interface Society {
	handle: string;
	uuid: string;
	parent_handle: string | null;
	public_key: string;
	endpoint: string;
	founded_at: number;
	registered_at: number;
	status: string;
}

export interface FoundingRecord {
	type: 'society_founding';
	parent: {
		handle: string;
		uuid: string;
		public_key: string;
	};
	child: {
		handle: string;
		uuid: string;
		public_key: string;
	};
	founded_at: string;
	parent_attestation: string;
	signature: string;
}

/**
 * Verify a founding record's cryptographic signature
 */
function verifyFoundingRecord(record: FoundingRecord): boolean {
	const message = JSON.stringify({
		type: record.type,
		parent: record.parent,
		child: record.child,
		founded_at: record.founded_at,
		parent_attestation: record.parent_attestation
	});

	try {
		return verify(null, Buffer.from(message), record.parent.public_key, Buffer.from(record.signature, 'base64'));
	} catch {
		return false;
	}
}

/**
 * Register a new society in the Federation index
 * Verifies the parent's signature on the founding record
 */
export function registerSociety(params: {
	foundingRecord: FoundingRecord;
	endpoint: string;
}): { success: boolean; error?: string } {
	const { foundingRecord, endpoint } = params;

	// Verify the parent's signature
	if (!verifyFoundingRecord(foundingRecord)) {
		return { success: false, error: 'Invalid founding record signature' };
	}

	// Check if handle is already registered
	const existing = lookupSociety(foundingRecord.child.handle);
	if (existing) {
		return { success: false, error: 'Society handle already registered' };
	}

	// If child has a parent, verify parent exists in registry (optional - lineage is source of truth)
	if (foundingRecord.parent.handle) {
		const parent = lookupSociety(foundingRecord.parent.handle);
		if (parent && parent.public_key !== foundingRecord.parent.public_key) {
			return { success: false, error: 'Parent public key mismatch' };
		}
	}

	// Register the society
	const foundedAt = Math.floor(new Date(foundingRecord.founded_at).getTime() / 1000);

	const stmt = db.prepare(/* sql */ `
		INSERT INTO societies (
			handle,
			uuid,
			parent_handle,
			public_key,
			endpoint,
			founding_record_json,
			founded_at,
			status
		) VALUES (?, ?, ?, ?, ?, ?, ?, 'active')
	`);

	stmt.run(
		foundingRecord.child.handle,
		foundingRecord.child.uuid,
		foundingRecord.parent.handle || null,
		foundingRecord.child.public_key,
		endpoint,
		JSON.stringify(foundingRecord),
		foundedAt
	);

	// Compute and cache lineage
	computeLineage(foundingRecord.child.handle);

	return { success: true };
}

/**
 * Look up a society by handle
 */
export function lookupSociety(handle: string): Society | null {
	const stmt = db.prepare(/* sql */ `
		SELECT 
			handle,
			uuid,
			parent_handle,
			public_key,
			endpoint,
			founded_at,
			registered_at,
			status
		FROM societies
		WHERE handle = ?
	`);

	return stmt.get(handle) as Society | null;
}

/**
 * Get a society's public key
 */
export function getSocietyPublicKey(handle: string): string | null {
	const society = lookupSociety(handle);
	return society?.public_key || null;
}

/**
 * Get all children of a society
 */
export function getChildren(parentHandle: string): Society[] {
	const stmt = db.prepare(/* sql */ `
		SELECT 
			handle,
			uuid,
			parent_handle,
			public_key,
			endpoint,
			founded_at,
			registered_at,
			status
		FROM societies
		WHERE parent_handle = ?
		ORDER BY founded_at ASC
	`);

	return stmt.all(parentHandle) as Society[];
}

/**
 * Get all societies (paginated)
 */
export function getAllSocieties(params: {
	page?: number;
	limit?: number;
	parentHandle?: string;
}): { societies: Society[]; total: number } {
	const { page = 1, limit = 100, parentHandle } = params;
	const offset = (page - 1) * limit;

	let query = 'SELECT * FROM societies WHERE 1=1';
	const queryParams: any[] = [];

	if (parentHandle) {
		query += ' AND parent_handle = ?';
		queryParams.push(parentHandle);
	}

	query += ' ORDER BY founded_at DESC LIMIT ? OFFSET ?';
	queryParams.push(limit, offset);

	const societies = db.prepare(query).all(...queryParams) as Society[];

	// Get total count
	let countQuery = 'SELECT COUNT(*) as count FROM societies WHERE 1=1';
	const countParams: any[] = [];
	if (parentHandle) {
		countQuery += ' AND parent_handle = ?';
		countParams.push(parentHandle);
	}
	const { count } = db.prepare(countQuery).get(...countParams) as { count: number };

	return { societies, total: count };
}

/**
 * Compute lineage for a society by walking up the parent chain
 * Stores result in lineage_cache table
 */
export function computeLineage(handle: string): string[] {
	const lineage: string[] = [handle];
	let currentHandle = handle;

	// Walk up the parent chain (max 20 levels to prevent infinite loops)
	for (let i = 0; i < 20; i++) {
		const society = lookupSociety(currentHandle);
		if (!society || !society.parent_handle) {
			break;
		}
		lineage.push(society.parent_handle);
		currentHandle = society.parent_handle;
	}

	// Cache the lineage
	const stmt = db.prepare(/* sql */ `
		INSERT INTO lineage_cache (society_handle, lineage_json)
		VALUES (?, ?)
		ON CONFLICT(society_handle) DO UPDATE SET
			lineage_json = excluded.lineage_json,
			computed_at = unixepoch()
	`);

	stmt.run(handle, JSON.stringify(lineage));

	return lineage;
}

/**
 * Get lineage from cache (or compute if missing)
 */
export function getLineageFromCache(handle: string): string[] | null {
	const stmt = db.prepare(/* sql */ `
		SELECT lineage_json
		FROM lineage_cache
		WHERE society_handle = ?
	`);

	const row = stmt.get(handle) as { lineage_json: string } | undefined;

	if (row) {
		return JSON.parse(row.lineage_json);
	}

	// Not in cache, compute it if society exists
	const society = lookupSociety(handle);
	if (society) {
		return computeLineage(handle);
	}

	return null;
}
