import type { Handle } from '@sveltejs/kit';
import { resolveSession } from '$lib/server/auth.js';
import { getPersonByUuid } from '$lib/server/people.js';

export const handle: Handle = async ({ event, resolve }) => {
	event.locals.session = null;
	event.locals.person = null;

	const token = event.cookies.get('bfs_session');
	if (token) {
		const session = resolveSession(token);
		if (session) {
			event.locals.session = session;
			event.locals.person = getPersonByUuid(session.person_uuid);
		} else {
			// Invalid or expired — clear the cookie
			event.cookies.delete('bfs_session', { path: '/' });
		}
	}

	return resolve(event);
};
