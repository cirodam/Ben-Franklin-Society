import { fail, redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types.js';
import { getSocietyPosts } from '$lib/server/communications/bulletin/queries.js';
import { createPost } from '$lib/server/communications/bulletin/mutations.js';
import { getCommunityConfig } from '$lib/server/infrastructure/config.js';

export const load: PageServerLoad = async () => {
	const posts = getSocietyPosts();
	const serviceUrls = {
		bank: getCommunityConfig('bank_url') || '',
		mail: getCommunityConfig('mail_url') || '',
		marketplace: getCommunityConfig('marketplace_url') || '',
		library: getCommunityConfig('library_url') || '',
	};
	return { posts, serviceUrls };
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
			const uuid = createPost({
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
