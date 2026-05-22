import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types.js';
import { uploadFile } from '$lib/server/files.js';
import { getBucket } from '$lib/server/buckets.js';

/**
 * POST /api/files
 * Upload a file to a bucket
 */
export const POST: RequestHandler = async ({ request, locals }) => {
	const session = locals.session;
	if (!session) {
		throw error(401, 'Not authenticated');
	}

	try {
		const formData = await request.formData();
		const file = formData.get('file') as File | null;
		const bucketKey = formData.get('bucket_key') as string | null;
		const folderId = formData.get('folder_id') as string | null;

		if (!file) {
			throw error(400, 'No file provided');
		}

		if (!bucketKey) {
			throw error(400, 'No bucket_key provided');
		}

		// Parse bucket key to get owner type and ID
		const [ownerType, ownerId] = bucketKey.split('-', 2);
		if (ownerType !== 'user' && ownerType !== 'association') {
			throw error(400, 'Invalid bucket_key format');
		}

		// Get bucket
		const bucket = getBucket(ownerType as 'user' | 'association', ownerId);
		if (!bucket) {
			throw error(404, 'Bucket not found');
		}

		// Verify ownership (for now, users can only upload to their own bucket)
		if (ownerType === 'user' && ownerId !== session.acting_as_uuid) {
			throw error(403, 'Not authorized to upload to this bucket');
		}

		// Read file content
		const arrayBuffer = await file.arrayBuffer();
		const content = Buffer.from(arrayBuffer);

		// Upload file
		const fileMetadata = await uploadFile({
			bucketId: bucket.id,
			folderId: folderId ? parseInt(folderId, 10) : undefined,
			filename: file.name,
			content,
			mimeType: file.type || undefined,
			uploadedBy: session.acting_as_uuid,
		});

		return json(fileMetadata, { status: 201 });
	} catch (err: any) {
		console.error('[library/api/files] Upload error:', err);
		if (err.status) throw err; // Re-throw SvelteKit errors
		throw error(500, err.message || 'Failed to upload file');
	}
};
