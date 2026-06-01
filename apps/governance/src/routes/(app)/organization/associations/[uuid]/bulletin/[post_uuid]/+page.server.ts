import { error, fail } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types.js';
import { getPost, getComments } from '$lib/server/communications/bulletin/queries.js';
import { canViewPost, canEditPost, canDeletePost, canPinPost } from '$lib/server/communications/bulletin/permissions.js';
import { createComment, deletePost as deleteBulletinPost, deleteComment, updatePost, pinPost, unpinPost } from '$lib/server/communications/bulletin/mutations.js';
import { getAssociationByUuid } from '$lib/server/organization/associations.js';

export const load: PageServerLoad = async ({ params, locals }) => {
	const session = locals.session;
	if (!session) throw error(401, 'Not authenticated');

	const association = getAssociationByUuid(params.uuid);
	if (!association) throw error(404, 'Association not found');

	const post = getPost(params.post_uuid);
	if (!post) throw error(404, 'Post not found');

	// Verify this post belongs to this association
	if (post.association_uuid !== params.uuid) {
		throw error(404, 'Post not found in this association');
	}

	// Check if user can view this post
	if (!canViewPost(post, session.person_uuid)) {
		throw error(403, 'You do not have permission to view this post');
	}

	const comments = getComments(params.post_uuid);
	const canEdit = canEditPost(post, session.person_uuid);
	const canDelete = canDeletePost(post, session.person_uuid);
	const canPinAction = canPinPost(params.uuid, session.person_uuid);

	return { association, post, comments, canEdit, canDelete, canPin: canPinAction };
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
				post_uuid: params.post_uuid,
				author_uuid: session.person_uuid,
				body: body
			});
			return { success: true };
		} catch (err) {
			return fail(500, { error: 'Failed to create comment' });
		}
	},

	deletePost: async ({ locals, params }) => {
		const session = locals.session;
		if (!session) return fail(401, { error: 'Not authenticated' });

		try {
			deleteBulletinPost(params.post_uuid, session.person_uuid);
			return { deleted: true };
		} catch (err) {
			return fail(403, { error: err instanceof Error ? err.message : 'Failed to delete post' });
		}
	},

	deleteComment: async ({ request, locals, params }) => {
		const session = locals.session;
		if (!session) return fail(401, { error: 'Not authenticated' });

		const data = await request.formData();
		const commentUuid = data.get('comment_uuid');

		if (!commentUuid || typeof commentUuid !== 'string') {
			return fail(400, { error: 'Invalid comment ID' });
		}

		try {
			deleteComment(commentUuid, session.person_uuid);
			return { success: true };
		} catch (err) {
			return fail(403, { error: err instanceof Error ? err.message : 'Failed to delete comment' });
		}
	},

	pin: async ({ locals, params }) => {
		const session = locals.session;
		if (!session) return fail(401, { error: 'Not authenticated' });

		try {
			pinPost(params.post_uuid, session.person_uuid);
			return { success: true };
		} catch (err) {
			return fail(403, { error: err instanceof Error ? err.message : 'Failed to pin post' });
		}
	},

	unpin: async ({ locals, params }) => {
		const session = locals.session;
		if (!session) return fail(401, { error: 'Not authenticated' });

		try {
			unpinPost(params.post_uuid, session.person_uuid);
			return { success: true };
		} catch (err) {
			return fail(403, { error: err instanceof Error ? err.message : 'Failed to unpin post' });
		}
	}
};
