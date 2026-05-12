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
       FROM person_role pr
       JOIN role r ON r.uuid = pr.role_uuid
       WHERE r.role_code = ?
         AND pr.revoked_at IS NULL`
		)
		.all(role_code) as Array<{ person_uuid: string }>;

	return json({ person_uuids: rows.map((r) => r.person_uuid) });
};
