import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { getAvailableContexts, resolveSession } from '$lib/server/infrastructure/auth.js';

export const GET: RequestHandler = async ({ cookies }) => {
	const refreshToken = cookies.get('bfs_session');
	if (!refreshToken) {
		return error(401, 'Not authenticated');
	}

	const session = resolveSession(refreshToken);
	if (!session) {
		return error(401, 'Invalid or expired session');
	}

	const contexts = getAvailableContexts(session.person_uuid);

	return json({
		person_uuid: session.person_uuid,
		acting_as_uuid: session.acting_as_uuid,
		contexts
	});
};
