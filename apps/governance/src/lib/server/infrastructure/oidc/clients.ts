import * as crypto from 'node:crypto';
import { db } from '../../db.js';
import { issuerUrl } from './jwt.js';

// ---------------------------------------------------------------------------
// Client registry
// ---------------------------------------------------------------------------
// OIDC clients are now stored in the database for dynamic registration.
// For backward compatibility, OIDC_CLIENTS env var is loaded on startup.

export interface OidcClient {
	uuid: string;
	clientId: string;
	clientSecretHash: string | null;
	name: string;
	redirectUris: string[];
	createdAt: string;
	createdBy: string;
}

interface OidcClientRow {
	uuid: string;
	client_id: string;
	client_secret_hash: string | null;
	name: string;
	redirect_uris: string;
	created_at: string;
	created_by: string;
}

function hashClientSecret(secret: string): string {
	return crypto.createHash('sha256').update(secret).digest('hex');
}

// Load clients from env var on first run (for backward compatibility)
function loadClientsFromEnv(): void {
	const raw = process.env.OIDC_CLIENTS;
	if (!raw) return;
	
	const parsed = JSON.parse(raw) as Array<{
		client_id: string;
		client_secret?: string;
		redirect_uris: string[];
		name?: string;
	}>;
	
	for (const c of parsed) {
		const existing = db.prepare('SELECT 1 FROM oidc_client WHERE client_id = ?').get(c.client_id);
		if (existing) continue; // Don't overwrite existing clients
		
		const uuid = crypto.randomUUID();
		const secretHash = c.client_secret ? hashClientSecret(c.client_secret) : null;
		
		db.prepare(
			`INSERT INTO oidc_client (uuid, client_id, client_secret_hash, name, redirect_uris, created_at, created_by)
			 VALUES (?, ?, ?, ?, ?, ?, ?)`
		).run(
			uuid,
			c.client_id,
			secretHash,
			c.name ?? c.client_id,
			JSON.stringify(c.redirect_uris),
			new Date().toISOString(),
			'system' // Created by system during env var migration
		);
	}
}

// Run env import once on module load
if (process.env.OIDC_CLIENTS) {
	try {
		loadClientsFromEnv();
	} catch (err) {
		console.error('[oidc] Failed to import clients from env:', err);
	}
}

export function createClient(params: {
	name: string;
	redirectUris: string[];
	createdBy: string;
	clientId?: string; // Optional: for special clients like 'community-bank'
}): { clientId: string; clientSecret: string } {
	const uuid = crypto.randomUUID();
	const clientId = params.clientId ?? crypto.randomBytes(16).toString('base64url');
	const clientSecret = crypto.randomBytes(32).toString('base64url');
	const clientSecretHash = hashClientSecret(clientSecret);
	
	// Check if client ID already exists
	const existing = db.prepare('SELECT 1 FROM oidc_client WHERE client_id = ?').get(clientId);
	if (existing) {
		throw new Error(`Client with ID '${clientId}' already exists`);
	}
	
	db.prepare(
		`INSERT INTO oidc_client (uuid, client_id, client_secret_hash, name, redirect_uris, created_at, created_by)
		 VALUES (?, ?, ?, ?, ?, ?, ?)`
	).run(
		uuid,
		clientId,
		clientSecretHash,
		params.name,
		JSON.stringify(params.redirectUris),
		new Date().toISOString(),
		params.createdBy
	);
	
	return { clientId, clientSecret };
}

export function listClients(): OidcClient[] {
	const rows = db.prepare('SELECT * FROM oidc_client ORDER BY created_at DESC').all() as OidcClientRow[];
	return rows.map(row => ({
		uuid: row.uuid,
		clientId: row.client_id,
		clientSecretHash: row.client_secret_hash,
		name: row.name,
		redirectUris: JSON.parse(row.redirect_uris),
		createdAt: row.created_at,
		createdBy: row.created_by,
	}));
}

export function getClient(clientId: string): OidcClient | null {
	const row = db
		.prepare('SELECT * FROM oidc_client WHERE client_id = ?')
		.get(clientId) as OidcClientRow | undefined;
	
	if (!row) return null;
	
	return {
		uuid: row.uuid,
		clientId: row.client_id,
		clientSecretHash: row.client_secret_hash,
		name: row.name,
		redirectUris: JSON.parse(row.redirect_uris),
		createdAt: row.created_at,
		createdBy: row.created_by,
	};
}

export function getClientByUuid(uuid: string): OidcClient | null {
	const row = db
		.prepare('SELECT * FROM oidc_client WHERE uuid = ?')
		.get(uuid) as OidcClientRow | undefined;
	
	if (!row) return null;
	
	return {
		uuid: row.uuid,
		clientId: row.client_id,
		clientSecretHash: row.client_secret_hash,
		name: row.name,
		redirectUris: JSON.parse(row.redirect_uris),
		createdAt: row.created_at,
		createdBy: row.created_by,
	};
}

export function updateClientRedirectUris(clientId: string, redirectUris: string[]): void {
	db.prepare('UPDATE oidc_client SET redirect_uris = ? WHERE client_id = ?')
		.run(JSON.stringify(redirectUris), clientId);
}

export function deleteClient(clientId: string): void {
	// Delete associated refresh tokens first to avoid foreign key constraint violation
	db.prepare('DELETE FROM oidc_refresh_token WHERE client_id = ?').run(clientId);
	db.prepare('DELETE FROM oidc_client WHERE client_id = ?').run(clientId);
}

export function verifyClientSecret(clientId: string, clientSecret: string): boolean {
	const client = getClient(clientId);
	if (!client || !client.clientSecretHash) return false;
	const hash = hashClientSecret(clientSecret);
	return hash === client.clientSecretHash;
}

export function validateRedirectUri(clientId: string, redirectUri: string): boolean {
	const client = getClient(clientId);
	return client?.redirectUris.includes(redirectUri) ?? false;
}

// ---------------------------------------------------------------------------
// Discovery document
// ---------------------------------------------------------------------------

export function getDiscoveryDocument(): object {
	const iss = issuerUrl();
	return {
		issuer: iss,
		authorization_endpoint: `${iss}/oauth/authorize`,
		token_endpoint: `${iss}/oauth/token`,
		userinfo_endpoint: `${iss}/oauth/userinfo`,
		jwks_uri: `${iss}/oauth/jwks`,
		response_types_supported: ['code'],
		grant_types_supported: ['authorization_code'],
		subject_types_supported: ['public'],
		id_token_signing_alg_values_supported: ['EdDSA'],
		code_challenge_methods_supported: ['S256'],
		scopes_supported: ['openid', 'profile'],
	};
}
