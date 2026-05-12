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
 * Lookup an association by handle.
 * GET /api/associations/by-handle/:handle
 * Response: { uuid, handle, name, status } | 404
 */
export const GET: RequestHandler = async ({ params }) => {
	const { handle } = params;

	if (!handle) {
		error(400, 'Missing handle');
	}

	const row = db
		.prepare(
			`SELECT uuid, handle, name, status
       FROM association
       WHERE handle = ?`
		)
		.get(handle) as Association | undefined;

	if (!row) {
		error(404, 'Association not found');
	}

	return json(row);
};
