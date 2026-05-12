import type { LayoutServerLoad } from './$types.js';
import { oidcClient } from '$lib/server/oidc.js';
import { PERMISSIONS } from '$lib/server/permissions.js';

export const load: LayoutServerLoad = async ({ locals, url, cookies }) => {
	if (!locals.session) {
		console.log('[community-bank/layout] No session, initiating OIDC login');
		oidcClient.initiateLogin(cookies, url.pathname);
	}

	// TypeScript: session is guaranteed non-null after the check above (initiateLogin throws redirect)
	const session = locals.session!;
	
	// Check permissions from session (embedded in JWT access token)
	const isTeller = oidcClient.hasPermission(session, 'community-bank', PERMISSIONS.TELLER);
	const isAdmin = oidcClient.hasPermission(session, 'community-bank', PERMISSIONS.ADMIN);

	return { session, isTeller, isAdmin };
};
