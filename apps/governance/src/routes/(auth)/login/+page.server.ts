import { fail, redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types.js';
import { authenticatePerson } from '$lib/server/infrastructure/auth.js';
import { getCommunityConfig } from '$lib/server/infrastructure/config.js';
import { checkRateLimit, resetRateLimit, RATE_LIMITS } from '$lib/server/infrastructure/rate-limiter.js';

/**
 * Validate and return a safe redirect URL.
 * Accepts relative paths or full URLs to configured satellite apps.
 * 
 * Note: Satellite apps now use OIDC, so they will redirect users here
 * for authentication and then handle the OAuth callback themselves.
 */
function getSafeRedirectUrl(next: string | null): string {
	if (!next) return '/communications/bulletin';
	
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
	
	return '/communications/bulletin';
}

export const load: PageServerLoad = async ({ locals, url }) => {
	const next = url.searchParams.get('next');
	
	if (locals.session && locals.person) {
		const redirectUrl = getSafeRedirectUrl(next);
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

		const ip = request.headers.get('x-forwarded-for') ?? request.headers.get('x-real-ip') ?? 'unknown';
		const ua = request.headers.get('user-agent') ?? undefined;

		// Rate limit by IP address
		const rateLimitKey = `login:${ip}`;
		const rateLimit = checkRateLimit(rateLimitKey, RATE_LIMITS.LOGIN);
		
		if (!rateLimit.allowed) {
			const minutesRemaining = Math.ceil((rateLimit.resetAt.getTime() - Date.now()) / 60000);
			return fail(429, { 
				error: `Too many login attempts. Try again in ${minutesRemaining} minute${minutesRemaining !== 1 ? 's' : ''}.` 
			});
		}

		const result = await authenticatePerson(handle, password, { ipAddress: ip, userAgent: ua });

		if (result.type === 'locked') {
			return fail(429, { error: 'Too many failed attempts. Try again in 15 minutes.' });
		}
		if (result.type === 'invalid') {
			return fail(401, { error: 'Invalid handle or password.' });
		}

		// Clear rate limit on successful login
		resetRateLimit(rateLimitKey);

		// Cookie security:
		// - httpOnly: prevents JavaScript access (XSS protection)
		// - secure: HTTPS only in production
		// - sameSite: 'lax' allows top-level navigation (required for OAuth flow)
		// - __Host- prefix in production: prevents subdomain cookie shadowing
		const isProduction = process.env.NODE_ENV === 'production';
		const cookieName = isProduction ? '__Host-bfs_session' : 'bfs_session';

		cookies.set(cookieName, result.refreshToken, {
			path: '/',
			httpOnly: true,
			sameSite: 'lax',
			secure: isProduction,
			maxAge: 30 * 24 * 60 * 60,
		});

		const next = url.searchParams.get('next');
		const redirectUrl = getSafeRedirectUrl(next);
		
		redirect(302, redirectUrl);
	}
};
