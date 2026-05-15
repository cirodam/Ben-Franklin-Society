import { json, error } from '@sveltejs/kit';
import { db } from '$lib/server/db.js';
import type { RequestHandler } from './$types.js';

/**
 * Get all person UUIDs with a specific role.
 * GET /api/members/by-role/:role_code
 * Response: { person_uuids: string[] }
 */
export const GET: RequestHandler = async ({ params }) => {
	const { role_code } = params;

	if (!role_code) {
		error(400, 'Missing role_code');
	}

	const rows = db
		.prepare(
			`SELECT person_uuid
       FROM role_assignment ra
       JOIN role r ON r.uuid = ra.role_uuid
       WHERE r.role_code = ?
         AND ra.removed_at IS NULL`
		)
		.all(role_code) as Array<{ person_uuid: string }>;

	return json({ person_uuids: rows.map((r) => r.person_uuid) });
};
