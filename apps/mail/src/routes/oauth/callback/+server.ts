import { redirect, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types.js';
import { oidcClient } from '$lib/server/oidc.js';

export const GET: RequestHandler = async ({ url, cookies }) => {
	const code = url.searchParams.get('code');
	const state = url.searchParams.get('state');

	if (!code || !state) {
		console.error('[mail/oauth/callback] Missing code or state');
		throw error(400, 'Missing code or state');
	}

	try {
		console.log('[mail/oauth/callback] Exchanging authorization code for tokens...');
		const { tokens, returnPath } = await oidcClient.handleCallback(code, state, cookies);
		
		console.log('[mail/oauth/callback] Token exchange successful, setting session');
		oidcClient.setSession(cookies, tokens);
		
		console.log('[mail/oauth/callback] Redirecting to:', returnPath);
		throw redirect(302, returnPath);
	} catch (err) {
		console.error('[mail/oauth/callback] OAuth callback error:', err);
		throw error(500, 'Authentication failed');
	}
};
