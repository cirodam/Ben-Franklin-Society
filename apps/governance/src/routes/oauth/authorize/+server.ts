import { redirect, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types.js';
import { getClient, validateRedirectUri } from '$lib/server/infrastructure/oidc/clients.js';
import { createAuthCode } from '$lib/server/infrastructure/oidc/grants.js';
import { getClientIp } from '$lib/server/infrastructure/auth.js';
import { checkRateLimit, RATE_LIMITS } from '$lib/server/infrastructure/rate-limiter.js';
import { logAuditEvent } from '$lib/server/infrastructure/audit.js';

export const GET: RequestHandler = async ({ url, locals, request }) => {
	// Rate limit by IP
	const ip = getClientIp(request);
	const rateLimitKey = `oidc_authorize:${ip}`;
	const rateLimit = checkRateLimit(rateLimitKey, RATE_LIMITS.OIDC_AUTHORIZE);
	
	if (!rateLimit.allowed) {
		// Log rate limit exceeded
		logAuditEvent({
			eventType: 'rate_limit_exceeded',
			ipAddress: ip,
			success: false,
			details: { endpoint: 'oauth/authorize' }
		});
		error(429, 'Too many requests');
	}

	const responseType = url.searchParams.get('response_type');
	const clientId = url.searchParams.get('client_id');
	const redirectUri = url.searchParams.get('redirect_uri');
	const codeChallenge = url.searchParams.get('code_challenge');
	const codeChallengeMethod = url.searchParams.get('code_challenge_method');
	const scope = url.searchParams.get('scope') ?? 'openid';
	const state = url.searchParams.get('state');

	if (responseType !== 'code') error(400, 'Unsupported response_type');
	if (!clientId || !redirectUri || !codeChallenge) error(400, 'Missing required parameters');
	if (codeChallengeMethod !== 'S256') error(400, 'Only S256 code_challenge_method is supported');

	const client = getClient(clientId);
	if (!client) error(400, 'Unknown client_id');
	if (!validateRedirectUri(clientId, redirectUri)) error(400, 'Invalid redirect_uri');

	if (!locals.session || !locals.person) {
		const next = encodeURIComponent(url.pathname + url.search);
		redirect(302, `/login?next=${next}`);
	}

	const code = createAuthCode({
		clientId,
		redirectUri,
		personUuid: locals.person.uuid,
		sessionUuid: locals.session.uuid,
		actingAsUuid: locals.session.acting_as_uuid,
		scope,
		codeChallenge,
	});

	// Log authorization
	logAuditEvent({
		eventType: 'oidc_authorize',
		actorUuid: locals.person.uuid,
		actingAsUuid: locals.session.acting_as_uuid,
		sessionUuid: locals.session.uuid,
		ipAddress: ip,
		success: true,
		details: { clientId, scope, redirectUri }
	});

	let dest: URL;
	try {
		dest = new URL(redirectUri);
	} catch {
		error(400, 'Invalid redirect_uri');
	}
	dest.searchParams.set('code', code);
	if (state) dest.searchParams.set('state', state);
	redirect(302, dest.toString());
};
