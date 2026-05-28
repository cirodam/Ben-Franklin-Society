import { getUser } from '$lib/server/auth.js';
import type { Handle } from '@sveltejs/kit';

export const handle: Handle = async ({ event, resolve }) => {
	const sessionId = event.cookies.get('session');

	if (sessionId) {
		const user = getUser(sessionId);
		if (user) {
			event.locals.user = user;
		}
	}

	return resolve(event);
};
