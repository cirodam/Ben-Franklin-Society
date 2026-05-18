import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types.js';
import { getJwks } from '$lib/server/infrastructure/oidc.js';

export const GET: RequestHandler = async () => {
	return json(getJwks(), {
		headers: { 'Access-Control-Allow-Origin': '*' },
	});
};
