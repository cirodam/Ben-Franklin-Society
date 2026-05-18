import type { Handle } from '@sveltejs/kit';
import { redirect } from '@sveltejs/kit';
import { resolveSession } from '$lib/server/infrastructure/auth.js';
import { getPersonByUuid } from '$lib/server/organization/people.js';
import { db } from '$lib/server/db.js';

function isSetupComplete(): boolean {
	const row = db.prepare('SELECT 1 FROM person LIMIT 1').get();
	return row !== undefined;
}

export const handle: Handle = async ({ event, resolve }) => {
	event.locals.session = null;
	event.locals.person = null;

	const path = event.url.pathname;

	// First-run redirect — before anything else
	if (path !== '/setup' && !isSetupComplete()) {
		redirect(302, '/setup');
	}

	const token = event.cookies.get('bfs_session');
	if (token) {
		const session = resolveSession(token);
		if (session) {
			event.locals.session = session;
			event.locals.person = getPersonByUuid(session.person_uuid);
		} else {
			event.cookies.delete('bfs_session', { path: '/' });
		}
	}

	return resolve(event);
};
