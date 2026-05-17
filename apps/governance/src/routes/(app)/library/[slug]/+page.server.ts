import { error, fail } from '@sveltejs/kit';
import type { PageServerLoad, Actions } from './$types.js';
import { getDocumentBySlug, updateSection, addSection, deleteSection, updateArticle, addArticle, deleteArticle } from '$lib/server/library.js';
import { hasPermission } from '$lib/server/permissions.js';

export const load: PageServerLoad = async ({ params, locals }) => {
	const document = getDocumentBySlug(params.slug);
	if (!document) error(404, 'Document not found');

	const canEdit = hasPermission(locals.person.uuid, 'documents:edit');

	return { document, canEdit };
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
	}
};
