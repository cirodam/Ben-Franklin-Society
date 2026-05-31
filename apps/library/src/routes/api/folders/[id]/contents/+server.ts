import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types.js';
import { getFolder, listFolders } from '$lib/server/folders.js';
import { listFiles } from '$lib/server/files.js';
import { getBucketById } from '$lib/server/buckets.js';

/**
 * GET /api/folders/[id]/contents
 * Get contents of a folder (subfolders and files)
 */
export const GET: RequestHandler = async ({ params, locals }) => {
	const session = locals.session;
	if (!session) {
		throw error(401, 'Not authenticated');
	}

	const folderId = parseInt(params.id, 10);
	if (isNaN(folderId)) {
		throw error(400, 'Invalid folder ID');
	}

	try {
		const folder = getFolder(folderId);
		if (!folder) {
			throw error(404, 'Folder not found');
		}

		// Get bucket to verify ownership
		const bucket = getBucketById(folder.bucket_id);
		if (!bucket) {
			throw error(404, 'Bucket not found');
		}

		// Verify access (user buckets use person_uuid)
		if (bucket.owner_type === 'user' && bucket.owner_id !== session.person_uuid) {
			throw error(403, 'Not authorized to access this folder');
		}

		// Get subfolders and files
		const subfolders = listSubfolders(folderId);
		const files = listFiles(folder.bucket_id, folderId);

		return json({
			folder,
			subfolders,
			files,
		});
	} catch (err: any) {
		console.error('[library/api/folders/[id]/contents] Get error:', err);
		if (err.status) throw err;
		throw error(500, 'Failed to get folder contents');
	}
};
