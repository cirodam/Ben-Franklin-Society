import { timingSafeEqual } from 'node:crypto';
import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types.js';
import { exchangeAuthCode, getClient } from '$lib/server/oidc.js';

export const POST: RequestHandler = async ({ request }) => {
	const data = await request.formData();
	const grantType = data.get('grant_type');
	const code = data.get('code');
	const codeVerifier = data.get('code_verifier');
	const redirectUri = data.get('redirect_uri');
	const clientId = data.get('client_id');
	const clientSecret = data.get('client_secret');

	if (grantType !== 'authorization_code') {
		return json({ error: 'unsupported_grant_type' }, { status: 400 });
	}

	if (
		typeof code !== 'string' ||
		typeof codeVerifier !== 'string' ||
		typeof redirectUri !== 'string' ||
		typeof clientId !== 'string'
	) {
		return json({ error: 'invalid_request' }, { status: 400 });
	}

	const client = getClient(clientId);
	if (!client) {
		return json({ error: 'invalid_client' }, { status: 401 });
	}

	if (client.clientSecret !== null) {
		if (typeof clientSecret !== 'string') {
			return json({ error: 'invalid_client' }, { status: 401 });
		}
		const a = Buffer.from(clientSecret);
		const b = Buffer.from(client.clientSecret);
		if (a.length !== b.length || !timingSafeEqual(a, b)) {
			return json({ error: 'invalid_client' }, { status: 401 });
		}
	}

	try {
		const tokens = exchangeAuthCode({ code, codeVerifier, clientId, redirectUri });
		return json(tokens, { headers: { 'Cache-Control': 'no-store' } });
	} catch (err) {
		const message = err instanceof Error ? err.message : 'Unknown error';
		return json({ error: 'invalid_grant', error_description: message }, { status: 400 });
	}
};
