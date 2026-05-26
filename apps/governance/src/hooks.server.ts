import type { Handle } from '@sveltejs/kit';
import { redirect } from '@sveltejs/kit';
import { resolveSession } from '$lib/server/infrastructure/auth.js';
import { getPersonByUuid } from '$lib/server/organization/people.js';
import { db } from '$lib/server/db.js';
import { scheduleCleanupJobs } from '$lib/server/infrastructure/cleanup.js';
import { startOutboxWorker } from '$lib/server/central-bank/outbox.js';

// Schedule cleanup jobs on server startup
scheduleCleanupJobs();

// Start outbox worker for delivering bank commands
startOutboxWorker();

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

	// Check both cookie names (production uses __Host- prefix)
	const isProduction = process.env.NODE_ENV === 'production';
	const cookieName = isProduction ? '__Host-bfs_session' : 'bfs_session';
	const token = event.cookies.get(cookieName);

	if (token) {
		const session = resolveSession(token);
		if (session) {
			event.locals.session = session;
			event.locals.person = getPersonByUuid(session.person_uuid);
		} else {
			// Cookie deletion must match the options used when setting the cookie
			event.cookies.delete(cookieName, {
				path: '/',
				httpOnly: true,
				sameSite: 'lax',
				secure: isProduction
			});
		}
	}

	return resolve(event);
};
