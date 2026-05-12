import type { Handle } from '@sveltejs/kit';
import { oidcClient } from '$lib/server/oidc.js';
import { updateHandleCache } from '$lib/server/accounts.js';

export const handle: Handle = async ({ event, resolve }) => {
	event.locals.session = null;

	console.log('[community-bank/hooks] Request to:', event.url.pathname);

	// Get session from OIDC client (validates JWT locally)
	const session = await oidcClient.getSession(event.cookies);
	
	if (session) {
		console.log('[community-bank/hooks] Valid session for user:', session.handle);
		event.locals.session = session;
		// Keep handle_cache fresh for any accounts this principal holds
		updateHandleCache(session.acting_as_uuid, session.handle);
	} else {
		console.log('[community-bank/hooks] No valid session');
	}

	return resolve(event);
};
