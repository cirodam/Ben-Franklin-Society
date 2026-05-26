import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types.js';
import { db } from '$lib/server/db.js';
import { GOVERNANCE_SHARED_SECRET } from '$env/static/private';

/**
 * Resolve a handle to a person UUID
 * Used by other BFS services (like community-bank) to look up people
 */
export const GET: RequestHandler = async ({ request, url }) => {
	// Verify shared secret
	const authHeader = request.headers.get('authorization');
	if (!authHeader || !authHeader.startsWith('Bearer ')) {
		error(401, 'Missing authorization header');
	}

	const token = authHeader.substring(7);
	if (token !== GOVERNANCE_SHARED_SECRET) {
		error(403, 'Invalid authorization token');
	}

	const handle = url.searchParams.get('handle');
	if (!handle) {
		error(400, 'Missing handle parameter');
	}

	// Look up person by handle
	const person = db
		.prepare(
			`SELECT uuid, handle, given_name, family_name 
			 FROM person 
			 WHERE handle = ?`
		)
		.get(handle.toLowerCase()) as
		| { uuid: string; handle: string; given_name: string; family_name: string }
		| undefined;

	if (!person) {
		error(404, 'Person not found');
	}

	return json({
		uuid: person.uuid,
		handle: person.handle,
		name: `${person.given_name} ${person.family_name}`
	});
};
