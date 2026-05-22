import { redirect } from '@sveltejs/kit';
import type { PageServerLoad, Actions } from './$types.js';
import { randomUUID } from 'node:crypto';
import { writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { db } from '$lib/server/db.js';
import type { GoverningDocument } from '@bfs/types';
import { getUserBuckets } from '$lib/server/buckets.js';

export const load: PageServerLoad = async ({ locals }) => {
	if (!locals.session) {
		redirect(302, '/auth/login');
	}

	const buckets = getUserBuckets(locals.session.acting_as_uuid);

	return {
		session: locals.session,
		buckets
	};
};

export const actions: Actions = {
	default: async ({ request, locals }) => {
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
			const doc: GoverningDocument = JSON.parse(documentJson);

			// Validate document structure
			if (!doc.uuid || !doc.type || !doc.title || !doc.content) {
				return { success: false, error: 'Invalid document structure' };
			}

			// Get bucket
			const bucket = db.prepare('SELECT * FROM library_bucket WHERE bucket_key = ?').get(bucket_key) as any;
			if (!bucket) {
				return { success: false, error: 'Bucket not found' };
			}

			// Verify access to bucket
			const hasAccess = db.prepare(`
				SELECT 1 FROM library_bucket_access
				WHERE bucket_id = ? AND principal_uuid = ?
			`).get(bucket.id, locals.session.acting_as_uuid);

			if (!hasAccess) {
				return { success: false, error: 'No access to this bucket' };
			}

			// Generate filename
			const filename = `${doc.slug || doc.uuid}.json`;
			const storagePath = `${randomUUID()}.json`;
			const fullPath = join(process.cwd(), 'data', 'library-files', storagePath);

			// Write JSON file
			await writeFile(fullPath, JSON.stringify(doc, null, 2), 'utf-8');

			// Insert into database
			const result = db.prepare(`
				INSERT INTO library_file (
					bucket_id, folder_id, filename, size_bytes, mime_type,
					storage_path, hash, uploaded_by, uploaded_at
				) VALUES (?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))
			`).run(
				bucket.id,
				folder_id || null,
				filename,
				Buffer.byteLength(JSON.stringify(doc)),
				'application/json',
				storagePath,
				'', // TODO: compute hash
				locals.session.person_uuid
			);

			redirect(303, `/?bucket=${bucket_key}`);
		} catch (error) {
			console.error('Error creating governing document:', error);
			return { success: false, error: 'Failed to create document' };
		}
	}
};
