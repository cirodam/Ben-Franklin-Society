import { db } from '../../db.js';
import { verifyFoundingRecord } from './verification.js';
import type { FoundingRecord } from './identity.js';

export interface SocietyIdentity {
	handle: string;
	uuid: string;
	public_key: string;
	parent_uuid: string | null;
	founded_at: number | null;
	lineage: string[];
	founding_record: FoundingRecord | null;
}

/**
 * Query a society's endpoint to get their identity
 */
export async function querySocietyIdentity(endpoint: string): Promise<SocietyIdentity | null> {
	try {
		const response = await fetch(`${endpoint}/api/lineage`);
		
		if (!response.ok) {
			return null;
		}

		const data = await response.json();

		return {
			handle: data.handle,
			uuid: data.uuid,
			public_key: data.public_key,
			parent_uuid: data.parent_uuid,
			founded_at: data.founded_at,
			lineage: data.lineage || [],
			founding_record: data.founding_record
		};
	} catch (error) {
		console.error(`Failed to query ${endpoint}:`, error);
		return null;
	}
}

/**
 * Walk the lineage chain by querying each parent society
 * Returns verified lineage with founding records
 */
export async function walkLineage(startEndpoint: string): Promise<{
	lineage: string[];
	records: FoundingRecord[];
	verified: boolean;
}> {
	const lineage: string[] = [];
	const records: FoundingRecord[] = [];
	let currentEndpoint = startEndpoint;
	const visited = new Set<string>();

	// Walk up the chain (max 20 levels)
	for (let i = 0; i < 20; i++) {
		// Prevent infinite loops
		if (visited.has(currentEndpoint)) {
			break;
		}
		visited.add(currentEndpoint);

		// Query this society
		const identity = await querySocietyIdentity(currentEndpoint);
		
		if (!identity) {
			// Failed to query, stop here
			break;
		}

		lineage.push(identity.handle);

		// If this society has a founding record, add it
		if (identity.founding_record) {
			records.push(identity.founding_record);
		}

		// If no parent, we've reached the root
		if (!identity.parent_uuid) {
			break;
		}

		// Look up parent endpoint by UUID
		const parentEndpoint = await getEndpointForSociety(identity.parent_uuid);
		
		if (!parentEndpoint) {
			// Can't continue without parent endpoint
			break;
		}

		currentEndpoint = parentEndpoint;
	}

	// Verify all founding records
	let verified = true;
	for (const record of records) {
		if (!verifyFoundingRecord(record)) {
			verified = false;
			break;
		}
	}

	return { lineage, records, verified };
}

/**
 * Get endpoint for a society by UUID (from cache or Federation)
 * Returns the first available endpoint (url, ipv4, or bfs_url)
 */
async function getEndpointForSociety(uuid: string): Promise<string | null> {
	// First check local cache
	const stmt = db.prepare('SELECT url, ipv4, bfs_url, port FROM societies WHERE uuid = ?');
	const row = stmt.get(uuid) as { url: string | null; ipv4: string | null; bfs_url: string | null; port: number } | undefined;
	
	if (row) {
		const port = row.port || 5173;
		if (row.url) return row.url;
		if (row.ipv4) return `http://${row.ipv4}:${port}`;
		if (row.bfs_url) return `https://${row.bfs_url}`;
	}

	// Try Federation lookup
	try {
		const { lookupInFederation } = await import('../client.js');
		const society = await lookupInFederation(uuid);
		return society?.endpoint || null;
	} catch {
		return null;
	}
}

/**
 * Verify and cache a society's lineage
 * Walks the chain and stores verified lineage in our societies table
 */
export async function verifyAndCacheLineage(params: {
	handle: string;
	endpoint: string;
	uuid: string;
	publicKey: string;
}): Promise<{ verified: boolean; lineage: string[] }> {
	const { handle, endpoint, uuid, publicKey } = params;

	// Walk the lineage from this society
	const result = await walkLineage(endpoint);

	// Update or insert in societies table
	const stmt = db.prepare(/* sql */ `
		INSERT INTO societies (
			uuid,
			handle,
			url,
			public_key,
			lineage_json,
			last_lineage_verified
		) VALUES (?, ?, ?, ?, ?, ?)
		ON CONFLICT(uuid) DO UPDATE SET
			handle = excluded.handle,
			url = excluded.url,
			public_key = excluded.public_key,
			lineage_json = excluded.lineage_json,
			last_lineage_verified = excluded.last_lineage_verified
	`);

	const now = Math.floor(Date.now() / 1000);

	stmt.run(
		uuid,
		handle,
		endpoint,
		publicKey,
		JSON.stringify(result.lineage),
		now
	);

	return {
		verified: result.verified,
		lineage: result.lineage
	};
}

/**
 * Refresh lineage for a cached society
 * Re-walks and re-verifies the chain
 */
export async function refreshLineage(handle: string): Promise<boolean> {
	// Get society from cache
	const stmt = db.prepare('SELECT endpoint, uuid, public_key FROM societies WHERE handle = ?');
	const row = stmt.get(handle) as { endpoint: string; uuid: string; public_key: string } | undefined;

	if (!row) {
		return false;
	}

	// Verify and cache fresh lineage
	const result = await verifyAndCacheLineage({
		handle,
		endpoint: row.endpoint,
		uuid: row.uuid,
		publicKey: row.public_key
	});

	return result.verified;
}

/**
 * Get the lineage for a society from cache (or walk if not cached)
 */
export async function getLineage(handle: string): Promise<string[] | null> {
	// Try cache first
	const stmt = db.prepare('SELECT lineage_json, last_lineage_verified FROM societies WHERE handle = ?');
	const row = stmt.get(handle) as { lineage_json: string | null; last_lineage_verified: number | null } | undefined;

	if (row?.lineage_json) {
		// Check if cache is fresh (within 24 hours)
		const now = Math.floor(Date.now() / 1000);
		const age = row.last_lineage_verified ? now - row.last_lineage_verified : Infinity;

		if (age < 86400) { // 24 hours
			return JSON.parse(row.lineage_json);
		}
	}

	// Not cached or stale, refresh it
	const refreshed = await refreshLineage(handle);
	
	if (!refreshed) {
		return null;
	}

	// Get fresh lineage
	const freshRow = stmt.get(handle) as { lineage_json: string | null } | undefined;
	return freshRow?.lineage_json ? JSON.parse(freshRow.lineage_json) : null;
}
