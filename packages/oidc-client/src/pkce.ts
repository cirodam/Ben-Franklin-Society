import { randomBytes, createHash } from 'node:crypto';
import type { PKCEChallenge } from './types.js';

/**
 * Generate a cryptographically random code verifier for PKCE
 * @returns base64url-encoded random string
 */
export function generateCodeVerifier(): string {
	return randomBytes(32).toString('base64url');
}

/**
 * Generate S256 code challenge from a code verifier
 * @param verifier - The code verifier
 * @returns base64url-encoded SHA-256 hash of the verifier
 */
export function generateCodeChallenge(verifier: string): string {
	return createHash('sha256').update(verifier).digest('base64url');
}

/**
 * Generate both verifier and challenge for PKCE flow
 * @returns Object with codeVerifier and codeChallenge
 */
export function generatePKCEChallenge(): PKCEChallenge {
	const codeVerifier = generateCodeVerifier();
	const codeChallenge = generateCodeChallenge(codeVerifier);
	return { codeVerifier, codeChallenge };
}
