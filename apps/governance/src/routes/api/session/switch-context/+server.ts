import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { updateActingAs, getAvailableContexts, resolveSession } from '$lib/server/infrastructure/auth.js';

export const POST: RequestHandler = async ({ request, cookies }) => {
	const refreshToken = cookies.get('bfs_session');
	if (!refreshToken) {
		return error(401, 'Not authenticated');
	}

	const session = resolveSession(refreshToken);
	if (!session) {
		return error(401, 'Invalid or expired session');
	}

	const body = await request.json();
	const { acting_as_uuid } = body;

	if (!acting_as_uuid || typeof acting_as_uuid !== 'string') {
		return error(400, 'Missing or invalid acting_as_uuid');
	}

	// Validate the person can switch to this context
	const availableContexts = getAvailableContexts(session.person_uuid);
	const targetContext = availableContexts.find(c => c.uuid === acting_as_uuid);
	
	if (!targetContext) {
		return error(403, 'Cannot switch to this context');
	}

	// Update the session
	updateActingAs(session.uuid, acting_as_uuid);

	return json({ 
		success: true,
		acting_as_uuid,
		context: targetContext
	});
};
