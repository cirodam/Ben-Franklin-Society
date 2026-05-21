import type { LayoutServerLoad } from './$types.js';
import { redirect } from '@sveltejs/kit';
import { getOidcClient } from '$lib/server/auth/oidc.js';
import { PERMISSIONS } from '$lib/server/auth/permissions.js';

export const load: LayoutServerLoad = async ({ locals, url, cookies, fetch }) => {
	// Skip authentication for setup page
	if (url.pathname === '/oidc-setup') {
		return {};
	}

	if (!locals.session) {
		console.log('[community-bank/layout] No session, initiating OIDC login');
		const authUrl = getOidcClient().initiateLogin(cookies, url.pathname);
		redirect(302, authUrl);
	}

	// TypeScript: session is guaranteed non-null after the check above (initiateLogin throws redirect)
	const session = locals.session!;
	
	// Check permissions from session (embedded in JWT access token)
	const client = getOidcClient();
	const isTeller = client.hasPermission(session, 'bank', PERMISSIONS.TELLER);
	const isAdmin = client.hasPermission(session, 'bank', PERMISSIONS.ADMIN);
	const governanceUrl = client['config'].issuerUrl;
	
	// Fetch available contexts from governance server
	let availableContexts = [];
	try {
		const contextResponse = await fetch(`${governanceUrl}/api/session/contexts`, {
			headers: {
				'Cookie': cookies.getAll().map(c => `${c.name}=${c.value}`).join('; ')
			}
		});
		
		if (contextResponse.ok) {
			const data = await contextResponse.json();
			availableContexts = data.contexts ?? [];
		}
	} catch (err) {
		console.error('[community-bank/layout] Failed to fetch contexts:', err);
	}

	return { 
		session, 
		isTeller, 
		isAdmin,
		availableContexts,
		governanceUrl
	};
};
