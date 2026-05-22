import type { PageServerLoad, Actions } from './$types.js';
import { loadProseDocument, saveProseDocument, loadContract, saveContract } from '$lib/server/documents/library.js';
import { error, fail } from '@sveltejs/kit';
import { db } from '$lib/server/db.js';
import type { ProseDocument, ContractDocument } from '@bfs/types';

export const load: PageServerLoad = async ({ params }) => {
	// Check document type first
	const item = db
		.prepare('SELECT type FROM library_item WHERE slug = ?')
		.get(params.slug) as { type: string } | undefined;

	if (!item) {
		throw error(404, 'Document not found');
	}

	if (item.type === 'prose') {
		const doc = loadProseDocument(params.slug);
		if (!doc) throw error(404, 'Document not found');
		return { document: doc, documentType: 'prose' };
	} else if (item.type === 'contract') {
		const doc = loadContract(params.slug);
		if (!doc) throw error(404, 'Document not found');
		return { document: doc, documentType: 'contract' };
	} else {
		throw error(400, 'Document type not editable');
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

		if (item.type === 'prose') {
			const doc = loadProseDocument(params.slug);
			if (!doc || doc.type !== 'prose') {
				return fail(400, { error: 'Invalid document' });
			}

			// Get paragraphs from form data
			const paragraphsJson = data.get('paragraphs') as string;
			const title = data.get('title') as string;
			const status = data.get('status') as 'draft' | 'published' | 'archived';
			const summary = data.get('summary') as string;
			const tags = data.get('tags') as string;

			try {
				const paragraphs = JSON.parse(paragraphsJson);
				
				const updatedDoc: ProseDocument = {
					...doc,
					title,
					content: {
						...doc.content,
						status,
						paragraphs,
						summary: summary || undefined,
						tags: tags ? tags.split(',').map(t => t.trim()) : undefined,
					}
				};

				saveProseDocument(updatedDoc);
				return { success: true };
			} catch (err) {
				return fail(400, { error: 'Failed to save document' });
			}
		} else if (item.type === 'contract') {
			const doc = loadContract(params.slug);
			if (!doc || doc.type !== 'contract') {
				return fail(400, { error: 'Invalid document' });
			}

			const title = data.get('title') as string;
			const status = data.get('status') as 'draft' | 'active' | 'completed' | 'terminated';
			const body = data.get('body') as string;
			
			// Party A
			const partyAName = data.get('party_a_name') as string;
			const partyARole = data.get('party_a_role') as string;
			const partyAUuid = data.get('party_a_uuid') as string;
			
			// Party B
			const partyBName = data.get('party_b_name') as string;
			const partyBRole = data.get('party_b_role') as string;
			const partyBUuid = data.get('party_b_uuid') as string;
			
			// Dates
			const effectiveDate = data.get('effective_date') as string;
			const expiryDate = data.get('expiry_date') as string;

			try {
				const updatedDoc: ContractDocument = {
					...doc,
					title,
					content: {
						...doc.content,
						status,
						body,
						party_a: {
							principal_uuid: partyAUuid || '',
							principal_name: partyAName || '',
							role: partyARole || ''
						},
						party_b: {
							principal_uuid: partyBUuid || '',
							principal_name: partyBName || '',
							role: partyBRole || ''
						},
						effective_date: effectiveDate || undefined,
						expiry_date: expiryDate || undefined,
					}
				};

				saveContract(updatedDoc);
				return { success: true };
			} catch (err) {
				return fail(400, { error: 'Failed to save contract' });
			}
		}

		return fail(400, { error: 'Unsupported document type' });
	}
};
