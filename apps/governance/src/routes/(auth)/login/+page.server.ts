import { fail, redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types.js';
import { authenticatePerson } from '$lib/server/auth.js';
import { getCommunityConfig } from '$lib/server/config.js';

/**
 * Validate and return a safe redirect URL.
 * Accepts relative paths or full URLs to configured satellite apps.
 * 
 * Note: Satellite apps now use OIDC, so they will redirect users here
 * for authentication and then handle the OAuth callback themselves.
 */
function getSafeRedirectUrl(next: string | null): string {
	if (!next) return '/bulletin';
	
	// Allow relative paths (same-origin)
	if (next.startsWith('/')) return next;
	
	// Allow full URLs to known satellite apps (for OAuth redirect_uri validation)
	const allowedOrigins = [
		'http://localhost:5174', // community-bank
		'http://localhost:5175', // mail
		'http://localhost:5176', // marketplace
	];
	
	try {
		const url = new URL(next);
		if (allowedOrigins.includes(url.origin)) {
			return next;
		}
	} catch {
		// Invalid URL, fall through to default
	}
	
	return '/bulletin';
}

export const load: PageServerLoad = async ({ locals, url }) => {
	const next = url.searchParams.get('next');
	console.log('[governance/login/load] Request with next:', next, 'Logged in:', !!locals.session);
	
	if (locals.session && locals.person) {
		const redirectUrl = getSafeRedirectUrl(next);
		console.log('[governance/login/load] Already logged in, redirecting to:', redirectUrl);
		redirect(302, redirectUrl);
	}
	
	const societyName = getCommunityConfig('society_name') ?? 'BFS Governance';
	
	return { societyName };
};

export const actions: Actions = {
	default: async ({ request, cookies, url }) => {
		const data = await request.formData();
		const handle = data.get('handle');
		const password = data.get('password');

		if (typeof handle !== 'string' || typeof password !== 'string' || !handle || !password) {
			return fail(400, { error: 'Handle and password are required.' });
		}

		const ip = request.headers.get('x-forwarded-for') ?? undefined;
		const ua = request.headers.get('user-agent') ?? undefined;

		const result = await authenticatePerson(handle, password, { ipAddress: ip, userAgent: ua });

		if (result.type === 'locked') {
			return fail(429, { error: 'Too many failed attempts. Try again in 15 minutes.' });
		}
		if (result.type === 'invalid') {
			return fail(401, { error: 'Invalid handle or password.' });
		}

		cookies.set('bfs_session', result.refreshToken, {
			path: '/',
			httpOnly: true,
			sameSite: 'lax',
			secure: process.env.NODE_ENV === 'production',
			maxAge: 30 * 24 * 60 * 60,
		});

		const next = url.searchParams.get('next');
		const redirectUrl = getSafeRedirectUrl(next);
		
		console.log('[governance/login/action] Login successful, redirecting to:', redirectUrl);
		redirect(302, redirectUrl);
	}
};
