import { error, fail } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types.js';
import * as bulletin from '$lib/server/communications/bulletin.js';
import { getAssociationByUuid } from '$lib/server/organization/associations.js';

export const load: PageServerLoad = async ({ params, locals }) => {
	const session = locals.session;
	if (!session) throw error(401, 'Not authenticated');

	const association = getAssociationByUuid(params.uuid);
	if (!association) throw error(404, 'Association not found');

	const post = bulletin.getPost(params.post_uuid);
	if (!post) throw error(404, 'Post not found');

	// Verify this post belongs to this association
	if (post.association_uuid !== params.uuid) {
		throw error(404, 'Post not found in this association');
	}

	// Check if user can view this post
	if (!bulletin.canViewPost(post, params.uuid, session.person_uuid)) {
		throw error(403, 'You do not have permission to view this post');
	}

	const comments = bulletin.getComments(params.post_uuid);
	const canEdit = bulletin.canEditPost(post.uuid, session.person_uuid);
	const canDelete = bulletin.canDeletePost(post.uuid, session.person_uuid, params.uuid);
	const canPin = bulletin.canPinPost(params.uuid, session.person_uuid);

	return { association, post, comments, canEdit, canDelete, canPin };
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
			bulletin.createComment({
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
			bulletin.deletePost(params.post_uuid, session.person_uuid, params.uuid);
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
			bulletin.deleteComment(commentUuid, session.person_uuid, params.uuid);
			return { success: true };
		} catch (err) {
			return fail(403, { error: err instanceof Error ? err.message : 'Failed to delete comment' });
		}
	},

	pin: async ({ locals, params }) => {
		const session = locals.session;
		if (!session) return fail(401, { error: 'Not authenticated' });

		try {
			bulletin.pinPost(params.post_uuid, params.uuid, session.person_uuid);
			return { success: true };
		} catch (err) {
			return fail(403, { error: err instanceof Error ? err.message : 'Failed to pin post' });
		}
	},

	unpin: async ({ locals, params }) => {
		const session = locals.session;
		if (!session) return fail(401, { error: 'Not authenticated' });

		try {
			bulletin.unpinPost(params.post_uuid, params.uuid, session.person_uuid);
			return { success: true };
		} catch (err) {
			return fail(403, { error: err instanceof Error ? err.message : 'Failed to unpin post' });
		}
	}
};
