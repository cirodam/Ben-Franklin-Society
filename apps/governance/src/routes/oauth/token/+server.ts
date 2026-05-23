import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types.js';
import { exchangeAuthCode, exchangeRefreshToken, getClient, verifyClientSecret } from '$lib/server/infrastructure/oidc.js';
import { checkRateLimit, RATE_LIMITS } from '$lib/server/infrastructure/rate-limiter.js';

export const POST: RequestHandler = async ({ request }) => {
	// Rate limit by IP
	const ip = request.headers.get('x-forwarded-for') ?? request.headers.get('x-real-ip') ?? 'unknown';
	const rateLimitKey = `oidc_token:${ip}`;
	const rateLimit = checkRateLimit(rateLimitKey, RATE_LIMITS.OIDC_TOKEN);
	
	if (!rateLimit.allowed) {
		return json({ error: 'rate_limit_exceeded' }, { status: 429 });
	}

	const data = await request.formData();
	const grantType = data.get('grant_type');
	const clientId = data.get('client_id');
	const clientSecret = data.get('client_secret');

	if (typeof clientId !== 'string') {
		return json({ error: 'invalid_request', error_description: 'client_id is required' }, { status: 400 });
	}

	const client = getClient(clientId);
	if (!client) {
		return json({ error: 'invalid_client' }, { status: 401 });
	}

	// Verify client secret if this is a confidential client
	if (client.clientSecretHash !== null) {
		if (typeof clientSecret !== 'string' || !verifyClientSecret(clientId, clientSecret)) {
			return json({ error: 'invalid_client' }, { status: 401 });
		}
	}

	try {
		if (grantType === 'authorization_code') {
			const code = data.get('code');
			const codeVerifier = data.get('code_verifier');
			const redirectUri = data.get('redirect_uri');

			if (
				typeof code !== 'string' ||
				typeof codeVerifier !== 'string' ||
				typeof redirectUri !== 'string'
			) {
				return json({ error: 'invalid_request' }, { status: 400 });
			}

			const tokens = exchangeAuthCode({ code, codeVerifier, clientId, redirectUri });
			return json(tokens, { headers: { 'Cache-Control': 'no-store' } });
		} else if (grantType === 'refresh_token') {
			const refreshToken = data.get('refresh_token');

			if (typeof refreshToken !== 'string') {
				return json({ error: 'invalid_request', error_description: 'refresh_token is required' }, { status: 400 });
			}

			const tokens = exchangeRefreshToken({ refreshToken, clientId });
			return json(tokens, { headers: { 'Cache-Control': 'no-store' } });
		} else {
			return json({ error: 'unsupported_grant_type' }, { status: 400 });
		}
	} catch (err) {
		const message = err instanceof Error ? err.message : 'Unknown error';
		return json({ error: 'invalid_grant', error_description: message }, { status: 400 });
	}
};
