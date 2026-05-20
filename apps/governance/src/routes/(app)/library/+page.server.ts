import type { PageServerLoad, Actions } from './$types.js';
import { searchLibrary, getLibraryStats, saveProseDocument, saveContract, deleteDocument } from '$lib/server/documents/library.js';
import { randomUUID } from 'node:crypto';
import { redirect, fail } from '@sveltejs/kit';
import type { ProseDocument, ContractDocument } from '$lib/server/documents/library-types.js';
import { db } from '$lib/server/db.js';

export const load: PageServerLoad = async ({ url, locals }) => {
	// Get filter parameters from URL
	const typeParam = url.searchParams.get('type');
	const statusParam = url.searchParams.get('status');
	const queryParam = url.searchParams.get('q');
	const ownerParam = url.searchParams.get('owner');

	// Determine which types to show - default to all types
	const types = typeParam ? typeParam.split(',') : ['governing', 'motion', 'prose', 'contract'];

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
		title: string;
		owner_uuid: string;
		created_at: string;
		updated_at: string;
		metadata_json: string;
		given_name: string | null;
		family_name: string | null;
		handle: string | null;
		association_name: string | null;
		association_handle: string | null;
	}>;

	// Parse metadata and determine owner display name
	const itemsWithMetadata = items.map(item => ({
		...item,
		metadata: JSON.parse(item.metadata_json || '{}'),
		owner_name: item.given_name 
			? `${item.given_name} ${item.family_name}`
			: (item.association_name || 'Unknown'),
		owner_handle: item.handle || item.association_handle || 'unknown'
	}));

	// Get statistics
	const stats = getLibraryStats();

	return {
		items: itemsWithMetadata,
		stats: getLibraryStats(),
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
};
