import { redirect } from '@sveltejs/kit';
import type { RequestHandler } from './$types.js';
import { revokeSession } from '$lib/server/infrastructure/auth.js';

export const POST: RequestHandler = async ({ cookies, locals }) => {
	if (locals.session) {
		revokeSession(locals.session.uuid);
	}

	// Delete both cookie names (development and production)
	const isProduction = process.env.NODE_ENV === 'production';
	const cookieName = isProduction ? '__Host-bfs_session' : 'bfs_session';
	cookies.delete(cookieName, { path: '/' });

	redirect(302, '/login');
};
