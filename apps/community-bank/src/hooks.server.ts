import type { Handle } from '@sveltejs/kit';
import { redirect } from '@sveltejs/kit';
import { getOidcClient } from '$lib/server/auth/oidc.js';
import { isOidcConfigured } from '$lib/server/config.js';

export const handle: Handle = async ({ event, resolve }) => {
	event.locals.session = null;

	console.log('[community-bank/hooks] Request to:', event.url.pathname);

	// API endpoints don't need OIDC session - they use their own auth
	const isApiEndpoint = event.url.pathname.startsWith('/api/');

	// Check if OIDC is configured (except for setup page and API endpoints)
	if (event.url.pathname !== '/oidc-setup' && !isApiEndpoint && !isOidcConfigured()) {
		console.log('[community-bank/hooks] OIDC not configured, redirecting to setup');
		redirect(302, '/oidc-setup');
	}

	// Get session from OIDC client (validates JWT locally)
	// Only attempt if OIDC is configured and not an API endpoint
	if (isOidcConfigured() && !isApiEndpoint) {
		const session = await getOidcClient().getSession(event.cookies);
		
		if (session) {
			console.log('[community-bank/hooks] Valid session for user:', session.handle);
			event.locals.session = session;
		} else {
			console.log('[community-bank/hooks] No valid session');
		}
	}

	return resolve(event);
};
