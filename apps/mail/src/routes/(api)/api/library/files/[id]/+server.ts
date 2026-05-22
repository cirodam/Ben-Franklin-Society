import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types.js';
import { env } from '$env/dynamic/private';

const LIBRARY_URL = env.LIBRARY_SERVICE_URL || 'http://localhost:5177';

/**
 * GET /api/library/files/:id
 * Proxy to library service: download file
 */
export const GET: RequestHandler = async ({ locals, fetch, params, cookies }) => {
	const session = locals.session;
	if (!session) {
		return json({ error: 'Not authenticated' }, { status: 401 });
	}

	const { id } = params;

	// Get JWT token from OIDC session cookie
	const sessionCookie = cookies.get('oidc_session');
	if (!sessionCookie) {
		return json({ error: 'No session cookie' }, { status: 401 });
	}

	try {
		const tokens = JSON.parse(sessionCookie);
		const response = await fetch(`${LIBRARY_URL}/api/files/${id}`, {
			headers: {
				'Authorization': `Bearer ${tokens.access_token}`
			}
		});

		if (!response.ok) {
			const error = await response.text();
			return json({ error: `Library service error: ${error}` }, { status: response.status });
		}

		// Forward the file response
		return new Response(response.body, {
			status: 200,
			headers: {
				'Content-Type': response.headers.get('content-type') || 'application/octet-stream',
				'Content-Disposition': response.headers.get('content-disposition') || 'attachment',
				'Content-Length': response.headers.get('content-length') || '0'
			}
		});
	} catch (err: any) {
		console.error('[mail/api/library/file] Error:', err);
		return json({ error: 'Failed to fetch file' }, { status: 500 });
	}
};
