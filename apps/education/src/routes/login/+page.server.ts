import { authenticateUser } from '$lib/server/auth.js';
import { redirect, fail } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals }) => {
	// If already logged in, redirect to home
	if (locals.user) {
		throw redirect(303, '/');
	}
	return {};
};

export const actions: Actions = {
	default: async ({ request, cookies }) => {
		const formData = await request.formData();
		const username = formData.get('username') as string;
		const password = formData.get('password') as string;

		if (!username || !password) {
			return fail(400, { error: 'Username and password required' });
		}

		try {
			const user = await authenticateUser(username, password);
			if (!user) {
				return fail(401, { error: 'Invalid username or password' });
			}

			// Set session cookie
			cookies.set('session', user.uuid, {
				path: '/',
				httpOnly: true,
				sameSite: 'strict',
				secure: process.env.NODE_ENV === 'production',
				maxAge: 60 * 60 * 24 * 30 // 30 days
			});

			throw redirect(303, '/');
		} catch (error: any) {
			if (error instanceof Response) throw error;
			console.error('Login error:', error);
			return fail(500, { error: 'Login failed' });
		}
	}
};
