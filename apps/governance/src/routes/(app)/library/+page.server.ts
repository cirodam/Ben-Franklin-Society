import type { PageServerLoad, Actions } from './$types.js';
import { searchLibrary, getLibraryStats, saveProseDocument, saveContract, deleteDocument, saveMotion, saveGoverningDocument } from '$lib/server/documents/society-docs.js';
import { createMotion } from '$lib/server/documents/society-motions.js';
import { randomUUID } from 'node:crypto';
import { redirect, fail } from '@sveltejs/kit';
import type { ProseDocument, ContractDocument } from '@bfs/types';
import { db } from '$lib/server/db.js';

export const load: PageServerLoad = async ({ url, locals }) => {
	// Get filter parameters from URL
	const typeParam = url.searchParams.get('type');
	const statusParam = url.searchParams.get('status');
	const queryParam = url.searchParams.get('q');
	const ownerParam = url.searchParams.get('owner');

	// Society Code: Only show motions and governing documents
	const types = typeParam ? typeParam.split(',') : ['governing', 'motion'];

	// Build query with owner name JOIN (supports both person and association owners)
	let query = `
		SELECT 
			li.*,
			p.given_name,
			p.family_name,
			p.handle,
			a.name as association_name,
			a.handle as association_handle
		FROM library_item li
		LEFT JOIN person p ON li.owner_uuid = p.uuid
		LEFT JOIN association a ON li.owner_uuid = a.uuid
		WHERE 1=1
	`;
	const params: any[] = [];

	// Filter by type
	if (types.length > 0) {
		const placeholders = types.map(() => '?').join(', ');
		query += ` AND li.type IN (${placeholders})`;
		params.push(...types);
	}

	// Filter by owner (only filter by person ownership)
	if (ownerParam !== 'all' && locals.person?.uuid) {
		query += ' AND li.owner_uuid = ?';
		params.push(locals.person.uuid);
	}

	// Search query
	if (queryParam) {
		query += ' AND (li.title LIKE ? OR li.slug LIKE ?)';
		const searchTerm = `%${queryParam}%`;
		params.push(searchTerm, searchTerm);
	}

	query += ' ORDER BY li.updated_at DESC';

	const items = db.prepare(query).all(...params) as Array<{
		uuid: string;
		type: string;
		slug: string;
		document_id: string | null;
		version: number;
		title: string;
		owner_uuid: string;
		created_at: string;
		updated_at: string;
		file_path: string;
		given_name: string | null;
		family_name: string | null;
		handle: string | null;
		association_name: string | null;
		association_handle: string | null;
	}>;

	// Determine owner display name
	const itemsWithOwner = items.map(item => ({
		...item,
		owner_name: item.given_name 
			? `${item.given_name} ${item.family_name}`
			: (item.association_name || 'Unknown'),
		owner_handle: item.handle || item.association_handle || 'unknown'
	}));

	// Get statistics
	const stats = getLibraryStats();

	return {
		items: itemsWithOwner,
		stats: getLibraryStats(),
		person: locals.person,
		filters: {
			types,
			status: statusParam || 'all',
			query: queryParam || '',
			owner: ownerParam || 'all',
		}
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
