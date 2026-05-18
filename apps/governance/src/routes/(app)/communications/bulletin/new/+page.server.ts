import { fail, redirect } from '@sveltejs/kit';
import { db } from '$lib/server/db.js';
import { randomUUID } from 'node:crypto';
import type { Actions, PageServerLoad } from './$types.js';

export const load: PageServerLoad = async () => {
	return {};
};

export const actions: Actions = {
	default: async ({ request, locals }) => {
		const session = locals.session;
		if (!session) return fail(401, { error: 'Not authenticated' });

		const data = await request.formData();
		const title = data.get('title');
		const body = data.get('body');
		const color = data.get('color');

		if (!title || typeof title !== 'string' || title.trim().length === 0) {
			return fail(400, { error: 'Title is required' });
		}

		if (!body || typeof body !== 'string' || body.trim().length === 0) {
			return fail(400, { error: 'Body is required' });
		}

		if (!color || typeof color !== 'string' || !/^#[0-9A-Fa-f]{6}$/.test(color)) {
			return fail(400, { error: 'Valid color is required' });
		}
		const uuid = randomUUID();
		const now = new Date().toISOString();

		db.prepare(`
			INSERT INTO bulletin_post (uuid, author_uuid, title, body, color, created_at)
			VALUES (?, ?, ?, ?, ?, ?)
		`).run(uuid, session.person_uuid, title.trim(), body.trim(), color, now);

		redirect(303, `/bulletin/${uuid}`);
	}
};
