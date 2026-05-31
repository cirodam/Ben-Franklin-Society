import * as crypto from 'node:crypto';
import type { KeyObject } from 'node:crypto';

// ---------------------------------------------------------------------------
// Key management
// ---------------------------------------------------------------------------
// Set OIDC_PRIVATE_KEY to a base64-encoded Ed25519 private key PEM.
// If unset, an ephemeral key is generated (tokens invalidated on restart).

export type KeyPair = { privateKey: KeyObject; publicKey: KeyObject; kid: string };
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
// JWT Types
// ---------------------------------------------------------------------------

export interface AccessTokenClaims {
	iss: string;
	sub: string;       // person_uuid
	aud: string;       // client_id
	iat: number;
	exp: number;
	jti: string;
	client_id: string;
	acting_as: string; // association UUID, or same as sub when acting as self
	session_uuid: string; // session UUID for updating context
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
	contexts?: Array<{ uuid: string; type: string; label: string }>;
}

export interface TokenSet {
	access_token: string;
	id_token: string;
	token_type: 'Bearer';
	expires_in: number;
	refresh_token?: string;
}

// ---------------------------------------------------------------------------
// JWT Signing & Verification
// ---------------------------------------------------------------------------

function b64url(input: string | Buffer): string {
	const buf = typeof input === 'string' ? Buffer.from(input) : input;
	return buf.toString('base64url');
}

export function signJwt(payload: object): string {
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

export function issuerUrl(): string {
	return process.env.GOVERNANCE_URL ?? 'http://localhost:5173';
}

export const ACCESS_TOKEN_TTL_SECS = 3600; // 1 hour
export const REFRESH_TOKEN_TTL_DAYS = 30; // 30 days
