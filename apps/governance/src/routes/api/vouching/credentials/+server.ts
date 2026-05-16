import { json } from '@sveltejs/kit';
import { storeCredential, getCredentials } from '$lib/server/vouching/receiver.js';
import type { RequestHandler } from './$types.js';

/**
 * POST /api/vouching/credentials
 * Receive and store a vouch credential from another society
 * Body: VouchCredential
 */
export const POST: RequestHandler = async ({ request }) => {
	try {
		const credential = await request.json();

		// Validate credential structure
		if (!credential.type || credential.type !== 'society_vouch') {
			return json(
				{ error: 'Invalid credential type' },
				{ status: 400 }
			);
		}

		if (!credential.vouch_id || !credential.voucher || !credential.vouched_for ||
		    !credential.vouch_type || !credential.confidence || !credential.issued_at ||
		    !credential.signature) {
			return json(
				{ error: 'Missing required credential fields' },
				{ status: 400 }
			);
		}

		storeCredential(credential);

		return json({
			success: true,
			credential_id: credential.vouch_id
		});
	} catch (error) {
		console.error('Store credential error:', error);
		return json(
			{ error: error instanceof Error ? error.message : 'Failed to store credential' },
			{ status: 500 }
		);
	}
};

/**
 * GET /api/vouching/credentials
 * Get vouch credentials we hold (vouches others have given us)
 * Query params: ?voucher=handle&vouch_type=general&verified=true
 */
export const GET: RequestHandler = async ({ url }) => {
	try {
		const voucher = url.searchParams.get('voucher') || undefined;
		const vouchType = url.searchParams.get('vouch_type') as any || undefined;
		const verifiedStr = url.searchParams.get('verified');
		const verified = verifiedStr ? verifiedStr === 'true' : undefined;

		const credentials = getCredentials({
			voucher,
			vouchType,
			verified
		});

		return json({
			credentials,
			total: credentials.length
		});
	} catch (error) {
		console.error('Get credentials error:', error);
		return json(
			{ error: 'Failed to get credentials' },
			{ status: 500 }
		);
	}
};
