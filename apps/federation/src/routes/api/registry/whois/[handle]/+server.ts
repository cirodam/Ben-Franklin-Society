import { json } from '@sveltejs/kit';
import { getWhois } from '$lib/server/domains.js';
import type { RequestHandler } from './$types.js';

/**
 * GET /api/registry/whois/:handle
 * Get WHOIS information for a society domain
 * 
 * Returns comprehensive domain registration details including:
 * - Domain and society info
 * - Registration dates
 * - Parent and lineage
 * - DNS records
 * - Recent updates
 */
export const GET: RequestHandler = async ({ params }) => {
	const { handle } = params;

	const whois = getWhois(handle);

	if (!whois) {
		return json(
			{ error: 'Domain not found', domain: `${handle}.bfs` },
			{ status: 404 }
		);
	}

	return json(whois);
};
