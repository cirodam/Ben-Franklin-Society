import { fail } from '@sveltejs/kit';
import type { PageServerLoad, Actions } from './$types.js';
import { getTrash } from '$lib/server/messages/queries.js';
import { restoreMessage, permanentlyDelete } from '$lib/server/messages/mutations.js';

const PAGE_SIZE = 25;

export const load: PageServerLoad = async ({ locals, url }) => {
	const session = locals.session!;
	const page    = Math.max(0, parseInt(url.searchParams.get('page') ?? '0', 10));

	const messages = getTrash(session.acting_as_uuid, {
		limit:  PAGE_SIZE + 1,
		offset: page * PAGE_SIZE,
	});

	const hasMore = messages.length > PAGE_SIZE;
	if (hasMore) messages.pop();

	return { messages, page, hasMore };
};

export const actions: Actions = {
	restore: async ({ locals, request }) => {
		const session = locals.session!;
		const data    = await request.formData();
		const message_uuid = String(data.get('message_uuid') ?? '').trim();
		if (!message_uuid) return fail(400, { error: 'Missing message_uuid.' });
		restoreMessage(message_uuid, session.acting_as_uuid);
		return { success: true };
	},

	delete: async ({ locals, request }) => {
		const session = locals.session!;
		const data    = await request.formData();
		const message_uuid = String(data.get('message_uuid') ?? '').trim();
		if (!message_uuid) return fail(400, { error: 'Missing message_uuid.' });
		permanentlyDelete(message_uuid, session.acting_as_uuid);
		return { success: true };
	},
};
