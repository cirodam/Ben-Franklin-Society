import type { PageServerLoad, Actions } from './$types.js';
import { fail, redirect } from '@sveltejs/kit';
import { saveGoverningDocument, loadGoverningDocument } from '$lib/server/documents/society-governing.js';
import { getSocietyUuid } from '$lib/server/documents/society-core.js';
import { randomUUID } from 'node:crypto';
import type { GoverningDocument, Article } from '@bfs/types';

export const load: PageServerLoad = async ({ locals }) => {
	if (!locals.person) {
		throw redirect(303, '/login');
	}

	return {
		person: locals.person
	};
};

export const actions: Actions = {
	default: async ({ request, locals }) => {
		if (!locals.person) {
			return fail(401, { error: 'Not authenticated' });
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

		// Generate slug from title
		const slug = title
			.toLowerCase()
			.replace(/[^a-z0-9]+/g, '-')
			.replace(/^-|-$/g, '');

		// Check if slug already exists (search all folders)
		const existing = loadGoverningDocument(slug);
		if (existing) {
			return fail(400, { error: `A document with slug "${slug}" already exists. Please choose a different title.` });
		}

		// Get society UUID
		const societyUuid = getSocietyUuid();
		if (!societyUuid) {
			return fail(500, { error: 'Society not found' });
		}

		// Create the document
		const now = new Date().toISOString();
		const doc: GoverningDocument = {
			uuid: randomUUID(),
			type: 'governing',
			slug,
			document_id: null,
			version: 1,
			title,
			owner_uuid: societyUuid,
			created_at: now,
			updated_at: now,
			content: {
				seniority: seniority as any,
				articles,
				preamble: preamble?.trim() || undefined
			}
		};

		// Save to inbox folder (under consideration)
		saveGoverningDocument(doc, 'inbox');

		throw redirect(303, `/library/${slug}`);
	}
};
