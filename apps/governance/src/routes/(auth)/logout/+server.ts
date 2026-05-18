import { redirect } from '@sveltejs/kit';
import type { RequestHandler } from './$types.js';
import { revokeSession } from '$lib/server/infrastructure/auth.js';

export const POST: RequestHandler = async ({ cookies, locals }) => {
	if (locals.session) {
		revokeSession(locals.session.uuid);
	}
	cookies.delete('bfs_session', { path: '/' });
	redirect(302, '/login');
};
