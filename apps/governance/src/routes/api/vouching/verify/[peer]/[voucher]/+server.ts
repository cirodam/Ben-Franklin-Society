import { json } from '@sveltejs/kit';
import { verifyVouch } from '$lib/server/federation/vouching/verifier.js';
import type { RequestHandler } from './$types.js';

/**
 * GET /api/vouching/verify/:peer/:voucher
 * Query a voucher to verify if they still vouch for a peer
 * Uses cache if available and fresh, otherwise queries voucher endpoint
 */
export const GET: RequestHandler = async ({ params }) => {
	try {
		const { peer, voucher } = params;

		const verification = await verifyVouch({
			peerHandle: peer,
			voucherHandle: voucher
		});

		if (!verification) {
			return json(
				{ error: 'Failed to verify vouch - voucher may be offline or vouch does not exist' },
				{ status: 404 }
			);
		}

		return json(verification);
	} catch (error) {
		console.error('Verify vouch error:', error);
		return json({ error: 'Failed to verify vouch' }, { status: 500 });
	}
};
