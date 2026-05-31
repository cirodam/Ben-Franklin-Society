import { error, json } from '@sveltejs/kit';
import type { RequestHandler } from './$types.js';
import { deleteFolder, getFolder, renameFolder } from '$lib/server/folders.js';
import { getBucketById } from '$lib/server/buckets.js';

/**
 * DELETE /api/folders/[id]
 * Delete a folder (only if empty)
 */
export const DELETE: RequestHandler = async ({ params, locals }) => {
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

		// Verify user has access to this bucket (user buckets use person_uuid)
		if (bucket.owner_type === 'user' && bucket.owner_id !== session.person_uuid) {
			throw error(403, 'Not authorized to delete this folder');
		}

		// Delete the folder
		deleteFolder(folderId);

		return new Response(null, { status: 204 });
	} catch (err: any) {
		console.error('[library/api/folders] Delete error:', err);
		if (err.status) throw err;
		throw error(500, err.message || 'Failed to delete folder');
	}
};

/**
 * PATCH /api/folders/[id]
 * Update a folder (rename)
 */
export const PATCH: RequestHandler = async ({ params, request, locals }) => {
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

		// Verify user has access to this bucket (user buckets use person_uuid)
		if (bucket.owner_type === 'user' && bucket.owner_id !== session.person_uuid) {
			throw error(403, 'Not authorized to update this folder');
		}

		// Parse request body
		const data = await request.json();
		if (!data.name) {
			throw error(400, 'name is required');
		}

		// Rename folder
		const updatedFolder = renameFolder(folderId, data.name);

		return json(updatedFolder);
	} catch (err: any) {
		console.error('[library/api/folders] Update error:', err);
		if (err.status) throw err;
		throw error(500, err.message || 'Failed to update folder');
	}
};
