import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { updateActingAs, getAvailableContexts, resolveSession } from '$lib/server/infrastructure/auth.js';
import { verifyAccessToken } from '$lib/server/infrastructure/oidc.js';
import { createLogger } from '@bfs/db';

const logger = createLogger('api/session/switch-context');

export const POST: RequestHandler = async ({ request, cookies }) => {
	// Support both Bearer token (from satellite apps) and cookies (from governance UI)
	const authHeader = request.headers.get('Authorization');
	let personUuid: string;
	let sessionUuid: string | undefined;
	let authMethod: 'bearer' | 'cookie';

	if (authHeader?.startsWith('Bearer ')) {
		// Bearer token authentication (satellite apps)
		authMethod = 'bearer';
		const token = authHeader.slice(7);
		try {
			const claims = verifyAccessToken(token);
			if (!claims || typeof claims !== 'object') {
				logger.warn('Invalid token in switch-context request');
				return error(401, 'Invalid token');
			}
			
			// Access token claims: sub = person UUID, session_uuid = session UUID
			personUuid = claims.sub;
			sessionUuid = claims.session_uuid; // Now available in access tokens
			
			if (!personUuid) {
				logger.warn('Missing person UUID in token claims');
				return error(401, 'Invalid token claims');
			}
			
			logger.info('Switch context via Bearer token', { personUuid, sessionUuid });
		} catch (err) {
			const errMsg = err instanceof Error ? err.message : 'Unknown error';
			logger.error('Token verification failed', { error: errMsg });
			return error(401, 'Invalid token');
		}
	} else {
		// Cookie authentication (governance UI)
		authMethod = 'cookie';
		const isProduction = process.env.NODE_ENV === 'production';
		const cookieName = isProduction ? '__Host-bfs_session' : 'bfs_session';
		const refreshToken = cookies.get(cookieName);

		if (!refreshToken) {
			logger.warn('No session cookie in switch-context request');
			return error(401, 'Not authenticated');
		}

		const session = resolveSession(refreshToken);
		if (!session) {
			logger.warn('Invalid or expired session cookie');
			return error(401, 'Invalid or expired session');
		}
		
		personUuid = session.person_uuid;
		sessionUuid = session.uuid;
		
		logger.info('Switch context via cookie', { personUuid, sessionUuid });
	}

	const body = await request.json();
	const { acting_as_uuid } = body;

	if (!acting_as_uuid || typeof acting_as_uuid !== 'string') {
		logger.warn('Missing or invalid acting_as_uuid', { personUuid });
		return error(400, 'Missing or invalid acting_as_uuid');
	}

	// Validate the person can switch to this context
	const availableContexts = getAvailableContexts(personUuid);
	const targetContext = availableContexts.find(c => c.uuid === acting_as_uuid);
	
	if (!targetContext) {
		logger.warn('Unauthorized context switch attempt', { 
			personUuid, 
			acting_as_uuid, 
			availableCount: availableContexts.length 
		});
		return error(403, 'Cannot switch to this context');
	}

	// Update the session (only if we have a session UUID)
	if (sessionUuid) {
		updateActingAs(sessionUuid, acting_as_uuid);
		logger.info('Context switched successfully', { 
			personUuid, 
			sessionUuid, 
			acting_as_uuid, 
			context_name: targetContext.name,
			authMethod 
		});
	} else {
		logger.warn('No session UUID available, context switch not persisted', { personUuid, acting_as_uuid });
	}

	return json({ 
		success: true,
		acting_as_uuid,
		context: targetContext
	});
};

