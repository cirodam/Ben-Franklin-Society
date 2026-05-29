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
 * Lookup a person by UUID.
 * GET /api/persons/by-uuid/:uuid
 * Response: { uuid, handle, given_name, family_name, status } | 404
 */
export const GET: RequestHandler = async ({ params }) => {
	const { uuid } = params;

	if (!uuid) {
		error(400, 'Missing uuid');
	}

	const row = db
		.prepare(
			`SELECT uuid, handle, given_name, family_name, status, street_address, latitude, longitude
       FROM person
       WHERE uuid = ?`
		)
		.get(uuid) as Person | undefined;

	if (!row) {
		error(404, 'Person not found');
	}

	return json(row);
};
