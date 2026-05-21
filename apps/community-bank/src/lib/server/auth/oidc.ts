import { OidcClient } from '@bfs/oidc-client';
import { getOidcConfig } from '../config.js';

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
