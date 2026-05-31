import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types.js';
import { createFolder } from '$lib/server/folders.js';
import { getBucket } from '$lib/server/buckets.js';

/**
 * POST /api/folders
 * Create a new folder
 */
export const POST: RequestHandler = async ({ request, locals }) => {
	const session = locals.session;
	if (!session) {
		throw error(401, 'Not authenticated');
	}

	try {
		const data = await request.json();
		const { bucket_key, parent_folder_id, name } = data;

		if (!bucket_key) {
			throw error(400, 'bucket_key is required');
		}

		if (!name) {
			throw error(400, 'name is required');
		}

		// Parse bucket key (split on first dash only, since owner_id may contain dashes)
		const dashIndex = bucket_key.indexOf('-');
		const ownerType = bucket_key.substring(0, dashIndex);
		const ownerId = bucket_key.substring(dashIndex + 1);
		if (ownerType !== 'user' && ownerType !== 'association') {
			throw error(400, 'Invalid bucket_key format');
		}

		// Get bucket
		const bucket = getBucket(ownerType as 'user' | 'association', ownerId);
		if (!bucket) {
			throw error(404, 'Bucket not found');
		}

		// Verify ownership (user buckets use person_uuid)
		if (bucket.owner_type === 'user' && bucket.owner_id !== session.person_uuid) {
			throw error(403, 'Not authorized to create folders in this bucket');
		}

		// Create folder
		const folder = createFolder({
			bucketId: bucket.id,
			parentFolderId: parent_folder_id || undefined,
			name,
			createdBy: session.person_uuid,
		});

		return json(folder);
	} catch (err: any) {
		console.error('[library/api/folders] Create error:', err);
		if (err.status) throw err;
		throw error(500, err.message || 'Failed to create folder');
	}
};
