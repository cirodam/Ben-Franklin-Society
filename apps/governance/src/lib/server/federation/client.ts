import { cacheSociety, getSocietyByHandle, type Society } from './societies.js';
import type { FoundingRecord } from './lineage/identity.js';
import { db } from '../db.js';
import { getPrimaryFederationServer, updateFederationServerContact } from './servers.js';

/**
 * Get the federation endpoint from the database or fall back to environment/default
 */
function getFederationEndpoint(): string {
	const primaryServer = getPrimaryFederationServer();
	if (primaryServer) {
		return primaryServer.url;
	}
	// Fallback to environment variable or localhost default
	return process.env.FEDERATION_ENDPOINT || 'http://localhost:5180';
}

/**
 * Register this society or a child society with the Federation
 */
export async function registerWithFederation(params: {
	foundingRecord: FoundingRecord;
	endpoint: string;
}): Promise<{ success: boolean; error?: string }> {
	try {
		const federationEndpoint = getFederationEndpoint();
		const response = await fetch(`${federationEndpoint}/api/registry/society`, {
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
		const federationEndpoint = getFederationEndpoint();
		const response = await fetch(`${federationEndpoint}/api/registry/society/${handle}`);

		if (!response.ok) {
			return null;
		}

		const data = await response.json();

		// Cache locally
		cacheSociety({
			uuid: data.uuid,
			handle: data.handle,
			url: data.endpoint,  // Federation returns 'endpoint', store as 'url'
			publicKey: data.public_key,
			lineageJson: data.lineage ? JSON.stringify(data.lineage) : null
		});

		return getSocietyByHandle(handle);
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
		const federationEndpoint = getFederationEndpoint();
		const response = await fetch(`${federationEndpoint}/api/registry/societies?limit=50`);

		if (!response.ok) {
			return [];
		}

		const data = await response.json();

		// Cache all results
		for (const society of data.societies) {
			cacheSociety({
				uuid: society.uuid,
				handle: society.handle,
				url: society.endpoint,
				publicKey: society.public_key
			});
		}

		return data.societies.map((s: any) => getSocietyByHandle(s.handle)).filter(Boolean) as Society[];
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

		const federationEndpoint = getFederationEndpoint();

		while (true) {
			const response = await fetch(`${federationEndpoint}/api/registry/societies?page=${page}&limit=100`);

			if (!response.ok) {
				break;
			}

			const data = await response.json();

			for (const society of data.societies) {
				cacheSociety({
					uuid: society.uuid,
					handle: society.handle,
					url: society.endpoint,
					publicKey: society.public_key
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
