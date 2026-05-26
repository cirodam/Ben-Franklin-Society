import type { Handle } from '@sveltejs/kit';
import { startFlorenOutboxWorker } from '$lib/server/outbox.js';

// Start outbox worker for delivering Floren commands to Community Banks
startFlorenOutboxWorker();

export const handle: Handle = async ({ event, resolve }) => {
	// Federation has no authentication/session management
	// It's a pure API service
	
	return resolve(event);
};
