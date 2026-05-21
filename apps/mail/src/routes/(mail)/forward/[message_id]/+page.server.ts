import { error, fail, redirect } from '@sveltejs/kit';
import type { PageServerLoad, Actions } from './$types.js';
import { getMessage } from '$lib/server/messages/queries.js';
import { forwardMessage } from '$lib/server/messages/compose.js';
import { resolveHandle } from '$lib/server/messages/recipients.js';
import { getMailbox } from '$lib/server/mailboxes.js';

export const load: PageServerLoad = async ({ locals, params }) => {
	const session = locals.session!;
	const original = getMessage(params.message_id);

	if (!original) {
		error(404, 'Message not found');
	}

	// Only allow forwarding sent messages or messages you received
	const isRecipient = original.recipients?.some(
		(r) => r.recipient_owner_uuid === session.acting_as_uuid
	);
	const isSender = original.from_owner_uuid === session.acting_as_uuid;

	if (!isRecipient && !isSender) {
		error(403, 'Cannot forward this message');
	}

	return {
		original
	};
};

export const actions: Actions = {
	forward: async ({ locals, params, request }) => {
		const session = locals.session!;
		const data = await request.formData();

		const to_str = String(data.get('to') ?? '').trim();
		const cc_str = String(data.get('cc') ?? '').trim();
		const bcc_str = String(data.get('bcc') ?? '').trim();
		const body = String(data.get('body') ?? '').trim();

		if (!to_str) return fail(400, { error: 'At least one recipient is required.' });
		if (!body) return fail(400, { error: 'Message body cannot be empty.' });

		// Resolve recipients
		const to_handles = to_str
			.split(',')
			.map((h) => h.trim())
			.filter(Boolean);
		const cc_handles = cc_str
			? cc_str
					.split(',')
					.map((h) => h.trim())
					.filter(Boolean)
			: [];
		const bcc_handles = bcc_str
			? bcc_str
					.split(',')
					.map((h) => h.trim())
					.filter(Boolean)
			: [];

		const to = [];
		for (const h of to_handles) {
			const resolved = await resolveHandle(h);
			if (!resolved) {
				return fail(400, { error: `Unknown handle: ${h}`, field: 'to' });
			}
			to.push(resolved);
		}

		const cc = [];
		for (const h of cc_handles) {
			const resolved = await resolveHandle(h);
			if (!resolved) {
				return fail(400, { error: `Unknown handle: ${h}`, field: 'cc' });
			}
			cc.push(resolved);
		}

		const bcc = [];
		for (const h of bcc_handles) {
			const resolved = await resolveHandle(h);
			if (!resolved) {
				return fail(400, { error: `Unknown handle: ${h}`, field: 'bcc' });
			}
			bcc.push(resolved);
		}

		const original = getMessage(params.message_id);
		if (!original) {
			return fail(404, { error: 'Original message not found' });
		}

		const mailbox = getMailbox(session.acting_as_uuid);
		const from_handle_cache = mailbox?.handle_cache ?? session.handle;

		const subject = original.subject.startsWith('Fwd: ')
			? original.subject
			: `Fwd: ${original.subject}`;

		forwardMessage({
			from_owner_uuid: session.acting_as_uuid,
			from_handle_cache,
			to,
			cc: cc.length > 0 ? cc : undefined,
			bcc: bcc.length > 0 ? bcc : undefined,
			subject,
			body
		});

		throw redirect(303, '/sent');
	}
};
