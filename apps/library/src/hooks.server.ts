import type { Handle } from '@sveltejs/kit';
import { redirect } from '@sveltejs/kit';
import { getOidcClient } from '$lib/server/oidc.js';
import { ensureBucket } from '$lib/server/buckets.js';
import { isOidcConfigured } from '$lib/server/config.js';

export const handle: Handle = async ({ event, resolve }) => {
	event.locals.session = null;

	console.log('[library/hooks] Request to:', event.url.pathname);

	// Check if OIDC is configured (except for setup page itself)
	if (event.url.pathname !== '/oidc-setup' && !isOidcConfigured()) {
		console.log('[library/hooks] OIDC not configured, redirecting to setup');
		redirect(302, '/oidc-setup');
	}

	// Get session from OIDC client (validates JWT locally)
	// Only attempt if OIDC is configured
	if (isOidcConfigured()) {
		const session = await getOidcClient().getSession(event.cookies);
		
		if (session) {
			console.log('[library/hooks] Valid session for user:', session.handle);
			event.locals.session = session;
			// Ensure user bucket exists on login
			ensureBucket('user', session.acting_as_uuid);
		} else {
			console.log('[library/hooks] No valid session');
		}
	}

	return resolve(event);
};
