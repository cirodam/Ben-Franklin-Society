import { json, error, redirect } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { getOidcClient } from '$lib/server/auth/oidc.js';

export const POST: RequestHandler = async ({ request, cookies }) => {
	const body = await request.json();
	
	// Forward the request to the governance server
	try {
		const client = getOidcClient();
		const governanceUrl = client['config'].issuerUrl;
		const response = await fetch(`${governanceUrl}/api/session/switch-context`, {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
				'Cookie': cookies.getAll().map(c => `${c.name}=${c.value}`).join('; ')
			},
			body: JSON.stringify(body)
		});
		
		if (!response.ok) {
			const errorData = await response.json().catch(() => ({ message: 'Failed to switch context' }));
			return error(response.status, errorData.message || 'Failed to switch context');
		}
		
		// Context switched successfully on governance server
		// Clear the local session cookie and redirect to force re-authentication
		client.clearSession(cookies);
		
		// Return success JSON so the client can handle the redirect
		return json({ success: true });
	} catch (err) {
		console.error('[community-bank/switch-context] Error forwarding to governance:', err);
		return error(500, 'Failed to communicate with governance server');
	}
};
