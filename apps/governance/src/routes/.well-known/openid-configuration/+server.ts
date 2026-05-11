import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types.js';
import { getDiscoveryDocument } from '$lib/server/oidc.js';

export const GET: RequestHandler = async () => {
	return json(getDiscoveryDocument(), {
		headers: { 'Access-Control-Allow-Origin': '*' },
	});
};
