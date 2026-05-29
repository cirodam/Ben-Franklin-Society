import { json, error } from '@sveltejs/kit';
import { db } from '$lib/server/db.js';
import type { RequestHandler } from './$types.js';

interface Person {
	uuid: string;
	handle: string;
	given_name: string;
	family_name: string;
	status: string;
	street_address: string | null;
	latitude: number | null;
	longitude: number | null;
}

/**
 * Lookup a person by their handle.
 * GET /api/persons/by-handle/:handle
 * Response: { uuid, handle, given_name, family_name, status } | 404
 */
export const GET: RequestHandler = async ({ params }) => {
	const { handle } = params;

	if (!handle) {
		error(400, 'Missing handle');
	}

	const row = db
		.prepare(
			`SELECT uuid, handle, given_name, family_name, status, street_address, latitude, longitude
       FROM person
       WHERE handle = ?`
		)
		.get(handle) as Person | undefined;

	if (!row) {
		error(404, 'Person not found');
	}

	return json(row);
};
