import { fail } from '@sveltejs/kit';
import type { PageServerLoad, Actions } from './$types.js';
import { listMotions, createMotion } from '$lib/server/motions.js';
import { listAssociations } from '$lib/server/associations.js';
import { db } from '$lib/server/db.js';

export const load: PageServerLoad = async () => {
	const motions = listMotions().map((m) => {
		const body = db.prepare('SELECT name FROM association WHERE uuid = ?').get(m.body_uuid) as { name: string } | undefined;
		return { ...m, body_name: body?.name ?? null };
	});
	const associations = listAssociations({ status: 'active' });
	const community = associations.find((a) => a.type === 'society') ?? null;
	return { motions, associations, community };
};

export const actions: Actions = {
	create: async ({ request, locals }) => {
		if (!locals.session) return fail(401, { message: 'Not authenticated' });
		const actingAs = locals.session.acting_as_uuid;

		const data = await request.formData();
		const title = String(data.get('title') ?? '').trim();
		const body = String(data.get('body') ?? '').trim();
		const reasoning = String(data.get('reasoning') ?? '').trim() || null;
		const body_uuid = String(data.get('body_uuid') ?? '').trim();

		if (!title) return fail(400, { message: 'Title is required' });
		if (!body) return fail(400, { message: 'Motion text is required' });
		if (!body_uuid) return fail(400, { message: 'A body is required' });

		const motion = createMotion({
			title,
			body,
			reasoning,
			introduced_by_uuid: actingAs,
			body_uuid,
		});

		return { created: motion.uuid };
	},
};
