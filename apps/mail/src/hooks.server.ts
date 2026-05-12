import type { Handle } from '@sveltejs/kit';
import { oidcClient } from '$lib/server/oidc.js';
import { ensureMailbox, updateHandleCache } from '$lib/server/mailboxes.js';

export const handle: Handle = async ({ event, resolve }) => {
	event.locals.session = null;

	console.log('[mail/hooks] Request to:', event.url.pathname);

	// Get session from OIDC client (validates JWT locally)
	const session = await oidcClient.getSession(event.cookies);
	
	if (session) {
		console.log('[mail/hooks] Valid session for user:', session.handle);
		event.locals.session = session;
		// Provision mailbox on first login and keep handle_cache fresh
		ensureMailbox(session.acting_as_uuid, session.handle);
		updateHandleCache(session.acting_as_uuid, session.handle);
	} else {
		console.log('[mail/hooks] No valid session');
	}

	return resolve(event);
};
