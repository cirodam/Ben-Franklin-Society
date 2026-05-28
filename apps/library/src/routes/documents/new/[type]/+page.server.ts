import { redirect, error } from '@sveltejs/kit';
import type { PageServerLoad, Actions } from './$types.js';
import { randomUUID } from 'node:crypto';
import { writeFile, mkdir } from 'node:fs/promises';
import { join, dirname } from 'node:path';
import { db } from '$lib/server/db.js';
import type { MotionDocument, GoverningDocument } from '@bfs/types';
import { getUserBuckets, canAccessBucket } from '$lib/server/buckets.js';
import { getOidcClient } from '$lib/server/oidc.js';

const VALID_TYPES = ['motion', 'governing'] as const;
type ValidDocumentType = typeof VALID_TYPES[number];

export const load: PageServerLoad = async ({ params, locals, cookies }) => {
	// Validate document type
	if (!VALID_TYPES.includes(params.type as any)) {
		throw error(404, `Invalid document type: ${params.type}`);
	}

	if (!locals.session) {
		redirect(302, '/auth/login');
	}

	// Get access token for API calls
	const accessToken = await getOidcClient().getValidAccessToken(cookies);
	if (!accessToken) {
		throw error(401, 'No access token available');
	}

	const buckets = await getUserBuckets(locals.session.acting_as_uuid, accessToken);

	return {
		session: locals.session,
		buckets,
		documentType: params.type as ValidDocumentType
	};
};

export const actions: Actions = {
	default: async ({ params, request, locals, cookies }) => {
		// Validate document type
		if (!VALID_TYPES.includes(params.type as any)) {
			return { success: false, error: 'Invalid document type' };
		}

		if (!locals.session) {
			return { success: false, error: 'Not authenticated' };
		}

		const formData = await request.formData();
		const bucket_key = formData.get('bucket_key') as string;
		const folder_id = formData.get('folder_id') as string | null;
		const documentJson = formData.get('document') as string;

		if (!bucket_key || !documentJson) {
			return { success: false, error: 'Missing required fields' };
		}

		try {
			const doc: MotionDocument | GoverningDocument = JSON.parse(documentJson);

			// Validate document structure
			if (!doc.uuid || !doc.type || !doc.title || !doc.content) {
				return { success: false, error: 'Invalid document structure' };
			}

			// Validate document type matches route parameter
			if (doc.type !== params.type) {
				return { success: false, error: 'Document type mismatch' };
			}

			// Get access token for access check
			const accessToken = await getOidcClient().getValidAccessToken(cookies);
			if (!accessToken) {
				return { success: false, error: 'Not authenticated' };
			}

			// Get bucket
			const bucket = db.prepare('SELECT * FROM buckets WHERE bucket_key = ?').get(bucket_key) as any;
			if (!bucket) {
				return { success: false, error: 'Bucket not found' };
			}

			// Verify access to bucket
			const hasAccess = await canAccessBucket(locals.session.acting_as_uuid, bucket, accessToken);
			if (!hasAccess) {
				return { success: false, error: 'No access to this bucket' };
			}

			// Generate filename and paths
			const filename = `${doc.slug || doc.uuid}.json`;
			const filePath = folder_id ? `/${folder_id}/${filename}` : `/${filename}`;
			
			// Check if file already exists
			const existingFile = db.prepare(
				'SELECT id FROM files WHERE bucket_id = ? AND path = ?'
			).get(bucket.id, filePath);
			if (existingFile) {
				return { success: false, error: 'A file with this name already exists in this location' };
			}
			
			// Use the same filename for storage (slug or document uuid)
			const storagePath = join(process.cwd(), 'data', 'library-files', filename);

			// Ensure directory exists
			await mkdir(dirname(storagePath), { recursive: true });

			// Write JSON file
			const content = JSON.stringify(doc, null, 2);
			await writeFile(storagePath, content, 'utf-8');

			// Insert into database
			const result = db.prepare(`
				INSERT INTO files (
					bucket_id, folder_id, filename, path, size_bytes, mime_type,
					storage_path, uploaded_by, uploaded_at
				) VALUES (?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))
			`).run(
				bucket.id,
				folder_id || null,
				filename,
				filePath,
				Buffer.byteLength(content),
				'application/json',
				storagePath,
				locals.session.person_uuid
			);
		} catch (error: any) {
			console.error('Error creating document:', error);
			return { success: false, error: 'Failed to create document' };
		}

		// Return success with redirect location
		return { 
			success: true, 
			redirectTo: `/?bucket=${bucket_key}`
		};
	}
};
