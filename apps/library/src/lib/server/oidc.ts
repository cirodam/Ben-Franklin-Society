import { OidcClient } from '@bfs/oidc-client';
import { getOidcConfig } from './config.js';

let oidcClient: OidcClient | null = null;

export function getOidcClient(): OidcClient {
	if (!oidcClient) {
		const config = getOidcConfig();
		if (!config.clientSecret) {
			throw new Error('OIDC not configured');
		}
		oidcClient = new OidcClient({
			issuerUrl: config.governanceUrl,
			clientId: config.clientId,
			clientSecret: config.clientSecret,
			redirectUri: config.redirectUri
		});
	}
	return oidcClient;
}

export function resetOidcClient(): void {
	oidcClient = null;
}
