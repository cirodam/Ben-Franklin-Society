import { json } from '@sveltejs/kit';
import { db } from '$lib/server/db.js';
import type { RequestHandler } from './$types.js';

interface AssociationSyncData {
	uuid: string;
	name: string;
	registration_no: string;
	status: string;
	created_at: string;
	updated_at: string;
}

/**
 * Get association data for synchronization purposes.
 * GET /api/associations/sync-data
 * Optional query param: ?updated_since=ISO8601
 * Response: { associations: AssociationSyncData[] }
 */
export const GET: RequestHandler = async ({ url }) => {
	const updatedSince = url.searchParams.get('updated_since');

	let rows: AssociationSyncData[];

	if (updatedSince) {
		rows = db
			.prepare(
				`SELECT uuid, name, registration_no, status, created_at, updated_at
         FROM association
         WHERE updated_at > ?
         ORDER BY updated_at ASC`
			)
			.all(updatedSince) as AssociationSyncData[];
	} else {
		rows = db
			.prepare(
				`SELECT uuid, name, registration_no, status, created_at, updated_at
         FROM association
         ORDER BY created_at ASC`
			)
			.all() as AssociationSyncData[];
	}

	return json({ associations: rows });
};
