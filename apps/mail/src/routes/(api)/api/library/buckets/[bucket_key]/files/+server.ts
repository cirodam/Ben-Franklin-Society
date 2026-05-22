import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types.js';
import { env } from '$env/dynamic/private';

const LIBRARY_URL = env.LIBRARY_SERVICE_URL || 'http://localhost:5177';

/**
 * GET /api/library/buckets/:bucket_key/files
 * Proxy to library service: list files in bucket
 */
export const GET: RequestHandler = async ({ locals, fetch, params, cookies }) => {
	const session = locals.session;
	if (!session) {
		return json({ error: 'Not authenticated' }, { status: 401 });
	}

	const { bucket_key } = params;

	// Get JWT token from OIDC session cookie
	const sessionCookie = cookies.get('oidc_session');
	if (!sessionCookie) {
		return json({ error: 'No session cookie' }, { status: 401 });
	}

	try {
		const tokens = JSON.parse(sessionCookie);
		const response = await fetch(`${LIBRARY_URL}/api/buckets/${bucket_key}/files`, {
			headers: {
				'Authorization': `Bearer ${tokens.access_token}`
			}
		});

		if (!response.ok) {
			const error = await response.text();
			return json({ error: `Library service error: ${error}` }, { status: response.status });
		}

		return json(await response.json());
	} catch (err: any) {
		console.error('[mail/api/library/files] Error:', err);
		return json({ error: 'Failed to fetch files' }, { status: 500 });
	}
};
