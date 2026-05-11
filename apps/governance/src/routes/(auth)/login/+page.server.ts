import { fail, redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types.js';
import { authenticatePerson } from '$lib/server/auth.js';

export const load: PageServerLoad = async ({ locals, url }) => {
	if (locals.session && locals.person) {
		const next = url.searchParams.get('next');
		redirect(302, next && next.startsWith('/') ? next : '/people');
	}
	return {};
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
		redirect(302, next && next.startsWith('/') ? next : '/people');
	}
};
