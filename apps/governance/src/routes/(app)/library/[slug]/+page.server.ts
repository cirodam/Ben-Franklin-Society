import { error, fail } from '@sveltejs/kit';
import type { PageServerLoad, Actions } from './$types.js';
import { getDocumentBySlug, updateSection, addSection, deleteSection, updateArticle, addArticle, deleteArticle, loadProseDocument, loadContract, loadMotion, loadGoverningDocument, changeDocumentOwner } from '$lib/server/documents/library.js';
import { updateMotion } from '$lib/server/documents/library-motions.js';
import { hasPermission } from '$lib/server/infrastructure/permissions.js';
import { db } from '$lib/server/db.js';

export const load: PageServerLoad = async ({ params, locals }) => {
	// First, check what type of document this is
	const item = db
		.prepare('SELECT type, slug FROM library_item WHERE slug = ?')
		.get(params.slug) as { type: string; slug: string } | undefined;

	if (!item) error(404, 'Document not found');

	// Get list of active members for owner change dropdown
	const members = db
		.prepare(`
			SELECT uuid, given_name || ' ' || family_name as name 
			FROM person 
			WHERE status = 'active'
			ORDER BY family_name, given_name
		`)
		.all() as Array<{ uuid: string; name: string }>;

	// Load based on document type
	if (item.type === 'prose') {
		const document = loadProseDocument(params.slug);
		if (!document) error(404, 'Document not found');

		const canEdit = locals.person?.uuid === document.owner_uuid;
		const canChangeOwner = locals.person?.uuid === document.owner_uuid || hasPermission(locals.person?.uuid, 'documents:edit');
		return { document, canEdit, canChangeOwner, members, documentType: 'prose' };
	} else if (item.type === 'contract') {
		const document = loadContract(params.slug);
		if (!document) error(404, 'Document not found');

		// Contracts can be edited while draft
		const canEdit = document.content.status === 'draft';
		const canChangeOwner = locals.person?.uuid === document.owner_uuid || hasPermission(locals.person?.uuid, 'documents:edit');
		return { document, canEdit, canChangeOwner, members, documentType: 'contract' };
	} else if (item.type === 'governing') {
		const document = loadGoverningDocument(params.slug);
		if (!document) error(404, 'Document not found');

		const canEdit = hasPermission(locals.person.uuid, 'documents:edit');
		const canChangeOwner = hasPermission(locals.person?.uuid, 'documents:edit');
		return { document, canEdit, canChangeOwner, members, documentType: 'governing' };
	} else if (item.type === 'motion') {
		const document = loadMotion(params.slug);
		if (!document) error(404, 'Document not found');

		// Motions can only be edited in draft status by their introducer
		const canEdit = document.content.status === 'draft' && locals.person?.uuid === document.content.introducer_uuid;
		const canChangeOwner = locals.person?.uuid === document.owner_uuid || hasPermission(locals.person?.uuid, 'documents:edit');
		return { document, canEdit, canChangeOwner, members, documentType: 'motion' };
	} else {
		error(404, 'Document type not supported for viewing');
	}
};

export const actions: Actions = {
	updateSection: async ({ params, request, locals }) => {
		if (!hasPermission(locals.person.uuid, 'documents:edit')) {
			return fail(403, { error: 'Permission denied' });
		}

		const data = await request.formData();
		const articleIdx = parseInt(data.get('articleIdx') as string);
		const sectionIdx = parseInt(data.get('sectionIdx') as string);
		const title = data.get('title') as string;
		const body = data.get('body') as string;
		const rationale = data.get('rationale') as string;

		if (!title || !body) {
			return fail(400, { error: 'Title and body are required' });
		}

		try {
			updateSection(params.slug, articleIdx, sectionIdx, {
				title,
				body,
				rationale: rationale || undefined
			});
			return { success: true };
		} catch (err) {
			return fail(500, { error: (err as Error).message });
		}
	},

	addSection: async ({ params, request, locals }) => {
		if (!hasPermission(locals.person.uuid, 'documents:edit')) {
			return fail(403, { error: 'Permission denied' });
		}

		const data = await request.formData();
		const articleIdx = parseInt(data.get('articleIdx') as string);
		const title = data.get('title') as string;
		const body = data.get('body') as string;
		const rationale = data.get('rationale') as string;

		if (!title || !body) {
			return fail(400, { error: 'Title and body are required' });
		}

		try {
			addSection(params.slug, articleIdx, {
				title,
				body,
				rationale: rationale || undefined
			});
			return { success: true };
		} catch (err) {
			return fail(500, { error: (err as Error).message });
		}
	},

	deleteSection: async ({ params, request, locals }) => {
		if (!hasPermission(locals.person.uuid, 'documents:edit')) {
			return fail(403, { error: 'Permission denied' });
		}

		const data = await request.formData();
		const articleIdx = parseInt(data.get('articleIdx') as string);
		const sectionIdx = parseInt(data.get('sectionIdx') as string);

		try {
			deleteSection(params.slug, articleIdx, sectionIdx);
			return { success: true };
		} catch (err) {
			return fail(500, { error: (err as Error).message });
		}
	},

	updateArticle: async ({ params, request, locals }) => {
		if (!hasPermission(locals.person.uuid, 'documents:edit')) {
			return fail(403, { error: 'Permission denied' });
		}

		const data = await request.formData();
		const articleIdx = parseInt(data.get('articleIdx') as string);
		const number = data.get('number') as string;
		const title = data.get('title') as string;

		if (!number || !title) {
			return fail(400, { error: 'Number and title are required' });
		}

		try {
			updateArticle(params.slug, articleIdx, { number, title });
			return { success: true };
		} catch (err) {
			return fail(500, { error: (err as Error).message });
		}
	},

	addArticle: async ({ params, request, locals }) => {
		if (!hasPermission(locals.person.uuid, 'documents:edit')) {
			return fail(403, { error: 'Permission denied' });
		}

		const data = await request.formData();
		const number = data.get('number') as string;
		const title = data.get('title') as string;

		if (!number || !title) {
			return fail(400, { error: 'Number and title are required' });
		}

		try {
			addArticle(params.slug, {
				number,
				title,
				sections: []
			});
			return { success: true };
		} catch (err) {
			return fail(500, { error: (err as Error).message });
		}
	},

	deleteArticle: async ({ params, request, locals }) => {
		if (!hasPermission(locals.person.uuid, 'documents:edit')) {
			return fail(403, { error: 'Permission denied' });
		}

		const data = await request.formData();
		const articleIdx = parseInt(data.get('articleIdx') as string);

		try {
			deleteArticle(params.slug, articleIdx);
			return { success: true };
		} catch (err) {
			return fail(500, { error: (err as Error).message });
		}
	},

	changeOwner: async ({ params, request, locals }) => {
		const data = await request.formData();
		const newOwnerUuid = data.get('newOwnerUuid') as string;

		if (!newOwnerUuid) {
			return fail(400, { error: 'New owner is required' });
		}

		// Get the document to check permissions
		const item = db
			.prepare('SELECT owner_uuid FROM library_item WHERE slug = ?')
			.get(params.slug) as { owner_uuid: string } | undefined;

		if (!item) {
			return fail(404, { error: 'Document not found' });
		}

		// Check if user can change owner (must be current owner or have documents:edit permission)
		const canChangeOwner = locals.person?.uuid === item.owner_uuid || hasPermission(locals.person?.uuid, 'documents:edit');
		
		if (!canChangeOwner) {
			return fail(403, { error: 'Permission denied' });
		}

		try {
			const success = changeDocumentOwner(params.slug, newOwnerUuid);
			if (!success) {
				return fail(500, { error: 'Failed to change document owner' });
			}
			return { success: true };
		} catch (err) {
			return fail(500, { error: (err as Error).message });
		}
	},

	updateMotion: async ({ params, request, locals }) => {
		const data = await request.formData();
		
		// Get the motion to check permissions
		const motion = loadMotion(params.slug);
		if (!motion) {
			return fail(404, { error: 'Motion not found' });
		}

		// Check permissions: must be owner/introducer and motion must be in draft
		const canEdit = motion.content.status === 'draft' && locals.person?.uuid === motion.content.introducer_uuid;
		if (!canEdit) {
			return fail(403, { error: 'Permission denied' });
		}

		// Parse provisions from form data
		const provisionsJson = data.get('provisions') as string;
		
		try {
			const provisions = JSON.parse(provisionsJson);
			updateMotion(params.slug, {
				provisions,
			});
			return { success: true };
		} catch (err) {
			return fail(500, { error: (err as Error).message });
		}
	}
};
