import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

/**
 * GET /api/demurrage/operations/:uuid/charges
 * Returns demurrage transactions for this operation
 * Note: Charges are now tracked as transactions with type='demurrage'
 */
export const GET: RequestHandler = async () => {
	return json({ 
		message: 'Charge details removed - see transactions with type=demurrage',
		charges: [] 
	});
};
