import { error, fail } from '@sveltejs/kit';
import type { PageServerLoad, Actions } from './$types.js';
import { getMailbox } from '$lib/server/mailboxes.js';
import { db } from '$lib/server/db.js';

export const load: PageServerLoad = async ({ locals }) => {
	const session = locals.session!;
	const mailbox = getMailbox(session.acting_as_uuid);

	if (!mailbox) {
		error(404, 'Mailbox not found');
	}

	return {
		mailbox
	};
};

export const actions: Actions = {
	updateSignature: async ({ locals, request }) => {
		const session = locals.session!;
		const data = await request.formData();

		const signature = String(data.get('signature') ?? '').trim();

		db.prepare(
			`UPDATE mailbox
       SET signature = ?
       WHERE principal_uuid = ?`
		).run(signature || null, session.acting_as_uuid);

		return { success: true };
	}
};
