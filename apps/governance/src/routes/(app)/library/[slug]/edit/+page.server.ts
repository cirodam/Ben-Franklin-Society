import type { PageServerLoad, Actions } from './$types.js';
import { getMotionBySlug, saveMotion } from '$lib/server/documents/society-motions.js';
import { loadGoverningDocument, saveGoverningDocument } from '$lib/server/documents/society-governing.js';
import { error, fail } from '@sveltejs/kit';
import { db } from '$lib/server/db.js';
import type { MotionDocument, GoverningDocument } from '@bfs/types';

export const load: PageServerLoad = async ({ params }) => {
	// Check document type first
	const item = db
		.prepare('SELECT type FROM library_item WHERE slug = ?')
		.get(params.slug) as { type: string } | undefined;

	if (!item) {
		throw error(404, 'Document not found');
	}

	if (item.type === 'motion') {
		const doc = getMotionBySlug(params.slug);
		if (!doc) throw error(404, 'Motion not found');
		return { document: doc, documentType: 'motion' };
	} else if (item.type === 'governing') {
		const doc = loadGoverningDocument(params.slug);
		if (!doc) throw error(404, 'Governing document not found');
		return { document: doc, documentType: 'governing' };
	} else {
		throw error(400, 'Document type not editable in governance app');
	}
};

export const actions: Actions = {
	save: async ({ request, params }) => {
		const data = await request.formData();
		
		// Check document type
		const item = db
			.prepare('SELECT type FROM library_item WHERE slug = ?')
			.get(params.slug) as { type: string } | undefined;

		if (!item) {
			return fail(404, { error: 'Document not found' });
		}

		if (item.type === 'motion') {
			const doc = getMotionBySlug(params.slug);
			if (!doc || doc.type !== 'motion') {
				return fail(400, { error: 'Invalid motion' });
			}

			const documentJson = data.get('document') as string;

			try {
				const updatedDoc = JSON.parse(documentJson) as MotionDocument;
				
				// Preserve original metadata
				updatedDoc.uuid = doc.uuid;
				updatedDoc.slug = doc.slug;
				updatedDoc.created_at = doc.created_at;
				updatedDoc.owner_uuid = doc.owner_uuid;

				saveMotion(updatedDoc);
				return { success: true };
			} catch (err) {
				console.error('Failed to save motion:', err);
				return fail(400, { error: 'Failed to save motion' });
			}
		} else if (item.type === 'governing') {
			const doc = loadGoverningDocument(params.slug);
			if (!doc || doc.type !== 'governing') {
				return fail(400, { error: 'Invalid governing document' });
			}

			const documentJson = data.get('document') as string;

			try {
				const updatedDoc = JSON.parse(documentJson) as GoverningDocument;
				
				// Preserve original metadata
				updatedDoc.uuid = doc.uuid;
				updatedDoc.slug = doc.slug;
				updatedDoc.created_at = doc.created_at;
				updatedDoc.owner_uuid = doc.owner_uuid;

				saveGoverningDocument(updatedDoc);
				return { success: true };
			} catch (err) {
				console.error('Failed to save governing document:', err);
				return fail(400, { error: 'Failed to save governing document' });
			}
		}

		return fail(400, { error: 'Unsupported document type for governance app' });
	}
};
