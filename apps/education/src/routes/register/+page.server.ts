import { registerUser } from '$lib/server/auth.js';
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
		const displayName = formData.get('displayName') as string;

		if (!username || !password || !displayName) {
			return fail(400, { error: 'All fields required' });
		}

		if (password.length < 8) {
			return fail(400, { error: 'Password must be at least 8 characters' });
		}

		try {
			const user = await registerUser(username, password, displayName);

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
			console.error('Registration error:', error);
			if (error.message === 'Username already exists') {
				return fail(400, { error: 'Username already taken' });
			}
			return fail(500, { error: 'Registration failed' });
		}
	}
};
