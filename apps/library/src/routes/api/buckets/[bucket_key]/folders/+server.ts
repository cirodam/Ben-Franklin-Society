import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types.js';
import { listRootFolders } from '$lib/server/folders.js';
import { getBucket } from '$lib/server/buckets.js';

/**
 * GET /api/buckets/[bucket_key]/folders
 * List folders in a bucket (root level)
 */
export const GET: RequestHandler = async ({ params, locals }) => {
	const session = locals.session;
	if (!session) {
		throw error(401, 'Not authenticated');
	}

	const bucketKey = params.bucket_key;

	// Parse bucket key (split on first dash only, since owner_id may contain dashes)
	const dashIndex = bucketKey.indexOf('-');
	const ownerType = bucketKey.substring(0, dashIndex);
	const ownerId = bucketKey.substring(dashIndex + 1);
	if (ownerType !== 'user' && ownerType !== 'association') {
		throw error(400, 'Invalid bucket_key format');
	}

	try {
		// Get bucket
		const bucket = getBucket(ownerType as 'user' | 'association', ownerId);
		if (!bucket) {
			throw error(404, 'Bucket not found');
		}

		// Verify access (user buckets use person_uuid)
		if (bucket.owner_type === 'user' && bucket.owner_id !== session.person_uuid) {
			throw error(403, 'Not authorized to access this bucket');
		}

		// List root folders in this bucket
		const folders = listRootFolders(bucket.id);

		return json({ folders });
	} catch (err: any) {
		console.error('[library/api/buckets/folders] List error:', err);
		if (err.status) throw err;
		throw error(500, 'Failed to list folders');
	}
};
