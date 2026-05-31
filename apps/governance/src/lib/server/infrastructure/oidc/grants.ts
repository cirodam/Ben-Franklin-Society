import * as crypto from 'node:crypto';
import { db } from '../../db.js';
import { issueTokens } from './tokens.js';
import type { TokenSet } from './jwt.js';

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
