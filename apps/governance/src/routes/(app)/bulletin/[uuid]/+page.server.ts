import { error, fail, redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types.js';
import { getPost, getComments } from '$lib/server/communications/bulletin/queries.js';
import { canViewPost } from '$lib/server/communications/bulletin/permissions.js';
import { createComment, deletePost, deleteComment } from '$lib/server/communications/bulletin/mutations.js';

export const load: PageServerLoad = async ({ params, locals }) => {
	const session = locals.session;
	if (!session) throw error(401, 'Not authenticated');

	const post = getPost(params.uuid);

	if (!post) {
		throw error(404, 'Notice not found');
	}

	// Check if user can view this post
	if (!canViewPost(post, session.person_uuid)) {
		throw error(403, 'Not authorized to view this post');
	}

	const comments = getComments(params.uuid);

	return { post, comments };
};

export const actions: Actions = {
	comment: async ({ request, locals, params }) => {
		const session = locals.session;
		if (!session) return fail(401, { error: 'Not authenticated' });

		const data = await request.formData();
		const body = data.get('body');

		if (!body || typeof body !== 'string' || body.trim().length === 0) {
			return fail(400, { error: 'Comment cannot be empty' });
		}

		try {
			createComment({
				post_uuid: params.uuid,
				author_uuid: session.person_uuid,
				body: body
			});

			return { success: true };
		} catch (err) {
			return fail(500, { error: err instanceof Error ? err.message : 'Failed to create comment' });
		}
	},

	deletePost: async ({ locals, params }) => {
		const session = locals.session;
		if (!session) return fail(401, { error: 'Not authenticated' });

		try {
			deletePost(params.uuid, session.person_uuid);
			redirect(303, '/');
		} catch (err) {
			return fail(403, { error: err instanceof Error ? err.message : 'Not authorized' });
		}
	},

	deleteComment: async ({ request, locals }) => {
		const session = locals.session;
		if (!session) return fail(401, { error: 'Not authenticated' });

		const data = await request.formData();
		const commentUuid = data.get('comment_uuid');

		if (!commentUuid || typeof commentUuid !== 'string') {
			return fail(400, { error: 'Comment ID required' });
		}

		try {
			deleteComment(commentUuid, session.person_uuid);
			return { success: true };
		} catch (err) {
			return fail(403, { error: err instanceof Error ? err.message : 'Not authorized' });
		}
	}
};
