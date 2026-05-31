import * as crypto from 'node:crypto';
import { db } from '../../db.js';
import { resolvePermissions } from '../../organization/associations.js';
import { getAvailableContexts } from '../auth.js';
import { logAuditEvent } from '../audit.js';
import { signJwt, issuerUrl, ACCESS_TOKEN_TTL_SECS, REFRESH_TOKEN_TTL_DAYS } from './jwt.js';
import type { AccessTokenClaims, IdTokenClaims, TokenSet } from './jwt.js';
import { getClient } from './clients.js';

// ---------------------------------------------------------------------------
// Token issuance
// ---------------------------------------------------------------------------

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
		session_uuid: params.sessionUuid,
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
		contexts: getAvailableContexts(params.personUuid)
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

	// Log token issuance
	logAuditEvent({
		eventType: 'oidc_token_issued',
		actorUuid: params.personUuid,
		actingAsUuid: params.actingAsUuid,
		sessionUuid: params.sessionUuid,
		success: true,
		details: { clientId: params.clientId, scope: params.scope }
	});

	return {
		access_token: signJwt(accessTokenClaims),
		id_token: signJwt(idTokenClaims),
		token_type: 'Bearer',
		expires_in: ACCESS_TOKEN_TTL_SECS,
		refresh_token: refreshToken,
	};
}

/**
 * Issue a service access token for server-to-server authentication
 * Uses client credentials grant (OAuth 2.0)
 */
export function issueServiceToken(params: { clientId: string }): { access_token: string; token_type: 'Bearer'; expires_in: number } {
	// Special case: governance issuing tokens for its own internal use
	if (params.clientId === 'governance-internal') {
		const iat = Math.floor(Date.now() / 1000);
		const exp = iat + 3600;
		const iss = issuerUrl();

		const serviceTokenClaims = {
			iss,
			sub: 'governance', // governance as subject
			aud: iss,
			iat,
			exp,
			jti: crypto.randomUUID(),
			client_id: 'governance-internal',
			client_name: 'Governance Internal Service',
			token_type: 'service',
			scope: 'service',
		};

		return {
			access_token: signJwt(serviceTokenClaims),
			token_type: 'Bearer',
			expires_in: 3600,
		};
	}

	// Regular client credentials flow
	const client = getClient(params.clientId);
	if (!client) throw new Error(`Client not found: ${params.clientId}`);

	const iat = Math.floor(Date.now() / 1000);
	const exp = iat + 3600; // 1 hour for service tokens
	const iss = issuerUrl();

	// Service token claims (no user context)
	const serviceTokenClaims = {
		iss,
		sub: client.uuid, // client UUID as subject
		aud: iss, // audience is the issuer itself
		iat,
		exp,
		jti: crypto.randomUUID(),
		client_id: params.clientId,
		client_name: client.name,
		token_type: 'service', // Mark as service token
		scope: 'service', // Service-level scope
	};

	// Log service token issuance
	logAuditEvent({
		eventType: 'oidc_token_issued',
		actorUuid: client.uuid,
		actingAsUuid: client.uuid,
		sessionUuid: undefined,
		success: true,
		details: { clientId: params.clientId, clientName: client.name, tokenType: 'service' }
	});

	return {
		access_token: signJwt(serviceTokenClaims),
		token_type: 'Bearer',
		expires_in: 3600,
	};
}
