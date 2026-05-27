import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { updateActingAs, getAvailableContexts, resolveSession } from '$lib/server/infrastructure/auth.js';
import { verifyAccessToken } from '$lib/server/infrastructure/oidc.js';

export const POST: RequestHandler = async ({ request, cookies }) => {
	// Support both Bearer token (from satellite apps) and cookies (from governance UI)
	const authHeader = request.headers.get('Authorization');
	let personUuid: string;
	let sessionUuid: string | undefined;

	if (authHeader?.startsWith('Bearer ')) {
		// Bearer token authentication (satellite apps)
		const token = authHeader.slice(7);
		try {
			const claims = verifyAccessToken(token);
			if (!claims || typeof claims !== 'object') {
				return error(401, 'Invalid token');
			}
			
			// Extract person UUID and session UUID from token claims
			personUuid = (claims as any).person_uuid;
			sessionUuid = (claims as any).sub; // session UUID
			
			if (!personUuid) {
				return error(401, 'Invalid token claims');
			}
		} catch (err) {
			console.error('[governance/switch-context] Token verification failed:', err);
			return error(401, 'Invalid token');
		}
	} else {
		// Cookie authentication (governance UI)
		const isProduction = process.env.NODE_ENV === 'production';
		const cookieName = isProduction ? '__Host-bfs_session' : 'bfs_session';
		const refreshToken = cookies.get(cookieName);

		if (!refreshToken) {
			return error(401, 'Not authenticated');
		}

		const session = resolveSession(refreshToken);
		if (!session) {
			return error(401, 'Invalid or expired session');
		}
		
		personUuid = session.person_uuid;
		sessionUuid = session.uuid;
	}

	const body = await request.json();
	const { acting_as_uuid } = body;

	if (!acting_as_uuid || typeof acting_as_uuid !== 'string') {
		return error(400, 'Missing or invalid acting_as_uuid');
	}

	// Validate the person can switch to this context
	const availableContexts = getAvailableContexts(personUuid);
	const targetContext = availableContexts.find(c => c.uuid === acting_as_uuid);
	
	if (!targetContext) {
		return error(403, 'Cannot switch to this context');
	}

	// Update the session (only if we have a session UUID)
	if (sessionUuid) {
		updateActingAs(sessionUuid, acting_as_uuid);
	}

	return json({ 
		success: true,
		acting_as_uuid,
		context: targetContext
	});
};
