import { db } from './db.js';

/**
 * Get a configuration value from the database
 */
export function getConfig(key: string): string | null {
	const row = db.prepare('SELECT value FROM config WHERE key = ?').get(key) as { value: string } | undefined;
	return row?.value ?? null;
}

/**
 * Set a configuration value in the database
 */
export function setConfig(key: string, value: string): void {
	db.prepare('INSERT OR REPLACE INTO config (key, value) VALUES (?, ?)').run(key, value);
}

/**
 * Check if OIDC is fully configured
 */
export function isOidcConfigured(): boolean {
	return !!getConfig('oidc:client_secret');
}

/**
 * Get all OIDC configuration values
 */
export function getOidcConfig() {
	return {
		governanceUrl: getConfig('oidc:governance_url') ?? 'http://localhost:5173',
		clientId: getConfig('oidc:client_id') ?? 'community-bank',
		clientSecret: getConfig('oidc:client_secret'),
		redirectUri: getConfig('oidc:redirect_uri') ?? 'http://localhost:5174/oauth/callback',
	};
}

/**
 * Save OIDC configuration to database
 */
export function setOidcConfig(config: {
	governanceUrl: string;
	clientId: string;
	clientSecret: string;
	redirectUri: string;
}): void {
	setConfig('oidc:governance_url', config.governanceUrl);
	setConfig('oidc:client_id', config.clientId);
	setConfig('oidc:client_secret', config.clientSecret);
	setConfig('oidc:redirect_uri', config.redirectUri);
}
