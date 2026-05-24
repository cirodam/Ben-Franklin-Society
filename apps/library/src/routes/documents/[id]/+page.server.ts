import type { PageServerLoad, Actions } from './$types.js';
import { error } from '@sveltejs/kit';
import { getFile, readFileContent } from '$lib/server/files.js';
import { getBucketById } from '$lib/server/buckets.js';
import { getOidcClient } from '$lib/server/oidc.js';
import { join } from 'node:path';

export const load: PageServerLoad = async ({ params, cookies }) => {
	const oidcClient = getOidcClient();
	const session = await oidcClient.getSession(cookies);
	
	if (!session) {
		throw error(401, 'Unauthorized');
	}

	const fileId = parseInt(params.id);
	if (isNaN(fileId)) {
		throw error(400, 'Invalid file ID');
	}

	const file = getFile(fileId);
	if (!file) {
		throw error(404, 'File not found');
	}

	// Get bucket to verify access
	const bucket = getBucketById(file.bucket_id);
	if (!bucket) {
		throw error(404, 'Bucket not found');
	}

	// Read file content
	const content = await readFileContent(fileId);
	const documentData = JSON.parse(content.toString('utf-8'));

	return {
		session,
		file,
		bucket,
		document: documentData
	};
};

export const actions: Actions = {
	save: async ({ params, request, cookies }) => {
		const oidcClient = getOidcClient();
		const session = await oidcClient.getSession(cookies);
		
		if (!session) {
			return { success: false, error: 'Unauthorized' };
		}

		const fileId = parseInt(params.id);
		if (isNaN(fileId)) {
			return { success: false, error: 'Invalid file ID' };
		}

		const file = getFile(fileId);
		if (!file) {
			return { success: false, error: 'File not found' };
		}

		const formData = await request.formData();
		const documentJson = formData.get('document');
		
		if (!documentJson || typeof documentJson !== 'string') {
			return { success: false, error: 'No document data provided' };
		}

		try {
			// Parse to validate JSON
			const document = JSON.parse(documentJson);
			
			// Determine the actual file path
			let actualPath = file.storage_path;
			// If storage_path is just a filename (legacy format), construct full path
			if (!actualPath.includes('/') && !actualPath.includes('\\')) {
				actualPath = join(process.cwd(), 'data', 'library-files', actualPath);
			}
			
			// Write updated document back to file
			const { writeFile } = await import('node:fs/promises');
			await writeFile(actualPath, JSON.stringify(document, null, 2), 'utf-8');

			return { success: true };
		} catch (err) {
			console.error('Failed to save document:', err);
			return { success: false, error: 'Failed to save document' };
		}
	}
};
