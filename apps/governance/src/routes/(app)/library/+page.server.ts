import type { PageServerLoad, Actions } from './$types.js';
import { searchLibrary, getLibraryStats, saveProseDocument, saveContract, deleteDocument } from '$lib/server/library.js';
import { randomUUID } from 'node:crypto';
import { redirect, fail } from '@sveltejs/kit';
import type { ProseDocument, ContractDocument } from '$lib/server/library-types.js';

export const load: PageServerLoad = async ({ url, locals }) => {
	// Get filter parameters from URL
	const typeParam = url.searchParams.get('type');
	const statusParam = url.searchParams.get('status');
	const queryParam = url.searchParams.get('q');
	const ownerParam = url.searchParams.get('owner');

	// Determine which types to show - default to all types
	const types = typeParam ? typeParam.split(',') : ['governing', 'motion', 'prose', 'contract'];

	// Determine owner filter
	// 'all' = no filter (show everything)
	// 'mine' or default = show only user's documents
	let ownerFilter: string | string[] | undefined;
	if (ownerParam === 'all') {
		ownerFilter = undefined; // Show all documents
	} else {
		// Show only user's documents
		ownerFilter = locals.person?.uuid;
	}

	// Search library items
	const items = searchLibrary({
		type: types,
		status: statusParam || undefined,
		query: queryParam || undefined,
		owner_uuid: ownerFilter,
	});

	// Get statistics
	const stats = getLibraryStats();

	return {
		items,
		stats,
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
