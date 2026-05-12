import type { LayoutServerLoad } from './$types.js';
import { oidcClient } from '$lib/server/oidc.js';
import { PERMISSIONS } from '$lib/server/permissions.js';
import { getUnreadCount } from '$lib/server/messages.js';

export const load: LayoutServerLoad = async ({ locals, url, cookies }) => {
	if (!locals.session) {
		console.log('[mail/layout] No session, initiating OIDC login');
		oidcClient.initiateLogin(cookies, url.pathname);
	}

	// TypeScript: session is guaranteed non-null after the check above (initiateLogin throws redirect)
	const session = locals.session!;
	
	// Check permissions from session (embedded in JWT access token)
	const isModerator = oidcClient.hasPermission(session, 'mail', PERMISSIONS.MODERATOR);
	const unreadCount = getUnreadCount(session.acting_as_uuid);

	return { session, isModerator, unreadCount };
};
