import { error, fail, redirect } from '@sveltejs/kit';
import { db } from '$lib/server/db.js';
import { randomUUID } from 'node:crypto';
import type { Actions, PageServerLoad } from './$types.js';

export const load: PageServerLoad = async ({ params }) => {

	const post = db.prepare(`
		SELECT 
			bp.uuid,
			bp.title,
			bp.body,
			bp.created_at,
			bp.updated_at,
			bp.expires_at,
			bp.author_uuid,
			p.given_name,
			p.family_name,
			p.handle
		FROM bulletin_post bp
		JOIN person p ON bp.author_uuid = p.uuid
		WHERE bp.uuid = ? AND bp.deleted_at IS NULL
	`).get(params.uuid) as {
		uuid: string;
		title: string;
		body: string;
		created_at: string;
		updated_at: string | null;
		expires_at: string | null;
		author_uuid: string;
		given_name: string;
		family_name: string;
		handle: string;
	} | undefined;

	if (!post) {
		throw error(404, 'Notice not found');
	}

	const comments = db.prepare(`
		SELECT 
			bc.uuid,
			bc.body,
			bc.quoted_author_name,
			bc.quoted_excerpt,
			bc.quoted_reply_id,
			bc.created_at,
			bc.author_uuid,
			p.given_name,
			p.family_name,
			p.handle
		FROM bulletin_comment bc
		JOIN person p ON bc.author_uuid = p.uuid
		WHERE bc.post_uuid = ? AND bc.deleted_at IS NULL
		ORDER BY bc.created_at ASC
	`).all(params.uuid) as Array<{
		uuid: string;
		body: string;
		quoted_author_name: string | null;
		quoted_excerpt: string | null;
		quoted_reply_id: string | null;
		created_at: string;
		author_uuid: string;
		given_name: string;
		family_name: string;
		handle: string;
	}>;

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

		const uuid = randomUUID();
		const now = new Date().toISOString();

		db.prepare(`
			INSERT INTO bulletin_comment (uuid, post_uuid, author_uuid, body, created_at)
			VALUES (?, ?, ?, ?, ?)
		`).run(uuid, params.uuid, session.person_uuid, body.trim(), now);

		return { success: true };
	},

	deletePost: async ({ locals, params }) => {
		const session = locals.session;
		if (!session) return fail(401, { error: 'Not authenticated' });
		
		const post = db.prepare('SELECT author_uuid FROM bulletin_post WHERE uuid = ?').get(params.uuid) as { author_uuid: string } | undefined;
		
		if (!post) {
			return fail(404, { error: 'Post not found' });
		}

		if (post.author_uuid !== session.person_uuid) {
			return fail(403, { error: 'You can only delete your own posts' });
		}

		const now = new Date().toISOString();
		db.prepare('UPDATE bulletin_post SET deleted_at = ? WHERE uuid = ?').run(now, params.uuid);

		redirect(303, '/communications/bulletin');
	},

	deleteComment: async ({ request, locals, params }) => {
		const session = locals.session;
		if (!session) return fail(401, { error: 'Not authenticated' });

		const data = await request.formData();
		const commentUuid = data.get('comment_uuid');

		if (!commentUuid || typeof commentUuid !== 'string') {
			return fail(400, { error: 'Comment ID required' });
		}
		
		const comment = db.prepare('SELECT author_uuid FROM bulletin_comment WHERE uuid = ?').get(commentUuid) as { author_uuid: string } | undefined;
		
		if (!comment) {
			return fail(404, { error: 'Comment not found' });
		}

		if (comment.author_uuid !== session.person_uuid) {
			return fail(403, { error: 'You can only delete your own comments' });
		}

		const now = new Date().toISOString();
		db.prepare('UPDATE bulletin_comment SET deleted_at = ? WHERE uuid = ?').run(now, commentUuid);

		return { success: true };
	}
};
