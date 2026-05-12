import { json, error } from '@sveltejs/kit';
import { db } from '$lib/server/db.js';
import type { RequestHandler } from './$types.js';

interface Association {
	uuid: string;
	name: string;
	registration_no: string;
	status: string;
}

/**
 * Lookup an association by registration number.
 * GET /api/associations/by-registration/:registration_no
 * Response: { uuid, name, registration_no, status } | 404
 */
export const GET: RequestHandler = async ({ params }) => {
	const { registration_no } = params;

	if (!registration_no) {
		error(400, 'Missing registration_no');
	}

	const row = db
		.prepare(
			`SELECT uuid, name, registration_no, status
       FROM association
       WHERE registration_no = ?`
		)
		.get(registration_no) as Association | undefined;

	if (!row) {
		error(404, 'Association not found');
	}

	return json(row);
};
