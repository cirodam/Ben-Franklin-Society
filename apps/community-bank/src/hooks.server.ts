import type { Handle } from '@sveltejs/kit';
import { redirect } from '@sveltejs/kit';
import { getOidcClient } from '$lib/server/oidc.js';
import { updateHandleCache } from '$lib/server/accounts.js';
import { isOidcConfigured } from '$lib/server/config.js';

export const handle: Handle = async ({ event, resolve }) => {
	event.locals.session = null;

	console.log('[community-bank/hooks] Request to:', event.url.pathname);

	// Check if OIDC is configured (except for setup page itself)
	if (event.url.pathname !== '/oidc-setup' && !isOidcConfigured()) {
		console.log('[community-bank/hooks] OIDC not configured, redirecting to setup');
		redirect(302, '/oidc-setup');
	}

	// Get session from OIDC client (validates JWT locally)
	// Only attempt if OIDC is configured
	if (isOidcConfigured()) {
		const session = await getOidcClient().getSession(event.cookies);
		
		if (session) {
			console.log('[community-bank/hooks] Valid session for user:', session.handle);
			event.locals.session = session;
			// Keep handle_cache fresh for any accounts this principal holds
			updateHandleCache(session.acting_as_uuid, session.handle);
		} else {
			console.log('[community-bank/hooks] No valid session');
		}
	}

	return resolve(event);
};
