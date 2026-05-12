import { createPublicKey, verify as cryptoVerify } from 'node:crypto';
import type { AccessTokenClaims, IdTokenClaims } from './types.js';

/**
 * JWKS (JSON Web Key Set) from the issuer
 */
interface JWK {
	kty: string;
	crv: string;
	x: string;
	use?: string;
	alg?: string;
	kid?: string;
	[key: string]: unknown; // Index signature for JsonWebKey compatibility
}

interface JWKS {
	keys: JWK[];
}

/**
 * Fetch and cache the JWKS from the issuer
 */
let cachedJwks: JWKS | null = null;
let jwksExpiry = 0;

async function fetchJWKS(issuerUrl: string): Promise<JWKS> {
	const now = Date.now();
	if (cachedJwks && now < jwksExpiry) {
		return cachedJwks;
	}

	const response = await fetch(`${issuerUrl}/oauth/jwks`);
	if (!response.ok) {
		throw new Error(`Failed to fetch JWKS: ${response.status}`);
	}

	cachedJwks = (await response.json()) as JWKS;
	jwksExpiry = now + 3600000; // Cache for 1 hour
	return cachedJwks;
}

/**
 * Decode a JWT without verification (for getting kid from header)
 */
function decodeJWT(token: string): { header: any; payload: any; signature: string } {
	const parts = token.split('.');
	if (parts.length !== 3) {
		throw new Error('Invalid JWT format');
	}

	return {
		header: JSON.parse(Buffer.from(parts[0], 'base64url').toString()),
		payload: JSON.parse(Buffer.from(parts[1], 'base64url').toString()),
		signature: parts[2],
	};
}

/**
 * Verify a JWT signature using JWKS
 */
export async function verifyJWT(
	token: string,
	issuerUrl: string
): Promise<AccessTokenClaims | IdTokenClaims | null> {
	try {
		const { header, payload } = decodeJWT(token);

		// Check algorithm
		if (header.alg !== 'EdDSA') {
			throw new Error('Unsupported algorithm');
		}

		// Fetch JWKS and find matching key
		const jwks = await fetchJWKS(issuerUrl);
		const jwk = jwks.keys.find((k) => k.kid === header.kid);
		if (!jwk) {
			throw new Error('Key not found in JWKS');
		}

		// Convert JWK to public key
		const publicKey = createPublicKey({ key: jwk, format: 'jwk' });

		// Verify signature
		const parts = token.split('.');
		const signingInput = `${parts[0]}.${parts[1]}`;
		const signature = Buffer.from(parts[2], 'base64url');
		const isValid = cryptoVerify(null, Buffer.from(signingInput), publicKey, signature);

		if (!isValid) {
			return null;
		}

		// Check expiry
		if (payload.exp < Math.floor(Date.now() / 1000)) {
			return null;
		}

		return payload as AccessTokenClaims | IdTokenClaims;
	} catch {
		return null;
	}
}

/**
 * Verify an access token and return its claims
 */
export async function verifyAccessToken(
	accessToken: string,
	issuerUrl: string
): Promise<AccessTokenClaims | null> {
	const claims = await verifyJWT(accessToken, issuerUrl);
	if (!claims || !('permissions' in claims)) {
		return null;
	}
	return claims as AccessTokenClaims;
}

/**
 * Verify an ID token and return its claims
 */
export async function verifyIdToken(
	idToken: string,
	issuerUrl: string
): Promise<IdTokenClaims | null> {
	const claims = await verifyJWT(idToken, issuerUrl);
	if (!claims || !('handle' in claims)) {
		return null;
	}
	return claims as IdTokenClaims;
}

/**
 * Check if a token is expired
 */
export function isTokenExpired(claims: AccessTokenClaims | IdTokenClaims): boolean {
	return claims.exp < Math.floor(Date.now() / 1000);
}
