import { fail, redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types.js';
import * as bulletin from '$lib/server/communications/bulletin.js';

export const load: PageServerLoad = async () => {
	const posts = bulletin.getSocietyPosts();
	return { posts };
};

export const actions: Actions = {
	default: async ({ request, locals }) => {
		const session = locals.session;
		if (!session) return fail(401, { error: 'Not authenticated' });

		const data = await request.formData();
		const title = data.get('title');
		const body = data.get('body');

		if (!title || typeof title !== 'string' || title.trim().length === 0) {
			return fail(400, { error: 'Title is required' });
		}

		if (!body || typeof body !== 'string' || body.trim().length === 0) {
			return fail(400, { error: 'Body is required' });
		}

		try {
			const uuid = bulletin.createPost({
				author_uuid: session.person_uuid,
				association_uuid: null, // Society-wide post
				title: title,
				body: body
			});

			redirect(303, `/bulletin/${uuid}`);
		} catch (err) {
			return fail(500, { error: err instanceof Error ? err.message : 'Failed to create post' });
		}
	}
};
