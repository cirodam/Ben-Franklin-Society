import { error, fail } from '@sveltejs/kit';
import type { PageServerLoad, Actions } from './$types.js';
import {
	getThread,
	getMessage,
	markRead,
	trashMessage,
	restoreMessage,
	replyToMessage,
	insertReport,
	archiveThread,
	unarchiveThread,
} from '$lib/server/messages.js';
import { getMailbox } from '$lib/server/mailboxes.js';
import { getAttachments } from '$lib/server/attachments.js';
import { getLabels, getThreadLabels, addThreadLabel, removeThreadLabel } from '$lib/server/labels.js';

export const load: PageServerLoad = async ({ locals, params }) => {
	const session  = locals.session!;
	const messages = getThread(params.thread_id, session.acting_as_uuid);
	if (!messages.length) error(404, 'Thread not found.');

	// Mark all received, unread messages as read.
	for (const m of messages) {
		if (m.recipient_type !== null && m.read_at === null) {
			markRead(m.uuid, session.acting_as_uuid);
		}
	}

	const mailbox = getMailbox(session.acting_as_uuid);
	const signature = mailbox?.signature ? `\n\n-- \n${mailbox.signature}` : '';

	// Get attachments for all messages in thread
	const messageAttachments: Record<string, Awaited<ReturnType<typeof getAttachments>>> = {};
	for (const msg of messages) {
		messageAttachments[msg.uuid] = getAttachments(msg.uuid);
	}

	// Get labels and thread labels
	const availableLabels = getLabels(session.acting_as_uuid);
	const threadLabels = getThreadLabels(params.thread_id, session.acting_as_uuid);

	return { 
		messages, 
		actingAs: session.acting_as_uuid,
		signature,
		messageAttachments,
		availableLabels,
		threadLabels,
	};
};

export const actions: Actions = {
	reply: async ({ locals, params, request }) => {
		const session = locals.session!;
		const data    = await request.formData();
		const body         = String(data.get('body')         ?? '').trim();
		const reply_to_id  = String(data.get('reply_to_id') ?? '').trim();
		const content_type = String(data.get('content_type') ?? 'text/plain') as 'text/plain' | 'text/markdown';

		if (!body)        return fail(400, { reply_error: 'Reply cannot be empty.' });
		if (!reply_to_id) return fail(400, { reply_error: 'Missing reply target.' });

		const replyMsg = getMessage(reply_to_id);
		if (!replyMsg || replyMsg.thread_id !== params.thread_id) {
			return fail(400, { reply_error: 'Invalid message reference.' });
		}

		const root = getMessage(params.thread_id);
		if (!root) return fail(400, { reply_error: 'Thread not found.' });

		// Determine reply recipients: the sender of the replied-to message,
		// unless they're the user — in which case reply to that message's recipients.
		const recipients: Array<{ principal_uuid: string; handle_cache: string }> = [];
		if (replyMsg.from_owner_uuid !== session.acting_as_uuid) {
			recipients.push({
				principal_uuid: replyMsg.from_owner_uuid,
				handle_cache:   replyMsg.from_handle_cache,
			});
		} else {
			for (const r of replyMsg.recipients) {
				if (r.recipient_owner_uuid !== session.acting_as_uuid) {
					recipients.push({
						principal_uuid: r.recipient_owner_uuid,
						handle_cache:   r.recipient_handle_cache,
					});
				}
			}
		}

		if (!recipients.length) return fail(400, { reply_error: 'No recipients.' });

		const subject         = root.subject.startsWith('Re: ') ? root.subject : `Re: ${root.subject}`;
		const mailbox         = getMailbox(session.acting_as_uuid);
		const from_handle_cache = mailbox?.handle_cache ?? session.handle;

		replyToMessage({
			thread_id: params.thread_id,
			reply_to_id,
			from_owner_uuid: session.acting_as_uuid,
			from_handle_cache,
			subject,
			body,
			recipients,
			content_type,
		});

		return { replied: true };
	},

	trash: async ({ locals, request }) => {
		const session = locals.session!;
		const data    = await request.formData();
		const message_uuid = String(data.get('message_uuid') ?? '').trim();
		if (!message_uuid) return fail(400, { error: 'Missing message_uuid.' });
		trashMessage(message_uuid, session.acting_as_uuid);
		return { success: true };
	},

	restore: async ({ locals, request }) => {
		const session = locals.session!;
		const data    = await request.formData();
		const message_uuid = String(data.get('message_uuid') ?? '').trim();
		if (!message_uuid) return fail(400, { error: 'Missing message_uuid.' });
		restoreMessage(message_uuid, session.acting_as_uuid);
		return { success: true };
	},

	report: async ({ locals, params, request }) => {
		const session = locals.session!;
		const data    = await request.formData();
		const message_uuid = String(data.get('message_uuid') ?? '').trim();
		const reason       = String(data.get('reason')       ?? '').trim();

		if (!message_uuid) return fail(400, { report_error: 'Missing message_uuid.' });
		if (!reason)       return fail(400, { report_error: 'A reason is required.', reported_uuid: message_uuid });

		// Verify the message belongs to this thread.
		const msg = getMessage(message_uuid);
		if (!msg || msg.thread_id !== params.thread_id) {
			return fail(400, { report_error: 'Invalid message reference.' });
		}

		// Cannot report your own messages.
		if (msg.from_owner_uuid === session.acting_as_uuid) {
			return fail(400, { report_error: 'You cannot report your own message.' });
		}

		insertReport(message_uuid, session.acting_as_uuid, reason);
		return { reported: true, reported_uuid: message_uuid };
	},

	archive: async ({ locals, params }) => {
		const session = locals.session!;
		archiveThread(params.thread_id, session.acting_as_uuid);
		return { archived: true };
	},

	unarchive: async ({ locals, params }) => {
		const session = locals.session!;
		unarchiveThread(params.thread_id, session.acting_as_uuid);
		return { unarchived: true };
	},

	add_label: async ({ locals, params, request }) => {
		const session = locals.session!;
		const data = await request.formData();
		const label_uuid = String(data.get('label_uuid') ?? '').trim();

		if (!label_uuid) return fail(400, { error: 'Label UUID required' });

		addThreadLabel(params.thread_id, label_uuid, session.acting_as_uuid);
		return { success: true };
	},

	remove_label: async ({ locals, params, request }) => {
		const session = locals.session!;
		const data = await request.formData();
		const label_uuid = String(data.get('label_uuid') ?? '').trim();

		if (!label_uuid) return fail(400, { error: 'Label UUID required' });

		removeThreadLabel(params.thread_id, label_uuid, session.acting_as_uuid);
		return { success: true };
	},
};
