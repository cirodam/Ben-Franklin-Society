import { json } from '@sveltejs/kit';
import { getInitializationStatus, initializeAsChild, initializeAsRoot } from '$lib/server/lineage/initialization.js';
import type { RequestHandler } from './$types.js';

/**
 * GET /api/founding/status
 * Get initialization status of this society
 */
export const GET: RequestHandler = async () => {
	try {
		const status = getInitializationStatus();
		return json(status);
	} catch (error) {
		console.error('Get initialization status error:', error);
		return json(
			{ error: 'Failed to get initialization status' },
			{ status: 500 }
		);
	}
};

/**
 * POST /api/founding/initialize
 * Initialize this society (either as child or root)
 * Body for child: {
 *   type: 'child',
 *   handle: string,
 *   uuid: string,
 *   public_key: string,
 *   private_key_encrypted: string,
 *   founding_record: FoundingRecord,
 *   endpoint: string,
 *   register_with_federation?: boolean
 * }
 * Body for root: {
 *   type: 'root',
 *   handle: string,
 *   uuid: string,
 *   public_key: string,
 *   private_key_encrypted: string
 * }
 */
export const POST: RequestHandler = async ({ request }) => {
	try {
		const body = await request.json();
		const { type } = body;

		if (type === 'child') {
			const { handle, uuid, public_key, private_key_encrypted, founding_record, endpoint, register_with_federation } = body;

			if (!handle || !uuid || !public_key || !private_key_encrypted || !founding_record || !endpoint) {
				return json(
					{ error: 'Missing required fields for child initialization' },
					{ status: 400 }
				);
			}

			const result = await initializeAsChild({
				handle,
				uuid,
				publicKey: public_key,
				privateKeyEncrypted: private_key_encrypted,
				foundingRecord: founding_record,
				endpoint,
				registerWithFed: register_with_federation !== false
			});

			return json({
				success: true,
				...result
			});
		} else if (type === 'root') {
			const { handle, uuid, public_key, private_key_encrypted } = body;

			if (!handle || !uuid || !public_key || !private_key_encrypted) {
				return json(
					{ error: 'Missing required fields for root initialization' },
					{ status: 400 }
				);
			}

			initializeAsRoot({
				handle,
				uuid,
				publicKey: public_key,
				privateKeyEncrypted: private_key_encrypted
			});

			return json({
				success: true,
				type: 'root',
				handle
			});
		} else {
			return json(
				{ error: 'Invalid initialization type. Must be "child" or "root"' },
				{ status: 400 }
			);
		}
	} catch (error) {
		console.error('Initialize society error:', error);
		return json(
			{ error: error instanceof Error ? error.message : 'Failed to initialize society' },
			{ status: 500 }
		);
	}
};
