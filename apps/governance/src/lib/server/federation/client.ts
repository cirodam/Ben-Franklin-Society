import { cacheSociety, getSocietyByHandle, type Society } from './societies.js';
import { getIdentity, type FoundingRecord } from './lineage/identity.js';
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
	foundingRecord: FoundingRecord | null;
	endpoint: string;
	serverUrl?: string; // Optional: specify which federation server to register with
}): Promise<{ success: boolean; error?: string }> {
	try {
		const federationEndpoint = (params.serverUrl || getFederationEndpoint()).replace(/\/$/, ''); // Remove trailing slash
		
		console.log('Registering with federation:', federationEndpoint);
		console.log('Endpoint URL:', params.endpoint);
		
		// Build the request body
		const requestBody: any = {};
		
		if (params.foundingRecord) {
			// Child society with founding record
			requestBody.founding_record = params.foundingRecord;
		} else {
			// Root society - need to send identity directly
			const identity = getIdentity();
			if (!identity) {
				return { success: false, error: 'Society identity not initialized' };
			}
			
			// Create a self-founding record for root societies
			requestBody.founding_record = {
				type: 'society_founding',
				parent: {
					handle: identity.handle,
					uuid: identity.uuid,
					public_key: identity.public_key
				},
				child: {
					handle: identity.handle,
					uuid: identity.uuid,
					public_key: identity.public_key
				},
				founded_at: new Date(identity.created_at * 1000).toISOString(),
				parent_attestation: `The ${identity.handle} society is self-founded.`,
				signature: '' // Self-founded societies don't have a parent signature
			};
		}
		
		// Parse the endpoint URL
		try {
			const endpointUrl = new URL(params.endpoint);
			requestBody.url = params.endpoint;
			requestBody.bfs_url = params.endpoint;
			// Note: We don't send ip_address or port - let federation extract from URL
		} catch (e) {
			return { success: false, error: 'Invalid endpoint URL' };
		}
		
		const apiUrl = `${federationEndpoint}/api/registry/society`;
		console.log('Fetching:', apiUrl);
		console.log('Request body:', JSON.stringify(requestBody, null, 2));
		
		const response = await fetch(apiUrl, {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify(requestBody)
		});

		if (!response.ok) {
			const contentType = response.headers.get('content-type');
			let errorMsg = `Registration failed (${response.status})`;
			
			if (contentType?.includes('application/json')) {
				const error = await response.json();
				errorMsg = error.error || errorMsg;
			} else {
				const text = await response.text();
				console.error('Federation returned non-JSON response:', text.substring(0, 500));
				errorMsg = `Server error: ${response.status} ${response.statusText}`;
			}
			
			return { success: false, error: errorMsg };
		}

		const result = await response.json();
		return { success: true };
	} catch (error) {
		console.error('Federation registration error:', error);
		const errorMsg = error instanceof Error ? error.message : 'Failed to connect to Federation';
		return { success: false, error: errorMsg };
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
