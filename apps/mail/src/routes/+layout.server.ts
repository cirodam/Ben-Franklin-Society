import type { LayoutServerLoad } from './$types.js';
import { redirect } from '@sveltejs/kit';
import { getOidcClient } from '$lib/server/oidc.js';
import { PERMISSIONS } from '$lib/server/permissions.js';
import { getUnreadCount } from '$lib/server/messages.js';

export const load: LayoutServerLoad = async ({ locals, url, cookies }) => {
	// Skip authentication for setup page
	if (url.pathname === '/oidc-setup') {
		return {};
	}

	if (!locals.session) {
		console.log('[mail/layout] No session, initiating OIDC login');
		const authUrl = getOidcClient().initiateLogin(cookies, url.pathname);
		redirect(302, authUrl);
	}

	// TypeScript: session is guaranteed non-null after the check above (initiateLogin throws redirect)
	const session = locals.session!;
	
	// Check permissions from session (embedded in JWT access token)
	const client = getOidcClient();
	const isModerator = client.hasPermission(session, 'mail', PERMISSIONS.MODERATOR);
	const unreadCount = getUnreadCount(session.acting_as_uuid);

	return { session, isModerator, unreadCount };
};
