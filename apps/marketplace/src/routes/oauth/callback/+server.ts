import { redirect, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types.js';
import { getOidcClient } from '$lib/server/oidc.js';

export const GET: RequestHandler = async ({ url, cookies }) => {
	const code = url.searchParams.get('code');
	const state = url.searchParams.get('state');

	if (!code || !state) {
		console.error('[marketplace/oauth/callback] Missing code or state');
		throw error(400, 'Missing code or state');
	}

	try {
		console.log('[marketplace/oauth/callback] Exchanging authorization code for tokens...');
		const { tokens, returnPath } = await getOidcClient().handleCallback(code, state, cookies);
		
		console.log('[marketplace/oauth/callback] Token exchange successful, setting session');
		await getOidcClient().setSession(cookies, tokens);
		
		console.log('[marketplace/oauth/callback] Redirecting to:', returnPath);
		redirect(302, returnPath);
	} catch (err) {
		// Re-throw redirects - they're not errors
		if (err && typeof err === 'object' && 'status' in err && 'location' in err) {
			throw err;
		}
		console.error('[marketplace/oauth/callback] OAuth callback error:', err);
		throw error(500, 'Authentication failed');
	}
};
