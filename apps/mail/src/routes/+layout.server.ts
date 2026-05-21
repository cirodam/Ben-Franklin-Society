import type { LayoutServerLoad } from './$types.js';
import { redirect } from '@sveltejs/kit';
import { getOidcClient } from '$lib/server/oidc.js';
import { PERMISSIONS } from '$lib/server/permissions.js';
import { getUnreadCount } from '$lib/server/messages.js';

export const load: LayoutServerLoad = async ({ locals, url, cookies, fetch }) => {
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
	const governanceUrl = client['config'].issuerUrl;
	const unreadCount = getUnreadCount(session.acting_as_uuid);
	
	// Fetch available contexts from governance server
	let availableContexts = [];
	try {
		const response = await fetch(`${governanceUrl}/api/session/contexts`, {
			headers: {
				Cookie: `session_id=${session.uuid}`
			}
		});
		if (response.ok) {
			const data = await response.json();
			availableContexts = data.contexts || [];
		}
	} catch (error) {
		console.error('[mail/layout] Failed to fetch available contexts:', error);
	}

	return { session, isModerator, unreadCount, availableContexts, governanceUrl };
};
