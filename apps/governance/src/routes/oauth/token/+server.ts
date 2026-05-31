import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types.js';
import { exchangeAuthCode, exchangeRefreshToken } from '$lib/server/infrastructure/oidc/grants.js';
import { getClient, verifyClientSecret } from '$lib/server/infrastructure/oidc/clients.js';
import { issueServiceToken } from '$lib/server/infrastructure/oidc/tokens.js';
import { getClientIp } from '$lib/server/infrastructure/auth.js';
import { checkRateLimit, RATE_LIMITS } from '$lib/server/infrastructure/rate-limiter.js';
import { createLogger } from '@bfs/db';

const logger = createLogger('oauth/token');

export const POST: RequestHandler = async ({ request }) => {
	// Rate limit by IP
	const ip = getClientIp(request);
	const rateLimitKey = `oidc_token:${ip}`;
	const rateLimit = checkRateLimit(rateLimitKey, RATE_LIMITS.OIDC_TOKEN);
	
	if (!rateLimit.allowed) {
		logger.warn('Rate limit exceeded', { ip, key: rateLimitKey });
		return json({ error: 'rate_limit_exceeded' }, { status: 429 });
	}

	const data = await request.formData();
	const grantType = data.get('grant_type');
	const clientId = data.get('client_id');
	const clientSecret = data.get('client_secret');

	if (typeof clientId !== 'string') {
		logger.warn('Missing client_id in token request', { ip });
		return json({ error: 'invalid_request', error_description: 'client_id is required' }, { status: 400 });
	}

	const client = getClient(clientId);
	if (!client) {
		logger.warn('Unknown client_id', { clientId, ip });
		return json({ error: 'invalid_client' }, { status: 401 });
	}

	// Verify client secret if this is a confidential client
	if (client.clientSecretHash !== null) {
		if (typeof clientSecret !== 'string' || !verifyClientSecret(clientId, clientSecret)) {
			logger.warn('Invalid client secret', { clientId, ip });
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
				logger.warn('Invalid authorization_code request parameters', { clientId });
				return json({ error: 'invalid_request' }, { status: 400 });
			}

			logger.info('Exchanging authorization code', { clientId, redirectUri });
			const tokens = exchangeAuthCode({ code, codeVerifier, clientId, redirectUri });
			return json(tokens, { headers: { 'Cache-Control': 'no-store' } });
		} else if (grantType === 'refresh_token') {
			const refreshToken = data.get('refresh_token');

			if (typeof refreshToken !== 'string') {
				logger.warn('Missing refresh_token in request', { clientId });
				return json({ error: 'invalid_request', error_description: 'refresh_token is required' }, { status: 400 });
			}

			logger.info('Refreshing access token', { clientId });
			const tokens = exchangeRefreshToken({ refreshToken, clientId });
			return json(tokens, { headers: { 'Cache-Control': 'no-store' } });
		} else if (grantType === 'client_credentials') {
			// Service-to-service authentication using client credentials
			// Same client_id and client_secret, but different grant type
			logger.info('Issuing service token', { clientId });
			const serviceToken = issueServiceToken({ clientId });
			return json(serviceToken, { headers: { 'Cache-Control': 'no-store' } });
		} else {
			logger.warn('Unsupported grant type', { grantType, clientId });
			return json({ error: 'unsupported_grant_type' }, { status: 400 });
		}
	} catch (err) {
		const message = err instanceof Error ? err.message : 'Unknown error';
		logger.error('Token request failed', { clientId, grantType, error: message });
		return json({ error: 'invalid_grant', error_description: message }, { status: 400 });
	}
};
