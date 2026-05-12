import { fail } from '@sveltejs/kit';
import type { PageServerLoad, Actions } from './$types.js';
import { getAllMailboxes, suspendMailboxByMod, reinstateMailboxByMod } from '$lib/server/moderation.js';

export const load: PageServerLoad = async ({ url }) => {
	const q = url.searchParams.get('q') ?? '';
	const mailboxes = getAllMailboxes({ q: q || undefined });
	return { mailboxes, q };
};

export const actions: Actions = {
	suspend: async ({ locals, request }) => {
		const session = locals.session!;
		const data    = await request.formData();
		const principal_uuid = String(data.get('principal_uuid') ?? '').trim();
		const reason         = String(data.get('reason') ?? '').trim();
		if (!principal_uuid) return fail(400, { error: 'Missing mailbox.' });
		if (!reason)         return fail(400, { error: 'A reason is required.', principal_uuid });

		suspendMailboxByMod(principal_uuid, session.acting_as_uuid, reason);
		return { success: true };
	},

	reinstate: async ({ locals, request }) => {
		const session = locals.session!;
		const data    = await request.formData();
		const principal_uuid = String(data.get('principal_uuid') ?? '').trim();
		const reason         = String(data.get('reason') ?? '').trim();
		if (!principal_uuid) return fail(400, { error: 'Missing mailbox.' });
		if (!reason)         return fail(400, { error: 'A reason is required.', principal_uuid });

		reinstateMailboxByMod(principal_uuid, session.acting_as_uuid, reason);
		return { success: true };
	},
};
