import { json } from '@sveltejs/kit';
import { resolveDomain } from '$lib/server/domains.js';
import type { RequestHandler } from './$types.js';

/**
 * GET /api/resolve/:handle
 * Fast domain resolution for P2P clients
 * 
 * Returns minimal data needed to connect to a society:
 * - Domain name
 * - Endpoint URL
 * - Status
 * 
 * This is optimized for speed - use this instead of WHOIS when you
 * only need the endpoint URL for network communication.
 */
export const GET: RequestHandler = async ({ params }) => {
	const { handle } = params;

	const resolved = resolveDomain(handle);

	if (!resolved) {
		return json(
			{ error: 'Domain not found', domain: `${handle}.bfs` },
			{ status: 404 }
		);
	}

	return json(resolved);
};
