import type { LayoutServerLoad } from './$types.js';
import { oidcClient } from '$lib/server/oidc.js';
import { PERMISSIONS } from '$lib/server/permissions.js';

export const load: LayoutServerLoad = async ({ locals, url, cookies }) => {
	if (!locals.session) {
		console.log('[marketplace/layout] No session, initiating OIDC login');
		oidcClient.initiateLogin(cookies, url.pathname);
	}

	// TypeScript: session is guaranteed non-null after the check above (initiateLogin throws redirect)
	const session = locals.session!;
	
	// Check permissions from session (embedded in JWT access token)
	const isAdministrator = oidcClient.hasPermission(session, 'marketplace', PERMISSIONS.ADMINISTRATOR);

	return { session, isAdministrator };
};
