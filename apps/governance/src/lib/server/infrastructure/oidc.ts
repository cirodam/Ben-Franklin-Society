import * as crypto from 'node:crypto';
import type { KeyObject } from 'node:crypto';
import { db } from '../db.js';
import { resolvePermissions } from '../organization/associations.js';

// ---------------------------------------------------------------------------
// Key management
// ---------------------------------------------------------------------------
// Set OIDC_PRIVATE_KEY to a base64-encoded Ed25519 private key PEM.
// If unset, an ephemeral key is generated (tokens invalidated on restart).

type KeyPair = { privateKey: KeyObject; publicKey: KeyObject; kid: string };
let _keyPair: KeyPair | null = null;

function computeKid(publicKey: KeyObject): string {
	const jwk = publicKey.export({ format: 'jwk' }) as { crv: string; kty: string; x: string };
	const thumb = JSON.stringify({ crv: jwk.crv, kty: jwk.kty, x: jwk.x });
	return crypto.createHash('sha256').update(thumb).digest('base64url').slice(0, 16);
}

function loadOrGenerateKeyPair(): KeyPair {
	const envKey = process.env.OIDC_PRIVATE_KEY;
	if (envKey) {
		const privateKey = crypto.createPrivateKey({ key: Buffer.from(envKey, 'base64'), format: 'pem' });
		const publicKey = crypto.createPublicKey(privateKey);
		return { privateKey, publicKey, kid: computeKid(publicKey) };
	}
	if (process.env.NODE_ENV === 'production') {
		console.warn('[oidc] OIDC_PRIVATE_KEY not set — using ephemeral key. Tokens will not survive a restart.');
	}
	const { privateKey, publicKey } = crypto.generateKeyPairSync('ed25519');
	return { privateKey, publicKey, kid: computeKid(publicKey) };
}

export function getKeyPair(): KeyPair {
	if (!_keyPair) _keyPair = loadOrGenerateKeyPair();
	return _keyPair;
}

// ---------------------------------------------------------------------------
// JWKS
// ---------------------------------------------------------------------------

export function getJwks(): { keys: object[] } {
	const { publicKey, kid } = getKeyPair();
	const jwk = publicKey.export({ format: 'jwk' });
	return { keys: [{ ...jwk, use: 'sig', alg: 'EdDSA', kid }] };
}

// ---------------------------------------------------------------------------
// JWT
// ---------------------------------------------------------------------------

function b64url(input: string | Buffer): string {
	const buf = typeof input === 'string' ? Buffer.from(input) : input;
	return buf.toString('base64url');
}

export interface AccessTokenClaims {
	iss: string;
	sub: string;       // person_uuid
	aud: string;       // client_id
	iat: number;
	exp: number;
	jti: string;
	client_id: string;
	acting_as: string; // association UUID, or same as sub when acting as self
	permissions: Array<{ app: string; permission: string }>;
	scope: string;
}

export interface IdTokenClaims {
	iss: string;
	sub: string;
	aud: string;
	iat: number;
	exp: number;
	handle: string;
	given_name: string;
	family_name: string;
	acting_as: string;
}

function signJwt(payload: object): string {
	const { privateKey, kid } = getKeyPair();
	const header = b64url(JSON.stringify({ alg: 'EdDSA', typ: 'JWT', kid }));
	const body = b64url(JSON.stringify(payload));
	const signingInput = `${header}.${body}`;
	const sig = crypto.sign(null, Buffer.from(signingInput), privateKey).toString('base64url');
	return `${signingInput}.${sig}`;
}

export function verifyAccessToken(token: string): AccessTokenClaims | null {
	try {
		const parts = token.split('.');
		if (parts.length !== 3) return null;
		const { publicKey } = getKeyPair();
		const signingInput = `${parts[0]}.${parts[1]}`;
		const sig = Buffer.from(parts[2], 'base64url');
		const valid = crypto.verify(null, Buffer.from(signingInput), publicKey, sig);
		if (!valid) return null;
		const claims = JSON.parse(Buffer.from(parts[1], 'base64url').toString()) as AccessTokenClaims;
		if (claims.exp < Math.floor(Date.now() / 1000)) return null;
		return claims;
	} catch {
		return null;
	}
}

// ---------------------------------------------------------------------------
// Token issuance
// ---------------------------------------------------------------------------

const ACCESS_TOKEN_TTL_SECS = 3600; // 1 hour
const REFRESH_TOKEN_TTL_DAYS = 30; // 30 days

export interface TokenSet {
	access_token: string;
	id_token: string;
	token_type: 'Bearer';
	expires_in: number;
	refresh_token?: string;
}

function issuerUrl(): string {
	return process.env.GOVERNANCE_URL ?? 'http://localhost:5173';
}

export function issueTokens(params: {
	personUuid: string;
	sessionUuid: string;
	actingAsUuid: string;
	clientId: string;
	scope: string;
}): TokenSet {
	const person = db
		.prepare('SELECT handle, given_name, family_name FROM person WHERE uuid = ?')
		.get(params.personUuid) as { handle: string; given_name: string; family_name: string } | undefined;
	if (!person) throw new Error(`Person not found: ${params.personUuid}`);

	// If acting as an association, use the association's handle for display
	let actingHandle = person.handle;
	if (params.actingAsUuid !== params.personUuid) {
		const assoc = db
			.prepare('SELECT handle FROM association WHERE uuid = ?')
			.get(params.actingAsUuid) as { handle: string } | undefined;
		if (assoc) actingHandle = assoc.handle;
	}

	const permissions = resolvePermissions(params.personUuid, params.actingAsUuid);
	const iat = Math.floor(Date.now() / 1000);
	const exp = iat + ACCESS_TOKEN_TTL_SECS;
	const iss = issuerUrl();

	const accessTokenClaims: AccessTokenClaims = {
		iss,
		sub: params.personUuid,
		aud: params.clientId,
		iat,
		exp,
		jti: crypto.randomUUID(),
		client_id: params.clientId,
		acting_as: params.actingAsUuid,
		permissions: permissions.map((p) => ({ app: p.app, permission: p.permission })),
		scope: params.scope,
	};

	const idTokenClaims: IdTokenClaims = {
		iss,
		sub: params.personUuid,
		aud: params.clientId,
		iat,
		exp,
		handle: actingHandle,
		given_name: person.given_name,
		family_name: person.family_name,
		acting_as: params.actingAsUuid,
	};

	// Create refresh token
	const refreshToken = crypto.randomBytes(32).toString('base64url');
	const refreshTokenHash = crypto.createHash('sha256').update(refreshToken).digest('hex');
	const refreshExpiresAt = new Date(Date.now() + REFRESH_TOKEN_TTL_DAYS * 24 * 60 * 60 * 1000).toISOString();

	// Store refresh token in database
	db.prepare(
		`INSERT INTO oidc_refresh_token (token_hash, client_id, person_uuid, session_uuid, acting_as_uuid, scope, issued_at, expires_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
	).run(
		refreshTokenHash,
		params.clientId,
		params.personUuid,
		params.sessionUuid,
		params.actingAsUuid,
		params.scope,
		new Date().toISOString(),
		refreshExpiresAt
	);

	return {
		access_token: signJwt(accessTokenClaims),
		id_token: signJwt(idTokenClaims),
		token_type: 'Bearer',
		expires_in: ACCESS_TOKEN_TTL_SECS,
		refresh_token: refreshToken,
	};
}

// ---------------------------------------------------------------------------
// Authorization code store (in-memory, single-use, 10-minute TTL)
// ---------------------------------------------------------------------------

interface AuthCode {
	clientId: string;
	redirectUri: string;
	personUuid: string;
	sessionUuid: string;
	actingAsUuid: string;
	scope: string;
	codeChallenge: string; // S256 PKCE
	expiresAt: number;     // ms since epoch
}

const authCodes = new Map<string, AuthCode>();

function pruneExpiredCodes(): void {
	const t = Date.now();
	for (const [code, entry] of authCodes) {
		if (entry.expiresAt < t) authCodes.delete(code);
	}
}

export function createAuthCode(params: {
	clientId: string;
	redirectUri: string;
	personUuid: string;
	sessionUuid: string;
	actingAsUuid: string;
	scope: string;
	codeChallenge: string;
}): string {
	pruneExpiredCodes();
	const code = crypto.randomBytes(32).toString('base64url');
	authCodes.set(code, { ...params, expiresAt: Date.now() + 10 * 60 * 1000 });
	return code;
}

export function exchangeAuthCode(params: {
	code: string;
	codeVerifier: string;
	clientId: string;
	redirectUri: string;
}): TokenSet {
	const entry = authCodes.get(params.code);
	authCodes.delete(params.code); // single-use regardless of outcome

	if (!entry) throw new Error('Invalid or expired authorization code');
	if (entry.expiresAt < Date.now()) throw new Error('Authorization code expired');
	if (entry.clientId !== params.clientId) throw new Error('client_id mismatch');
	if (entry.redirectUri !== params.redirectUri) throw new Error('redirect_uri mismatch');

	// PKCE S256 verification
	const expected = crypto
		.createHash('sha256')
		.update(params.codeVerifier)
		.digest('base64url');
	if (expected !== entry.codeChallenge) throw new Error('PKCE verification failed');

	return issueTokens({
		personUuid: entry.personUuid,
		sessionUuid: entry.sessionUuid,
		actingAsUuid: entry.actingAsUuid,
		clientId: entry.clientId,
		scope: entry.scope,
	});
}

export function exchangeRefreshToken(params: {
	refreshToken: string;
	clientId: string;
}): TokenSet {
	// Hash the refresh token to look it up
	const tokenHash = crypto.createHash('sha256').update(params.refreshToken).digest('hex');
	const now = new Date().toISOString();

	// Look up the refresh token and join with session to get current acting_as
	const tokenRow = db
		.prepare(
			`SELECT 
				rt.client_id, 
				rt.person_uuid, 
				rt.session_uuid,
				rt.scope,
				s.acting_as_uuid
       FROM oidc_refresh_token rt
       JOIN session s ON s.uuid = rt.session_uuid
       WHERE rt.token_hash = ?
         AND rt.client_id = ?
         AND rt.expires_at > ?
         AND rt.revoked_at IS NULL
         AND s.revoked_at IS NULL
         AND s.expires_at > ?`
		)
		.get(tokenHash, params.clientId, now, now) as
		| {
				client_id: string;
				person_uuid: string;
				session_uuid: string;
				acting_as_uuid: string;
				scope: string;
		  }
		| undefined;

	if (!tokenRow) {
		throw new Error('Invalid or expired refresh token');
	}

	// Revoke the old refresh token (rotation)
	db.prepare('UPDATE oidc_refresh_token SET revoked_at = ? WHERE token_hash = ?').run(
		now,
		tokenHash
	);

	// Issue new tokens (including a new refresh token)
	// Use the current acting_as_uuid from the session, not the stored one
	return issueTokens({
		personUuid: tokenRow.person_uuid,
		sessionUuid: tokenRow.session_uuid,
		actingAsUuid: tokenRow.acting_as_uuid,
		clientId: tokenRow.client_id,
		scope: tokenRow.scope,
	});
}

// ---------------------------------------------------------------------------
// Client registry
// ---------------------------------------------------------------------------
// OIDC clients are now stored in the database for dynamic registration.
// For backward compatibility, OIDC_CLIENTS env var is loaded on startup.

interface OidcClient {
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

