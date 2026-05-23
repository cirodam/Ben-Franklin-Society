import { db } from '../db.js';
import type { FoundingRecord } from './lineage/identity.js';

const MAX_CHILDREN_PER_PARENT = 5;

export interface Society {
	uuid: string;
	handle: string;
	public_key: string;
	bfs_url: string | null;
	url: string | null;
	ipv4: string | null;
	ipv6: string | null;
	port: number;
	tor_address: string | null;
	i2p_address: string | null;
	parent_uuid: string | null;
	founding_record_json: string | null;
	founded_at: number | null;
	lineage_json: string | null;
	last_lineage_verified: number | null;
	latitude: number | null;
	longitude: number | null;
	last_interaction: number | null;
	interaction_count: number;
	discovered_at: number;
	notes: string | null;
}

/**
 * Add or update a society in our cache
 */
export function cacheSociety(params: {
	uuid: string;
	handle: string;
	bfsUrl?: string | null;
	url?: string | null;
	ipv4?: string | null;
	ipv6?: string | null;
	port?: number;
	publicKey: string;
	parentUuid?: string | null;
	foundingRecordJson?: string | null;
	foundedAt?: number | null;
	lineageJson?: string | null;
	latitude?: number | null;
	longitude?: number | null;
	notes?: string | null;
}): void {
	const stmt = db.prepare(/* sql */ `
		INSERT INTO societies (
			uuid,
			handle,
			public_key,
			bfs_url,
			url,
			ipv4,
			ipv6,
			port,
			parent_uuid,
			founding_record_json,
			founded_at,
			lineage_json,
			latitude,
			longitude,
			notes
		) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
		ON CONFLICT(uuid) DO UPDATE SET
			handle = excluded.handle,
			public_key = excluded.public_key,
			bfs_url = excluded.bfs_url,
			url = excluded.url,
			ipv4 = excluded.ipv4,
			ipv6 = excluded.ipv6,
			port = excluded.port,
			parent_uuid = excluded.parent_uuid,
			founding_record_json = excluded.founding_record_json,
			founded_at = excluded.founded_at,
			lineage_json = excluded.lineage_json,
			latitude = excluded.latitude,
			longitude = excluded.longitude,
			notes = excluded.notes,
			last_interaction = unixepoch()
	`);

	stmt.run(
		params.uuid,
		params.handle,
		params.publicKey,
		params.bfsUrl || null,
		params.url || null,
		params.ipv4 || null,
		params.ipv6 || null,
		params.port || 5173,
		params.parentUuid || null,
		params.foundingRecordJson || null,
		params.foundedAt || null,
		params.lineageJson || null,
		params.latitude || null,
		params.longitude || null,
		params.notes || null
	);
}

/**
 * Get a society by UUID (permanent identifier)
 */
export function getSociety(uuid: string): Society | null {
	const stmt = db.prepare(/* sql */ `
		SELECT * FROM societies WHERE uuid = ?
	`);

	return (stmt.get(uuid) as Society | undefined) || null;
}

/**
 * Get a society by handle (may change)
 */
export function getSocietyByHandle(handle: string): Society | null {
	const stmt = db.prepare(/* sql */ `
		SELECT * FROM societies WHERE handle = ?
	`);

	return (stmt.get(handle) as Society | undefined) || null;
}

/**
 * Update a society's handle
 */
export function updateSocietyHandle(uuid: string, newHandle: string): void {
	const stmt = db.prepare(/* sql */ `
		UPDATE societies SET handle = ? WHERE uuid = ?
	`);

	stmt.run(newHandle, uuid);
}

/**
 * Get our parent society (if we have one)
 */
export function getParentSociety(): Society | null {
	const stmt = db.prepare(/* sql */ `
		SELECT s.* FROM societies s
		INNER JOIN society_identity si ON s.uuid = si.parent_uuid
		LIMIT 1
	`);

	return (stmt.get() as Society | undefined) || null;
}

/**
 * Get all our children societies
 */
export function getChildrenSocieties(): Society[] {
	const stmt = db.prepare(/* sql */ `
		SELECT s.* FROM societies s
		INNER JOIN society_identity si ON s.parent_uuid = si.uuid
		ORDER BY s.founded_at ASC
	`);

	return stmt.all() as Society[];
}

/**
 * Check if we can adopt another child (max 5)
 */
export function canAdoptChild(): boolean {
	const stmt = db.prepare(/* sql */ `
		SELECT COUNT(*) as count 
		FROM societies s
		INNER JOIN society_identity si ON s.parent_uuid = si.uuid
	`);

	const result = stmt.get() as { count: number };
	return result.count < MAX_CHILDREN_PER_PARENT;
}

/**
 * Get all societies founded by a specific parent (by UUID)
 */
export function getSocietiesByParent(parentUuid: string): Society[] {
	const stmt = db.prepare(/* sql */ `
		SELECT * FROM societies WHERE parent_uuid = ?
		ORDER BY founded_at ASC
	`);

	return stmt.all(parentUuid) as Society[];
}

/**
 * Get siblings (societies with same parent as us)
 */
export function getSiblingSocieties(): Society[] {
	const stmt = db.prepare(/* sql */ `
		SELECT s.* FROM societies s
		INNER JOIN society_identity si ON s.parent_uuid = si.parent_uuid
		WHERE s.uuid != si.uuid
		  AND si.parent_uuid IS NOT NULL
		ORDER BY s.founded_at ASC
	`);

	return stmt.all() as Society[];
}

/**
 * Get the root of our lineage tree
 */
export async function getOurRoot(): Promise<string> {
	// Get our UUID
	const identityStmt = db.prepare(/* sql */ `
		SELECT uuid, parent_uuid FROM society_identity LIMIT 1
	`);

	const identity = identityStmt.get() as
		| { uuid: string; parent_uuid: string | null }
		| undefined;

	if (!identity) {
		throw new Error('Society identity not initialized');
	}

	let currentUuid = identity.uuid;
	let currentParentUuid = identity.parent_uuid;

	// If we have no parent, we ARE the root
	if (!currentParentUuid) {
		return currentUuid;
	}

	// Walk up the tree to find the root
	const visited = new Set<string>();
	visited.add(currentUuid);

	while (currentParentUuid) {
		// Prevent infinite loops
		if (visited.has(currentParentUuid)) {
			console.error('Circular parent reference detected!');
			return currentUuid;
		}
		visited.add(currentParentUuid);

		// Check if parent is in societies table
		const parent = getSociety(currentParentUuid);

		if (!parent) {
			// Parent not cached locally, they are the root (or we can't verify further)
			return currentParentUuid;
		}

		if (!parent.parent_uuid) {
			// Found the root
			return parent.uuid;
		}

		// Move up the tree
		currentParentUuid = parent.parent_uuid;
	}

	return currentUuid; // Shouldn't reach here, but return current as fallback
}

/**
 * Add a peer society with verification (auto-populates parent_uuid)
 * Verifies they share a common ancestor before adding
 */
export async function addPeerSociety(societyUrl: string): Promise<void> {
	// 1. Fetch their identity
	const response = await fetch(`${societyUrl}/api/federation/identity`);

	if (!response.ok) {
		throw new Error(`Failed to fetch society identity: ${response.statusText}`);
	}

	const identity = await response.json();

	// 2. Verify they have required fields
	if (!identity.uuid || !identity.handle || !identity.public_key) {
		throw new Error('Invalid society identity: missing required fields');
	}

	// 3. Walk their lineage to verify shared ancestry
	const theirRoot = await walkLineageToRoot(identity);
	const ourRoot = await getOurRoot();

	if (theirRoot !== ourRoot) {
		throw new Error(
			`Cannot add peer: No shared ancestor. Their root: ${theirRoot}, Our root: ${ourRoot}`
		);
	}

	// 4. Cache with auto-populated parent_uuid from their identity
	cacheSociety({
		uuid: identity.uuid,
		handle: identity.handle,
		bfsUrl: identity.bfs_url || null,
		url: identity.url || null,
		ipv4: identity.ipv4 || null,
		ipv6: identity.ipv6 || null,
		port: identity.port || 5173,
		publicKey: identity.public_key,
		parentUuid: identity.parent_uuid || null, // Auto-populated!
		foundingRecordJson: identity.founding_record_json || null,
		foundedAt: identity.founded_at || null,
		lineageJson: identity.lineage ? JSON.stringify(identity.lineage) : null
	});
}

/**
 * Walk a society's lineage to find their root
 * Used for ancestry verification
 */
async function walkLineageToRoot(identity: {
	uuid: string;
	parent_uuid: string | null;
	url?: string | null;
	bfs_url?: string | null;
	ipv4?: string | null;
}): Promise<string> {
	let currentUuid = identity.uuid;
	let currentParentUuid = identity.parent_uuid;

	// If they have no parent, they ARE the root
	if (!currentParentUuid) {
		return currentUuid;
	}

	const visited = new Set<string>();
	visited.add(currentUuid);

	// Walk up to max 20 levels (prevent infinite loops)
	for (let i = 0; i < 20; i++) {
		if (!currentParentUuid) {
			return currentUuid;
		}

		// Check if we've seen this UUID (circular reference)
		if (visited.has(currentParentUuid)) {
			console.error('Circular lineage detected');
			return currentUuid;
		}
		visited.add(currentParentUuid);

		// Check local cache first
		const cachedParent = getSociety(currentParentUuid);

		if (cachedParent) {
			if (!cachedParent.parent_uuid) {
				// Found root in cache
				return cachedParent.uuid;
			}
			// Continue walking up
			currentUuid = cachedParent.uuid;
			currentParentUuid = cachedParent.parent_uuid;
			continue;
		}

		// Parent not cached - would need to fetch from network
		// For now, assume the parent_uuid we have is the root
		// TODO: Implement network fetch to walk further up the chain
		return currentParentUuid;
	}

	// Max depth reached
	return currentUuid;
}

/**
 * Get all societies (for admin/debugging)
 */
export function getAllSocieties(): Society[] {
	const stmt = db.prepare(/* sql */ `
		SELECT * FROM societies
		ORDER BY handle ASC
	`);

	return stmt.all() as Society[];
}

/**
 * Delete a society from cache
 */
export function deleteSociety(uuid: string): void {
	const stmt = db.prepare(/* sql */ `
		DELETE FROM societies WHERE uuid = ?
	`);

	stmt.run(uuid);
}

/**
 * Update society connectivity information
 */
export function updateSocietyConnectivity(
	uuid: string,
	connectivity: {
		bfsUrl?: string | null;
		url?: string | null;
		ipv4?: string | null;
		ipv6?: string | null;
		port?: number;
		torAddress?: string | null;
		i2pAddress?: string | null;
	}
): void {
	const stmt = db.prepare(/* sql */ `
		UPDATE societies 
		SET 
			bfs_url = COALESCE(?, bfs_url),
			url = COALESCE(?, url),
			ipv4 = COALESCE(?, ipv4),
			ipv6 = COALESCE(?, ipv6),
			port = COALESCE(?, port),
			tor_address = COALESCE(?, tor_address),
			i2p_address = COALESCE(?, i2p_address),
			last_interaction = unixepoch()
		WHERE uuid = ?
	`);

	stmt.run(
		connectivity.bfsUrl,
		connectivity.url,
		connectivity.ipv4,
		connectivity.ipv6,
		connectivity.port,
		connectivity.torAddress,
		connectivity.i2pAddress,
		uuid
	);
}

/**
 * Search societies by handle pattern
 */
export function searchSocietiesByHandle(pattern: string): Society[] {
	const stmt = db.prepare(/* sql */ `
		SELECT * FROM societies 
		WHERE handle LIKE ?
		ORDER BY handle ASC
		LIMIT 50
	`);

	return stmt.all(`%${pattern}%`) as Society[];
}
