import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { getMonetaryStatus } from '$lib/server/monetary.js';

/**
 * GET /api/monetary/status
 * Returns comprehensive monetary status including variance analysis
 */
export const GET: RequestHandler = async () => {
	const status = await getMonetaryStatus();
	return json(status);
};
