import { db } from './db.js';
import type { Society } from './types.js';

/**
 * Look up a society by UUID
 */
export function lookupSocietyByUuid(uuid: string): Society | null {
	const stmt = db.prepare(/* sql */ `
		SELECT 
			uuid,
			handle,
			parent_uuid,
			public_key,
			bfs_url,
			url,
			ip_address,
			port,
			founded_at,
			registered_at,
			status,
			people_count,
			person_years,
			issued_florens
		FROM societies
		WHERE uuid = ?
	`);

	return stmt.get(uuid) as Society | null;
}

/**
 * Look up a society by handle
 */
export function lookupSociety(handle: string): Society | null {
	const stmt = db.prepare(/* sql */ `
		SELECT 
			uuid,
			handle,
			parent_uuid,
			public_key,
			bfs_url,
			url,
			ip_address,
			port,
			founded_at,
			registered_at,
			status,
			people_count,
			person_years,
			issued_florens
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
export function getChildren(parentUuid: string): Society[] {
	const stmt = db.prepare(/* sql */ `
		SELECT 
			uuid,
			handle,
			parent_uuid,
			public_key,
			bfs_url,
			url,
			ip_address,
			port,
			founded_at,
			registered_at,
			status,
			people_count,
			person_years,
			issued_florens
		FROM societies
		WHERE parent_uuid = ?
		ORDER BY founded_at ASC
	`);

	return stmt.all(parentUuid) as Society[];
}

/**
 * Get all societies (paginated)
 */
export function getAllSocieties(params: {
	page?: number;
	limit?: number;
	parentUuid?: string;
}): { societies: Society[]; total: number } {
	const { page = 1, limit = 100, parentUuid } = params;
	const offset = (page - 1) * limit;

	let query = 'SELECT * FROM societies WHERE 1=1';
	const queryParams: any[] = [];

	if (parentUuid) {
		query += ' AND parent_uuid = ?';
		queryParams.push(parentUuid);
	}

	query += ' ORDER BY founded_at DESC LIMIT ? OFFSET ?';
	queryParams.push(limit, offset);

	const societies = db.prepare(query).all(...queryParams) as Society[];

	// Get total count
	let countQuery = 'SELECT COUNT(*) as count FROM societies WHERE 1=1';
	const countParams: any[] = [];
	if (parentUuid) {
		countQuery += ' AND parent_uuid = ?';
		countParams.push(parentUuid);
	}
	const { count } = db.prepare(countQuery).get(...countParams) as { count: number };

	return { societies, total: count };
}

/**
 * Compute lineage for a society by walking up the parent chain
 */
export function computeLineage(handle: string): string[] | null {
	const society = lookupSociety(handle);
	if (!society) {
		return null;
	}

	const lineage: string[] = [handle];
	let currentUuid = society.parent_uuid;

	// Walk up the parent chain (max 20 levels to prevent infinite loops)
	for (let i = 0; i < 20; i++) {
		if (!currentUuid) {
			break;
		}
		const parent = lookupSocietyByUuid(currentUuid);
		if (!parent) {
			break;
		}
		lineage.push(parent.handle);
		currentUuid = parent.parent_uuid;
	}

	return lineage;
}
