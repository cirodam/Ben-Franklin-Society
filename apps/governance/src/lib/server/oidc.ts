import * as crypto from 'node:crypto';
import type { KeyObject } from 'node:crypto';
import { db } from './db.js';
import { resolvePermissions } from './associations.js';

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

export interface TokenSet {
	access_token: string;
	id_token: string;
	token_type: 'Bearer';
	expires_in: number;
}

function issuerUrl(): string {
	return process.env.GOVERNANCE_URL ?? 'http://localhost:5173';
}

export function issueTokens(params: {
	personUuid: string;
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

	return {
		access_token: signJwt(accessTokenClaims),
		id_token: signJwt(idTokenClaims),
		token_type: 'Bearer',
		expires_in: ACCESS_TOKEN_TTL_SECS,
	};
}

// ---------------------------------------------------------------------------
// Authorization code store (in-memory, single-use, 10-minute TTL)
// ---------------------------------------------------------------------------

interface AuthCode {
	clientId: string;
	redirectUri: string;
	personUuid: string;
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
		actingAsUuid: entry.actingAsUuid,
		clientId: entry.clientId,
		scope: entry.scope,
	});
}

// ---------------------------------------------------------------------------
// Client registry
// ---------------------------------------------------------------------------
// Set OIDC_CLIENTS to a JSON array:
// [{"client_id":"community-bank","client_secret":"s3cr3t","redirect_uris":["https://…/oauth/callback"]}]
// client_secret may be omitted for public clients (PKCE-only).

interface OidcClient {
	clientId: string;
	clientSecret: string | null;
	redirectUris: string[];
}

let _clients: Map<string, OidcClient> | null = null;

function loadClients(): Map<string, OidcClient> {
	const map = new Map<string, OidcClient>();
	const raw = process.env.OIDC_CLIENTS;
	if (!raw) return map;
	const parsed = JSON.parse(raw) as Array<{
		client_id: string;
		client_secret?: string;
		redirect_uris: string[];
	}>;
	for (const c of parsed) {
		map.set(c.client_id, {
			clientId: c.client_id,
			clientSecret: c.client_secret ?? null,
			redirectUris: c.redirect_uris,
		});
	}
	return map;
}

export function getClient(clientId: string): OidcClient | null {
	if (!_clients) _clients = loadClients();
	return _clients.get(clientId) ?? null;
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

