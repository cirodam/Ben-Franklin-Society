import { db } from './db.js';
import { env } from '$env/dynamic/private';

export function getConfig(key: string): string | null {
	const row = db.prepare('SELECT value FROM config WHERE key = ?').get(key) as
		| { value: string }
		| undefined;
	return row?.value ?? null;
}

export function setConfig(key: string, value: string): void {
	db.prepare('INSERT OR REPLACE INTO config (key, value) VALUES (?, ?)').run(key, value);
}

export function isOidcConfigured(): boolean {
	return !!getConfig('oidc_client_secret');
}

export function getOidcConfig() {
	return {
		governanceUrl: getConfig('oidc_governance_url') ?? env.GOVERNANCE_URL ?? 'http://localhost:5173',
		clientId: getConfig('oidc_client_id') ?? 'library',
		clientSecret: getConfig('oidc_client_secret'),
		redirectUri: getConfig('oidc_redirect_uri') ?? (env.PUBLIC_URL ? `${env.PUBLIC_URL}/oauth/callback` : 'http://localhost:5177/oauth/callback'),
	};
}

export function getIssuerUrl(): string {
	return getConfig('oidc_governance_url') ?? env.GOVERNANCE_URL ?? 'http://localhost:5173';
}

export function setOidcConfig(config: {
	governanceUrl: string;
	clientId: string;
	clientSecret: string;
	redirectUri: string;
}): void {
	setConfig('oidc_governance_url', config.governanceUrl);
	setConfig('oidc_client_id', config.clientId);
	setConfig('oidc_client_secret', config.clientSecret);
	setConfig('oidc_redirect_uri', config.redirectUri);
}
