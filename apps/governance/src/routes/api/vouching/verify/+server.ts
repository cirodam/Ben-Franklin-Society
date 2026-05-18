import { json } from '@sveltejs/kit';
import { respondToVerificationRequest } from '$lib/server/federation/vouching/verifier.js';
import type { RequestHandler } from './$types.js';

/**
 * POST /api/vouching/verify
 * Respond to a verification request from another society
 * Body: VouchVerificationRequest
 */
export const POST: RequestHandler = async ({ request }) => {
	try {
		const verificationRequest = await request.json();

		// Validate request structure
		if (!verificationRequest.type || verificationRequest.type !== 'vouch_verification_request') {
			return json({ error: 'Invalid request type' }, { status: 400 });
		}

		if (
			!verificationRequest.voucher ||
			!verificationRequest.vouched_for ||
			!verificationRequest.requester ||
			!verificationRequest.requested_at
		) {
			return json({ error: 'Missing required request fields' }, { status: 400 });
		}

		const response = respondToVerificationRequest(verificationRequest);

		return json(response);
	} catch (error) {
		console.error('Verification request error:', error);
		return json(
			{ error: error instanceof Error ? error.message : 'Failed to process verification request' },
			{ status: 500 }
		);
	}
};
