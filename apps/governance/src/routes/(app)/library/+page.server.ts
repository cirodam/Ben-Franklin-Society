import type { PageServerLoad, Actions } from './$types.js';
import { loadGoverningDocument, saveGoverningDocument } from '$lib/server/documents/society-governing.js';
import { loadMotion, saveMotion, listMotions } from '$lib/server/documents/society-motions.js';
import { GOVERNING_DOCS_DIR } from '$lib/server/documents/society-core.js';
import { randomUUID } from 'node:crypto';
import { redirect, fail } from '@sveltejs/kit';
import { existsSync, readdirSync } from 'node:fs';
import type { GoverningDocument, MotionDocument, GoverningStatus, MotionStatus } from '@bfs/types';
import { db } from '$lib/server/db.js';

// Helper to load all governing documents
function getAllGoverningDocs(): GoverningDocument[] {
	const docs: GoverningDocument[] = [];
	if (!existsSync(GOVERNING_DOCS_DIR)) return docs;

	try {
		const files = readdirSync(GOVERNING_DOCS_DIR);
		for (const file of files) {
			if (file.endsWith('.json')) {
				const slug = file.replace('.json', '');
				const doc = loadGoverningDocument(slug);
				if (doc && doc.type === 'governing') {
					docs.push(doc);
				}
			}
		}
	} catch (err) {
		console.error('Error loading governing documents:', err);
	}
	return docs;
}

export const load: PageServerLoad = async ({ url, locals }) => {
	const viewParam = url.searchParams.get('view') || 'enacted';

	// Load all governing documents and motions
	const allGoverningDocs = getAllGoverningDocs();
	const allMotions = listMotions();

	// Group by status category
	const enacted = {
		governing: allGoverningDocs.filter(d => d.content.status === 'enacted'),
		motions: allMotions.filter(m => m.content.status === 'enacted')
	};

	const underConsideration = {
		governing: allGoverningDocs.filter(d => d.content.status === 'draft'),
		motions: allMotions.filter(m => 
			['draft', 'introduced', 'deliberation', 'voting', 'adopted'].includes(m.content.status)
		)
	};

	const archived = {
		governing: allGoverningDocs.filter(d => ['repealed', 'sunsetted'].includes(d.content.status)),
		motions: allMotions.filter(m => ['rejected', 'withdrawn'].includes(m.content.status))
	};

	return {
		enacted,
		underConsideration,
		archived,
		currentView: viewParam,
		person: locals.person
	};
};

export const actions: Actions = {
	create: async ({ request, locals }) => {
		const data = await request.formData();
		const type = data.get('type') as string;
		const title = data.get('title') as string;

		if (!locals.person) {
			return fail(401, { error: 'Not authenticated' });
		}

		if (!title || !type) {
			return fail(400, { error: 'Title and type are required' });
		}

		// Generate slug from title
		const slug = title
			.toLowerCase()
			.replace(/[^a-z0-9]+/g, '-')
			.replace(/^-|-$/g, '');

		// For now, only support creating prose documents
		if (type === 'prose') {
			const doc: ProseDocument = {
				uuid: randomUUID(),
				type: 'prose',
				slug,
				document_id: null,
				version: 1,
				title,
				owner_uuid: locals.person.uuid,
				created_at: new Date().toISOString(),
				updated_at: new Date().toISOString(),
				content: {
					status: 'draft',
					paragraphs: [''],
				},
			};

			saveProseDocument(doc);
			throw redirect(303, `/library/${slug}/edit`);
		}

		if (type === 'contract') {
			const doc: ContractDocument = {
				uuid: randomUUID(),
				type: 'contract',
				slug,
				document_id: null,
				version: 1,
				title,
				owner_uuid: 'SOCIETY', // Contracts are owned by the society
				created_at: new Date().toISOString(),
				updated_at: new Date().toISOString(),
				content: {
					status: 'draft',
					body: '',
					party_a: {
						principal_uuid: '',
						principal_name: '',
						role: ''
					},
					party_b: {
						principal_uuid: '',
						principal_name: '',
						role: ''
					}
				},
			};

			saveContract(doc);
			throw redirect(303, `/library/${slug}/edit`);
		}

		if (type === 'motion') {
			const doc = createMotion({
				slug,
				title,
				provisions: [{ number: '1', text: '' }],
				introducer_uuid: locals.person.uuid,
				owner_uuid: locals.person.uuid,
			});

			throw redirect(303, `/library/${slug}`);
		}

		return fail(400, { error: 'Unsupported document type' });
	},

	delete: async ({ request, locals }) => {
		const data = await request.formData();
		const uuid = data.get('uuid') as string;

		if (!locals.person) {
			return fail(401, { error: 'Not authenticated' });
		}

		if (!uuid) {
			return fail(400, { error: 'Document UUID is required' });
		}

		const success = deleteDocument(uuid);
		
		if (!success) {
			return fail(500, { error: 'Failed to delete document' });
		}

		return { success: true };
	},

	upload: async ({ request, locals }) => {
		if (!locals.person) {
			return fail(401, { error: 'Not authenticated' });
		}

		const data = await request.formData();
		const file = data.get('file') as File;

		if (!file) {
			return fail(400, { error: 'File is required' });
		}

		if (!file.name.endsWith('.json')) {
			return fail(400, { error: 'Only JSON files are supported' });
		}

		try {
			// Read and parse the file
			const text = await file.text();
			const uploadedDoc = JSON.parse(text);

			// Validate required fields
			if (!uploadedDoc.type || !uploadedDoc.title || !uploadedDoc.content) {
				return fail(400, { error: 'Invalid document structure - missing type, title, or content' });
			}

			// Generate fresh identity
			const now = new Date().toISOString();
			const slug = uploadedDoc.title
				.toLowerCase()
				.replace(/[^a-z0-9]+/g, '-')
				.replace(/^-|-$/g, '');

			// Check if slug already exists
			const existing = db
				.prepare('SELECT uuid FROM library_item WHERE slug = ?')
				.get(slug);

			if (existing) {
				return fail(400, { error: `A document with slug "${slug}" already exists` });
			}

			// Build the new document with fresh identity but preserved content
			const newDoc = {
				uuid: randomUUID(),
				type: uploadedDoc.type,
				slug,
				document_id: uploadedDoc.document_id || null, // Preserve document_id
				version: 1,
				title: uploadedDoc.title,
				owner_uuid: locals.person.uuid,
				created_at: now,
				updated_at: now,
				content: uploadedDoc.content,
			};

			// Save based on type
			if (newDoc.type === 'prose') {
				saveProseDocument(newDoc as ProseDocument);
			} else if (newDoc.type === 'contract') {
				saveContract(newDoc as ContractDocument);
			} else if (newDoc.type === 'motion') {
				saveMotion(newDoc);
			} else if (newDoc.type === 'governing') {
				saveGoverningDocument(newDoc);
			} else {
				return fail(400, { error: `Unsupported document type: ${newDoc.type}` });
			}

			throw redirect(303, `/library/${slug}`);
		} catch (err) {
			if (err instanceof SyntaxError) {
				return fail(400, { error: 'Invalid JSON file' });
			}
			// Re-throw redirects
			if (err && typeof err === 'object' && 'status' in err) {
				throw err;
			}
			console.error('Upload error:', err);
			return fail(500, { error: 'Failed to upload document' });
		}
	},
};
