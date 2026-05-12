import type { Handle } from '@sveltejs/kit';
import { oidcClient } from '$lib/server/oidc.js';

export const handle: Handle = async ({ event, resolve }) => {
	event.locals.session = null;

	console.log('[marketplace/hooks] Request to:', event.url.pathname);

	// Get session from OIDC client (validates JWT locally)
	const session = await oidcClient.getSession(event.cookies);
	
	if (session) {
		console.log('[marketplace/hooks] Valid session for user:', session.handle);
		event.locals.session = session;
	} else {
		console.log('[marketplace/hooks] No valid session');
	}

	return resolve(event);
};
