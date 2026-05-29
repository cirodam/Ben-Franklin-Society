import { json } from '@sveltejs/kit';
import { db } from '$lib/server/db.js';
import type { RequestHandler } from './$types.js';

interface PersonSyncData {
	uuid: string;
	handle: string;
	given_name: string;
	family_name: string;
	date_of_birth: string;
	status: string;
	street_address: string | null;
	latitude: number | null;
	longitude: number | null;
	created_at: string;
	updated_at: string;
}

/**
 * Get person data for synchronization purposes.
 * GET /api/persons/sync-data
 * Optional query param: ?updated_since=ISO8601
 * Response: { persons: PersonSyncData[] }
 */
export const GET: RequestHandler = async ({ url }) => {
	const updatedSince = url.searchParams.get('updated_since');

	let rows: PersonSyncData[];

	if (updatedSince) {
		rows = db
			.prepare(
				`SELECT uuid, handle, given_name, family_name, date_of_birth, status, street_address, latitude, longitude, created_at, updated_at
         FROM person
         WHERE updated_at > ?
         ORDER BY updated_at ASC`
			)
			.all(updatedSince) as PersonSyncData[];
	} else {
		rows = db
			.prepare(
				`SELECT uuid, handle, given_name, family_name, date_of_birth, status, street_address, latitude, longitude, created_at, updated_at
         FROM person
         ORDER BY created_at ASC`
			)
			.all() as PersonSyncData[];
	}

	return json({ persons: rows });
};
