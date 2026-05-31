import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types.js';
import { verifyAccessToken } from '$lib/server/infrastructure/oidc/jwt.js';
import { db } from '$lib/server/db.js';

export const GET: RequestHandler = async ({ request }) => {
	// Verify access token from Bearer header
	const auth = request.headers.get('authorization');
	if (!auth?.startsWith('Bearer ')) {
		return json({ error: 'invalid_token' }, { status: 401 });
	}

	const claims = verifyAccessToken(auth.slice(7));
	if (!claims) {
		return json({ error: 'invalid_token' }, { status: 401 });
	}

	// Get associations where the user is a member
	const associations = db.prepare(`
		SELECT a.uuid, a.handle, a.name, a.description, a.type, a.status
		FROM association a
		INNER JOIN association_member am ON am.association_uuid = a.uuid
		WHERE am.person_uuid = ?
		  AND am.removed_at IS NULL
		  AND a.status = 'active'
		ORDER BY a.name ASC
	`).all(claims.sub) as Array<{
		uuid: string;
		handle: string;
		name: string;
		description: string | null;
		type: string;
		status: string;
	}>;

	return json(
		{ associations },
		{ 
			headers: { 
				'Access-Control-Allow-Origin': '*',
				'Cache-Control': 'private, max-age=60' // Cache for 1 minute
			} 
		}
	);
};
