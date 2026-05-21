import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { getMonetarySupply } from '$lib/server/monetary.js';

/**
 * GET /api/monetary/supply
 * Returns breakdown of minted, total, and external supply
 */
export const GET: RequestHandler = async () => {
	const supply = getMonetarySupply();
	return json(supply);
};
