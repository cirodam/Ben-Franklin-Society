import { OidcClient } from '@bfs/oidc-client';
import { getOidcConfig } from './config.js';

interface Principal {
	uuid: string;
	handle: string;
	type: 'person' | 'association';
	given_name?: string;
	family_name?: string;
	name?: string;
}

let _oidcClient: OidcClient | null = null;
let _lastConfigHash: string | null = null;

function getConfigHash(config: ReturnType<typeof getOidcConfig>): string {
	return `${config.governanceUrl}|${config.clientId}|${config.clientSecret}|${config.redirectUri}`;
}

/**
 * Get the OIDC client instance, creating it from DB config if needed.
 * This allows the config to be updated without restarting the server.
 */
export function getOidcClient(): OidcClient {
	const config = getOidcConfig();
	
	if (!config.clientSecret) {
		throw new Error('OIDC client secret not configured');
	}
	
	if (!config.governanceUrl) {
		throw new Error('OIDC governance URL not configured');
	}
	
	if (!config.clientId) {
		throw new Error('OIDC client ID not configured');
	}
	
	if (!config.redirectUri) {
		throw new Error('OIDC redirect URI not configured');
	}
	
	// Recreate client only if config has changed
	const configHash = getConfigHash(config);
	if (!_oidcClient || _lastConfigHash !== configHash) {
		_oidcClient = new OidcClient({
			issuerUrl: config.governanceUrl,
			clientId: config.clientId,
			clientSecret: config.clientSecret,
			redirectUri: config.redirectUri,
		});
		_lastConfigHash = configHash;
	}
	
	return _oidcClient;
}

/**
 * Look up a principal (person or association) by handle from governance API
 */
export async function getPrincipalByHandle(handle: string): Promise<Principal | null> {
	const config = getOidcConfig();
	
	if (!config.governanceUrl) {
		throw new Error('OIDC governance URL not configured');
	}
	
	try {
		const response = await fetch(`${config.governanceUrl}/api/principals?q=${encodeURIComponent(handle)}&limit=1`);
		
		if (!response.ok) {
			return null;
		}
		
		const data = await response.json();
		const results = data.results || [];
		
		// Find exact handle match
		const match = results.find((p: Principal) => p.handle === handle);
		return match || null;
	} catch (error) {
		console.error('Error fetching principal:', error);
		return null;
	}
}
