import { redirect } from '@sveltejs/kit';
import type { RequestHandler } from './$types.js';
import { getOidcClient } from '$lib/server/oidc.js';

export const GET: RequestHandler = async ({ url, cookies }) => {
	const returnPath = url.searchParams.get('return') || '/';
	
	console.log('[library/auth/login] Initiating OAuth login, return path:', returnPath);
	
	const authUrl = getOidcClient().initiateLogin(cookies, returnPath);
	
	console.log('[library/auth/login] Redirecting to governance OAuth:', authUrl);
	redirect(302, authUrl);
};
