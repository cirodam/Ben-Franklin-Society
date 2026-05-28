import { error, json } from '@sveltejs/kit';
import type { RequestHandler } from './$types.js';
import { getFile, readFileContent, deleteFile, moveFile, renameFile } from '$lib/server/files.js';
import { getBucketById } from '$lib/server/buckets.js';

/**
 * GET /api/files/[id]
 * Download a file
 */
export const GET: RequestHandler = async ({ params, locals }) => {
	const session = locals.session;
	if (!session) {
		throw error(401, 'Not authenticated');
	}

	const fileId = parseInt(params.id, 10);
	if (isNaN(fileId)) {
		throw error(400, 'Invalid file ID');
	}

	try {
		const file = getFile(fileId);
		if (!file) {
			throw error(404, 'File not found');
		}

		// Get bucket to verify ownership
		const bucket = getBucketById(file.bucket_id);
		if (!bucket) {
			throw error(404, 'Bucket not found');
		}

		// Verify user has access to this bucket (user buckets use person_uuid)
		if (bucket.owner_type === 'user' && bucket.owner_id !== session.person_uuid) {
			throw error(403, 'Not authorized to access this file');
		}

		// Read file content
		const content = await readFileContent(fileId);

		// Return file with appropriate headers
		return new Response(new Uint8Array(content), {
			headers: {
				'Content-Type': file.mime_type || 'application/octet-stream',
				'Content-Disposition': `attachment; filename="${file.filename}"`,
				'Content-Length': file.size_bytes.toString(),
			},
		});
	} catch (err: any) {
		console.error('[library/api/files/[id]] Download error:', err);
		if (err.status) throw err; // Re-throw SvelteKit errors
		throw error(500, 'Failed to download file');
	}
};

/**
 * DELETE /api/files/[id]
 * Delete a file
 */
export const DELETE: RequestHandler = async ({ params, locals }) => {
	const session = locals.session;
	if (!session) {
		throw error(401, 'Not authenticated');
	}

	const fileId = parseInt(params.id, 10);
	if (isNaN(fileId)) {
		throw error(400, 'Invalid file ID');
	}

	try {
		const file = getFile(fileId);
		if (!file) {
			throw error(404, 'File not found');
		}

		// Get bucket to verify ownership
		const bucket = getBucketById(file.bucket_id);
		if (!bucket) {
			throw error(404, 'Bucket not found');
		}

	// Verify user has access to this bucket (user buckets use person_uuid)
	if (bucket.owner_type === 'user' && bucket.owner_id !== session.person_uuid) {
		throw error(403, 'Not authorized to delete this file');
	}

	// Delete file
	await deleteFile(fileId);

	return new Response(null, { status: 204 });
} catch (err: any) {
		console.error('[library/api/files/[id]] Delete error:', err);
		if (err.status) throw err; // Re-throw SvelteKit errors
		throw error(500, 'Failed to delete file');
	}
};

/**
 * PATCH /api/files/[id]
 * Update a file (move to different folder or rename)
 */
export const PATCH: RequestHandler = async ({ params, request, locals }) => {
	const session = locals.session;
	if (!session) {
		throw error(401, 'Not authenticated');
	}

	const fileId = parseInt(params.id, 10);
	if (isNaN(fileId)) {
		throw error(400, 'Invalid file ID');
	}

	try {
		const file = getFile(fileId);
		if (!file) {
			throw error(404, 'File not found');
		}

		// Get bucket to verify ownership
		const bucket = getBucketById(file.bucket_id);
		if (!bucket) {
			throw error(404, 'Bucket not found');
		}

	// Verify user has access to this bucket (user buckets use person_uuid)
	if (bucket.owner_type === 'user' && bucket.owner_id !== session.person_uuid) {		throw error(403, 'Not authorized to update this file');
	}

	const data = await request.json();
	let updatedFile = file;
		// Handle move operation
		if ('folder_id' in data) {
			const newFolderId = data.folder_id === null ? null : parseInt(data.folder_id, 10);
			updatedFile = moveFile(fileId, newFolderId);
		}

		// Handle rename operation
		if (data.filename) {
			updatedFile = renameFile(fileId, data.filename);
		}

		return json(updatedFile);
	} catch (err: any) {
		console.error('[library/api/files/[id]] Update error:', err);
		if (err.status) throw err; // Re-throw SvelteKit errors
		throw error(500, err.message || 'Failed to update file');
	}
};
