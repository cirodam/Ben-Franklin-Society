import { error, fail, redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types.js';
import { getAssociationPosts } from '$lib/server/communications/bulletin/queries.js';
import { createPost } from '$lib/server/communications/bulletin/mutations.js';
import { getAssociationByUuid } from '$lib/server/organization/associations.js';

export const load: PageServerLoad = async ({ params, locals }) => {
	const session = locals.session;
	if (!session) throw error(401, 'Not authenticated');

	const association = getAssociationByUuid(params.uuid);
	if (!association) throw error(404, 'Association not found');

	const posts = getAssociationPosts(params.uuid, session.person_uuid);

	return { association, posts };
};

export const actions: Actions = {
	default: async ({ request, locals, params }) => {
		const session = locals.session;
		if (!session) return fail(401, { error: 'Not authenticated' });

		const association = getAssociationByUuid(params.uuid);
		if (!association) return fail(404, { error: 'Association not found' });

		const data = await request.formData();
		const title = data.get('title');
		const body = data.get('body');
		const visibility = data.get('visibility') as 'public' | 'members_only' | 'officers_only' | null;
		const category = data.get('category') as
			| 'announcement'
			| 'discussion'
			| 'question'
			| 'event'
			| 'policy'
			| null;

		if (!title || typeof title !== 'string' || title.trim().length === 0) {
			return fail(400, { error: 'Title is required' });
		}

		if (!body || typeof body !== 'string' || body.trim().length === 0) {
			return fail(400, { error: 'Body is required' });
		}

		try {
			const uuid = createPost({
				author_uuid: session.person_uuid,
				association_uuid: params.uuid,
				title: title,
				body: body,
				visibility: visibility || 'public',
				category: category || null
			});

			redirect(303, `/organization/associations/${params.uuid}/bulletin/${uuid}`);
		} catch (err) {
			return fail(403, { error: err instanceof Error ? err.message : 'Failed to create post' });
		}
	}
};
