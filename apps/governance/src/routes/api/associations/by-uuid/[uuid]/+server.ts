import { json, error } from '@sveltejs/kit';
import { db } from '$lib/server/db.js';
import type { RequestHandler } from './$types.js';

interface Association {
	uuid: string;
	handle: string;
	name: string;
	status: string;
}

/**
 * Lookup an association by UUID.
 * GET /api/associations/by-uuid/:uuid
 * Response: { uuid, handle, name, status } | 404
 */
export const GET: RequestHandler = async ({ params }) => {
	const { uuid } = params;

	if (!uuid) {
		error(400, 'Missing uuid');
	}

	const row = db
		.prepare(
			`SELECT uuid, handle, name, status
       FROM association
       WHERE uuid = ?`
		)
		.get(uuid) as Association | undefined;

	if (!row) {
		error(404, 'Association not found');
	}

	return json(row);
};
