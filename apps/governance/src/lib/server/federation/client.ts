import { db } from '../db.js';
import type { FoundingRecord } from '../lineage/identity.js';

export interface Society {
	handle: string;
	uuid: string;
	endpoint: string;
	public_key: string;
	lineage_json: string | null;
	last_lineage_verified: number | null;
	latitude: number | null;
	longitude: number | null;
	last_interaction: number | null;
	interaction_count: number;
	discovered_at: number;
}

// Federation endpoint (configured via environment or default)
const FEDERATION_ENDPOINT = process.env.FEDERATION_ENDPOINT || 'http://localhost:5178';

/**
 * Register this society or a child society with the Federation
 */
export async function registerWithFederation(params: {
	foundingRecord: FoundingRecord;
	endpoint: string;
}): Promise<{ success: boolean; error?: string }> {
	try {
		const response = await fetch(`${FEDERATION_ENDPOINT}/api/registry/society`, {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({
				founding_record: params.foundingRecord,
				endpoint: params.endpoint
			})
		});

		if (!response.ok) {
			const error = await response.json();
			return { success: false, error: error.error || 'Registration failed' };
		}

		const result = await response.json();
		return { success: true };
	} catch (error) {
		console.error('Federation registration error:', error);
		return { success: false, error: 'Failed to connect to Federation' };
	}
}

/**
 * Look up a society in the Federation and cache locally
 */
export async function lookupInFederation(handle: string): Promise<Society | null> {
	try {
		const response = await fetch(`${FEDERATION_ENDPOINT}/api/registry/society/${handle}`);

		if (!response.ok) {
			return null;
		}

		const data = await response.json();

		// Cache locally
		cacheSociety({
			handle: data.handle,
			uuid: data.uuid,
			endpoint: data.endpoint,
			publicKey: data.public_key,
			lineage: data.lineage || []
		});

		return getSocietyFromCache(handle);
	} catch (error) {
		console.error('Federation lookup error:', error);
		return null;
	}
}

/**
 * Search for societies in Federation
 */
export async function searchSocieties(query: string): Promise<Society[]> {
	try {
		const response = await fetch(`${FEDERATION_ENDPOINT}/api/registry/societies?limit=50`);

		if (!response.ok) {
			return [];
		}

		const data = await response.json();

		// Cache all results
		for (const society of data.societies) {
			cacheSociety({
				handle: society.handle,
				uuid: society.uuid,
				endpoint: society.endpoint,
				publicKey: society.public_key,
				lineage: []
			});
		}

		return data.societies.map((s: any) => getSocietyFromCache(s.handle)).filter(Boolean) as Society[];
	} catch (error) {
		console.error('Federation search error:', error);
		return [];
	}
}

/**
 * Sync all societies from Federation (background task)
 */
export async function syncFromFederation(): Promise<number> {
	try {
		let page = 1;
		let totalSynced = 0;

		while (true) {
			const response = await fetch(`${FEDERATION_ENDPOINT}/api/registry/societies?page=${page}&limit=100`);

			if (!response.ok) {
				break;
			}

			const data = await response.json();

			for (const society of data.societies) {
				cacheSociety({
					handle: society.handle,
					uuid: society.uuid,
					endpoint: society.endpoint,
					publicKey: society.public_key,
					lineage: []
				});
				totalSynced++;
			}

			// Check if there are more pages
			if (data.societies.length < 100 || totalSynced >= data.total) {
				break;
			}

			page++;
		}

		return totalSynced;
	} catch (error) {
		console.error('Federation sync error:', error);
		return 0;
	}
}

/**
 * Cache a society locally in our societies table
 */
export function cacheSociety(params: {
	handle: string;
	uuid: string;
	endpoint: string;
	publicKey: string;
	lineage: string[];
	latitude?: number;
	longitude?: number;
}): void {
	const stmt = db.prepare(/* sql */ `
		INSERT INTO societies (
			handle,
			uuid,
			endpoint,
			public_key,
			lineage_json,
			last_lineage_verified,
			latitude,
			longitude
		) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
		ON CONFLICT(handle) DO UPDATE SET
			uuid = excluded.uuid,
			endpoint = excluded.endpoint,
			public_key = excluded.public_key,
			lineage_json = excluded.lineage_json,
			last_lineage_verified = excluded.last_lineage_verified,
			latitude = excluded.latitude,
			longitude = excluded.longitude
	`);

	const now = Math.floor(Date.now() / 1000);

	stmt.run(
		params.handle,
		params.uuid,
		params.endpoint,
		params.publicKey,
		params.lineage.length > 0 ? JSON.stringify(params.lineage) : null,
		now,
		params.latitude || null,
		params.longitude || null
	);
}

/**
 * Get a society from our local cache
 */
export function getSocietyFromCache(handle: string): Society | null {
	const stmt = db.prepare(/* sql */ `
		SELECT 
			handle,
			uuid,
			endpoint,
			public_key,
			lineage_json,
			last_lineage_verified,
			latitude,
			longitude,
			last_interaction,
			interaction_count,
			discovered_at
		FROM societies
		WHERE handle = ?
	`);

	return stmt.get(handle) as Society | null;
}

/**
 * List societies from cache, sorted by distance or interaction
 */
export function listCachedSocieties(params: {
	sort?: 'distance' | 'interaction';
	latitude?: number;
	longitude?: number;
	limit?: number;
}): Society[] {
	const { sort = 'interaction', limit = 50 } = params;

	let query = 'SELECT * FROM societies WHERE 1=1';

	if (sort === 'interaction') {
		query += ' ORDER BY interaction_count DESC, last_interaction DESC';
	} else if (sort === 'distance' && params.latitude && params.longitude) {
		// Simple distance calculation (for proper implementation, use Haversine formula)
		query += ` ORDER BY 
			((latitude - ?) * (latitude - ?)) + 
			((longitude - ?) * (longitude - ?))
		`;
	}

	query += ' LIMIT ?';

	const stmt = db.prepare(query);

	if (sort === 'distance' && params.latitude && params.longitude) {
		return stmt.all(params.latitude, params.latitude, params.longitude, params.longitude, limit) as Society[];
	} else {
		return stmt.all(limit) as Society[];
	}
}

/**
 * Record an interaction with a society (updates interaction tracking)
 */
export function recordInteraction(handle: string): void {
	const stmt = db.prepare(/* sql */ `
		UPDATE societies
		SET 
			last_interaction = ?,
			interaction_count = interaction_count + 1
		WHERE handle = ?
	`);

	const now = Math.floor(Date.now() / 1000);
	stmt.run(now, handle);
}
