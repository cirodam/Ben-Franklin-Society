import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { getOidcClient } from '$lib/server/oidc.js';

export const POST: RequestHandler = async ({ cookies }) => {
	// Clear the OIDC session cookie to force re-authentication
	getOidcClient().clearSession(cookies);
	return json({ success: true });
};
