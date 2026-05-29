import type { PageServerLoad, Actions } from './$types.js';
import { fail, redirect } from '@sveltejs/kit';
import { loadGoverningDocument, saveGoverningDocument } from '$lib/server/documents/society-governing.js';
import type { Article } from '@bfs/types';

export const load: PageServerLoad = async ({ params, locals }) => {
	if (!locals.person) {
		throw redirect(303, '/login');
	}

	// Only load from inbox (documents under consideration)
	const doc = loadGoverningDocument(params.slug, 'inbox');
	
	if (!doc) {
		// Document either doesn't exist or is not in inbox
		throw redirect(303, `/library/${params.slug}`);
	}

	return {
		document: doc,
		person: locals.person
	};
};

export const actions: Actions = {
	default: async ({ request, params, locals }) => {
		if (!locals.person) {
			return fail(401, { error: 'Not authenticated' });
		}

		// Only allow editing documents in inbox
		const doc = loadGoverningDocument(params.slug, 'inbox');
		if (!doc) {
			return fail(404, { error: 'Document not found in inbox' });
		}

		const data = await request.formData();
		const title = data.get('title') as string;
		const seniority = data.get('seniority') as string;
		const preamble = data.get('preamble') as string;
		const articlesJson = data.get('articles') as string;

		// Validation
		if (!title || title.trim().length === 0) {
			return fail(400, { error: 'Title is required' });
		}

		if (!seniority) {
			return fail(400, { error: 'Seniority level is required' });
		}

		const validSeniority = ['charter', 'constitution', 'bylaw', 'ordinance', 'regulation', 'policy'];
		if (!validSeniority.includes(seniority)) {
			return fail(400, { error: 'Invalid seniority level' });
		}

		let articles: Article[] = [];
		try {
			articles = JSON.parse(articlesJson);
		} catch {
			return fail(400, { error: 'Invalid articles data' });
		}

		// Update the document
		const updatedDoc = {
			...doc,
			title,
			updated_at: new Date().toISOString(),
			content: {
				...doc.content,
				seniority: seniority as any,
				articles,
				preamble: preamble?.trim() || undefined
			}
		};

		// Save back to inbox
		saveGoverningDocument(updatedDoc, 'inbox');

		throw redirect(303, `/library/${params.slug}`);
	}
};
