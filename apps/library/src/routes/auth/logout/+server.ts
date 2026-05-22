import { redirect } from '@sveltejs/kit';
import type { RequestHandler } from './$types.js';
import { getOidcClient } from '$lib/server/oidc.js';

export const POST: RequestHandler = async ({ cookies }) => {
	// Clear the session cookie
	getOidcClient().clearSession(cookies);
	
	// Redirect to login page
	redirect(302, '/auth/login');
};
