import { error, fail } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types.js';
import {
	getThread,
	getCommentsWithAuthors,
	addComment,
	editComment,
	deleteComment,
	isCommentAuthor,
} from '$lib/server/communications/discussions.js';

export const load: PageServerLoad = async ({ params, locals }) => {
	const thread = getThread(params.thread_uuid);
	if (!thread) error(404, 'Discussion not found');

	const comments = getCommentsWithAuthors(params.thread_uuid);
	const actingAs = locals.session?.acting_as_uuid ?? null;

	return {
		thread,
		comments,
		actingAs,
	};
};

export const actions: Actions = {
	comment: async ({ request, locals, params }) => {
		if (!locals.session) return fail(401, { error: 'Not authenticated' });

		const data = await request.formData();
		const body = data.get('body');

		if (!body || typeof body !== 'string' || body.trim().length === 0) {
			return fail(400, { error: 'Comment cannot be empty' });
		}

		try {
			addComment({
				thread_uuid: params.thread_uuid,
				author_uuid: locals.session.acting_as_uuid,
				body: body.trim(),
			});

			return { success: true };
		} catch (err) {
			return fail(500, {
				error: err instanceof Error ? err.message : 'Failed to create comment',
			});
		}
	},

	editComment: async ({ request, locals }) => {
		if (!locals.session) return fail(401, { error: 'Not authenticated' });

		const data = await request.formData();
		const commentUuid = data.get('comment_uuid');
		const body = data.get('body');

		if (!commentUuid || typeof commentUuid !== 'string') {
			return fail(400, { error: 'Comment UUID required' });
		}

		if (!body || typeof body !== 'string' || body.trim().length === 0) {
			return fail(400, { error: 'Comment cannot be empty' });
		}

		// Verify the user is the author
		if (!isCommentAuthor(commentUuid, locals.session.person_uuid)) {
			return fail(403, { error: 'Not authorized to edit this comment' });
		}

		try {
			editComment(commentUuid, body.trim());
			return { success: true };
		} catch (err) {
			return fail(500, {
				error: err instanceof Error ? err.message : 'Failed to edit comment',
			});
		}
	},

	deleteComment: async ({ request, locals }) => {
		if (!locals.session) return fail(401, { error: 'Not authenticated' });

		const data = await request.formData();
		const commentUuid = data.get('comment_uuid');

		if (!commentUuid || typeof commentUuid !== 'string') {
			return fail(400, { error: 'Comment UUID required' });
		}

		// Verify the user is the author
		if (!isCommentAuthor(commentUuid, locals.session.person_uuid)) {
			return fail(403, { error: 'Not authorized to delete this comment' });
		}

		try {
			deleteComment(commentUuid);
			return { success: true };
		} catch (err) {
			return fail(500, {
				error: err instanceof Error ? err.message : 'Failed to delete comment',
			});
		}
	},
};
