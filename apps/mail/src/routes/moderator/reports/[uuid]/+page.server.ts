import { error, fail, redirect } from '@sveltejs/kit';
import type { PageServerLoad, Actions } from './$types.js';
import {
	getReport,
	dismissReport,
	deleteMessage,
	suspendMailboxByMod,
} from '$lib/server/moderation.js';
import { db } from '$lib/server/db.js';

export const load: PageServerLoad = async ({ params }) => {
	const report = getReport(params.uuid);
	if (!report) error(404, 'Report not found.');
	return { report };
};

export const actions: Actions = {
	dismiss: async ({ locals, params, request }) => {
		const session = locals.session!;
		const data    = await request.formData();
		const reason  = String(data.get('reason') ?? '').trim();
		if (!reason) return fail(400, { error: 'A reason is required.', action: 'dismiss' });

		const report = getReport(params.uuid);
		if (!report) error(404, 'Report not found.');
		if (report.status !== 'pending') return fail(400, { error: 'Report already resolved.' });

		dismissReport(params.uuid, session.acting_as_uuid, reason);
		redirect(302, '/moderator');
	},

	delete_message: async ({ locals, params, request }) => {
		const session = locals.session!;
		const data    = await request.formData();
		const reason  = String(data.get('reason') ?? '').trim();
		if (!reason) return fail(400, { error: 'A reason is required.', action: 'delete_message' });

		const report = getReport(params.uuid);
		if (!report) error(404, 'Report not found.');
		if (report.status !== 'pending') return fail(400, { error: 'Report already resolved.' });

		deleteMessage(report.message_uuid, session.acting_as_uuid, reason, params.uuid);
		redirect(302, '/moderator');
	},

	suspend_mailbox: async ({ locals, params, request }) => {
		const session = locals.session!;
		const data    = await request.formData();
		const reason  = String(data.get('reason') ?? '').trim();
		if (!reason) return fail(400, { error: 'A reason is required.', action: 'suspend_mailbox' });

		const report = getReport(params.uuid);
		if (!report) error(404, 'Report not found.');
		if (report.status !== 'pending') return fail(400, { error: 'Report already resolved.' });

		// Resolve the message sender's principal_uuid from the mailbox table.
		const msgRow = db
			.prepare('SELECT from_owner_uuid FROM message WHERE uuid = ?')
			.get(report.message_uuid) as { from_owner_uuid: string } | undefined;
		if (!msgRow) return fail(400, { error: 'Message not found.' });

		suspendMailboxByMod(msgRow.from_owner_uuid, session.acting_as_uuid, reason, params.uuid);
		redirect(302, '/moderator');
	},
};
