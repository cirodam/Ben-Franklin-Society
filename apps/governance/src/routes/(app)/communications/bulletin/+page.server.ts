import { db } from '$lib/server/db.js';
import { fail, redirect } from '@sveltejs/kit';
import { randomUUID } from 'node:crypto';
import type { Actions, PageServerLoad } from './$types.js';

export const load: PageServerLoad = async () => {

	const posts = db.prepare(`
		SELECT 
			bp.uuid,
			bp.title,
			bp.body,
			bp.created_at,
			bp.updated_at,
			bp.expires_at,
			p.given_name,
			p.family_name,
			p.handle,
			(SELECT COUNT(*) FROM bulletin_comment WHERE post_uuid = bp.uuid AND deleted_at IS NULL) as comment_count
		FROM bulletin_post bp
		JOIN person p ON bp.author_uuid = p.uuid
		WHERE bp.deleted_at IS NULL
			AND (bp.expires_at IS NULL OR datetime(bp.expires_at) > datetime('now'))
		ORDER BY bp.created_at DESC
	`).all() as Array<{
		uuid: string;
		title: string;
		body: string;
		created_at: string;
		updated_at: string | null;
		expires_at: string | null;
		given_name: string;
		family_name: string;
		handle: string;
		comment_count: number;
	}>;

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

		const uuid = randomUUID();
		const now = new Date().toISOString();

		db.prepare(`
			INSERT INTO bulletin_post (uuid, author_uuid, title, body, created_at)
			VALUES (?, ?, ?, ?, ?)
		`).run(uuid, session.person_uuid, title.trim(), body.trim(), now);

		redirect(303, `/communications/bulletin/${uuid}`);
	}
};
