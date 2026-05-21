import { fail, redirect } from '@sveltejs/kit';
import type { PageServerLoad, Actions } from './$types.js';
import { getMessage, saveDraft, sendMessage, resolveHandle } from '$lib/server/messages.js';
import { getMailbox } from '$lib/server/mailboxes.js';
import { getTemplates } from '$lib/server/templates.js';
import { saveAttachment, getAttachments, deleteAttachment } from '$lib/server/attachments.js';
import { getContactGroups } from '$lib/server/contacts.js';

export interface Prefill {
	to_raw: string;
	subject: string;
	body: string;
}

export const load: PageServerLoad = async ({ locals, url }) => {
	const session    = locals.session!;
	const draft_uuid = url.searchParams.get('draft');
	const reply_to   = url.searchParams.get('reply_to');
	const forward    = url.searchParams.get('forward');

	const mailbox = getMailbox(session.acting_as_uuid);
	const signature = mailbox?.signature ? `\n\n-- \n${mailbox.signature}` : '';
	const templates = getTemplates(session.acting_as_uuid);

	let attachments: Awaited<ReturnType<typeof getAttachments>> = [];

	let draft: Awaited<ReturnType<typeof getMessage>> = null;
	if (draft_uuid) {
		const msg = getMessage(draft_uuid);
		if (msg && msg.from_owner_uuid === session.acting_as_uuid && msg.status === 'draft') {
			draft = msg;
			attachments = getAttachments(draft.uuid);
		}
	}

	let prefill: Prefill | null = null;

	if (reply_to) {
		const src = getMessage(reply_to);
		if (src && src.status === 'sent') {
			prefill = {
				to_raw:  `@${src.from_handle_cache}`,
				subject: src.subject.startsWith('Re: ') ? src.subject : `Re: ${src.subject}`,
				body:    signature,
			};
		}
	} else if (forward) {
		const src = getMessage(forward);
		if (src && src.status === 'sent') {
			const fwdBody = `\n\n--- Forwarded message ---\nFrom: @${src.from_handle_cache}\n\n${src.body}${signature}`;
			prefill = {
				to_raw:  '',
				subject: src.subject.startsWith('Fwd: ') ? src.subject : `Fwd: ${src.subject}`,
				body:    fwdBody,
			};
		}
	}

	const contactGroups = getContactGroups(session.acting_as_uuid);

	return { draft, prefill, signature, templates, attachments, contactGroups };
};

// ---------------------------------------------------------------------------
// Parse comma-separated handle string into an array of trimmed handles.
// ---------------------------------------------------------------------------
function parseHandles(raw: string): string[] {
	return raw
		.split(',')
		.map((h) => h.trim())
		.filter(Boolean);
}

// ---------------------------------------------------------------------------
// Expand group names to individual handles
// ---------------------------------------------------------------------------
function expandGroupsToHandles(handles: string[], mailbox_uuid: string): string[] {
	const contactGroups = getContactGroups(mailbox_uuid);
	const expanded: string[] = [];

	for (const handle of handles) {
		// Check if it's a group name (without @ prefix)
		const cleanHandle = handle.startsWith('@') ? handle.slice(1) : handle;
		const group = contactGroups.find((g) => g.name.toLowerCase() === cleanHandle.toLowerCase());

		if (group) {
			// It's a group - expand to members
			for (const member of group.members) {
				expanded.push(`@${member.handle_cache}`);
			}
		} else {
			// Not a group - keep as-is
			expanded.push(handle);
		}
	}

	return expanded;
}

// ---------------------------------------------------------------------------
// Resolve a list of raw handles, returning resolved + unresolved handles.
// ---------------------------------------------------------------------------
async function resolveHandles(handles: string[]): Promise<{
	resolved: Array<{ principal_uuid: string; handle_cache: string }>;
	failed: string[];
}> {
	const resolved: Array<{ principal_uuid: string; handle_cache: string }> = [];
	const failed: string[] = [];
	for (const h of handles) {
		const r = await resolveHandle(h);
		if (r) resolved.push(r);
		else   failed.push(h);
	}
	return { resolved, failed };
}

export const actions: Actions = {
		save_draft: async ({ locals, request }) => {
		const session = locals.session!;
		const data    = await request.formData();

		const draft_uuid = String(data.get('draft_uuid') ?? '').trim() || undefined;
		const to_raw     = String(data.get('to')         ?? '').trim();
		const cc_raw     = String(data.get('cc')         ?? '').trim();
		const bcc_raw    = String(data.get('bcc')        ?? '').trim();
		const subject    = String(data.get('subject')    ?? '');
		const body       = String(data.get('body')       ?? '');
		const content_type = String(data.get('content_type') ?? 'text/plain') as 'text/plain' | 'text/markdown';

		const toHandles  = parseHandles(to_raw);
		const ccHandles  = parseHandles(cc_raw);
		const bccHandles = parseHandles(bcc_raw);

		// Expand groups to individual handles
		const toExpanded  = expandGroupsToHandles(toHandles, session.acting_as_uuid);
		const ccExpanded  = expandGroupsToHandles(ccHandles, session.acting_as_uuid);
		const bccExpanded = expandGroupsToHandles(bccHandles, session.acting_as_uuid);

		const { resolved: toResolved, failed: toFailed }   = await resolveHandles(toExpanded);
		const { resolved: ccResolved, failed: ccFailed }   = await resolveHandles(ccExpanded);
		const { resolved: bccResolved, failed: bccFailed } = await resolveHandles(bccExpanded);
		const allFailed = [...toFailed, ...ccFailed, ...bccFailed];

		if (allFailed.length > 0) {
			return fail(400, {
				error:    `No mailbox found for: @${allFailed.join(', @')}`,
				to_raw,   cc_raw, bcc_raw, subject, body,
			});
		}

		const mailbox           = getMailbox(session.acting_as_uuid);
		const from_handle_cache = mailbox?.handle_cache ?? session.handle;

		const draft = saveDraft({
			draft_uuid,
			from_owner_uuid: session.acting_as_uuid,
			from_handle_cache,
			to:  toResolved,
			cc:  ccResolved,
			bcc: bccResolved,
			subject,
			body,
			content_type,
		});

		// Handle file uploads
		const files = data.getAll('attachments') as File[];
		for (const file of files) {
			if (file.size > 0) {
				const buffer = Buffer.from(await file.arrayBuffer());
				try {
					await saveAttachment({
						message_uuid: draft.uuid,
						filename: file.name,
						content_type: file.type,
						data: buffer,
					});
				} catch (err) {
					return fail(400, {
						error: err instanceof Error ? err.message : 'Failed to upload attachment',
						to_raw, cc_raw, bcc_raw, subject, body,
					});
				}
			}
		}

		redirect(302, `/compose?draft=${draft.uuid}`);
	},

	send: async ({ locals, request }) => {
		const session = locals.session!;
		const data    = await request.formData();

		const draft_uuid = String(data.get('draft_uuid') ?? '').trim() || undefined;
		const to_raw     = String(data.get('to')         ?? '').trim();
		const cc_raw     = String(data.get('cc')         ?? '').trim();
		const bcc_raw    = String(data.get('bcc')        ?? '').trim();
		const subject    = String(data.get('subject')    ?? '').trim();
		const body       = String(data.get('body')       ?? '').trim();
		const content_type = String(data.get('content_type') ?? 'text/plain') as 'text/plain' | 'text/markdown';

		if (!to_raw)  return fail(400, { error: 'At least one recipient is required.', to_raw, cc_raw, bcc_raw, subject, body });
		if (!subject) return fail(400, { error: 'Subject is required.',                to_raw, cc_raw, bcc_raw, subject, body });
		if (!body)    return fail(400, { error: 'Body is required.',                   to_raw, cc_raw, bcc_raw, subject, body });

		const toHandles = parseHandles(to_raw);
		const ccHandles = parseHandles(cc_raw);
		const bccHandles = parseHandles(bcc_raw);

		// Expand groups to individual handles
		const toExpanded  = expandGroupsToHandles(toHandles, session.acting_as_uuid);
		const ccExpanded  = expandGroupsToHandles(ccHandles, session.acting_as_uuid);
		const bccExpanded = expandGroupsToHandles(bccHandles, session.acting_as_uuid);

		const { resolved: toResolved, failed: toFailed } = await resolveHandles(toExpanded);
		const { resolved: ccResolved, failed: ccFailed } = await resolveHandles(ccExpanded);
		const { resolved: bccResolved, failed: bccFailed } = await resolveHandles(bccExpanded);
		const allFailed = [...toFailed, ...ccFailed, ...bccFailed];

		if (allFailed.length > 0) {
			return fail(400, {
				error: `No mailbox found for: @${allFailed.join(', @')}`,
				to_raw, cc_raw, bcc_raw, subject, body,
			});
		}

		if (!toResolved.length) {
			return fail(400, { error: 'At least one valid recipient is required.', to_raw, cc_raw, bcc_raw, subject, body });
		}

		const mailbox           = getMailbox(session.acting_as_uuid);
		const from_handle_cache = mailbox?.handle_cache ?? session.handle;

		const message = sendMessage({
			draft_uuid,
			from_owner_uuid: session.acting_as_uuid,
			from_handle_cache,
			to:  toResolved,
			cc:  ccResolved,
			bcc: bccResolved,
			subject,
			body,
			content_type,
		});

		// Handle file uploads
		const files = data.getAll('attachments') as File[];
		for (const file of files) {
			if (file.size > 0) {
				const buffer = Buffer.from(await file.arrayBuffer());
				try {
					await saveAttachment({
						message_uuid: message.uuid,
						filename: file.name,
						content_type: file.type,
						data: buffer,
					});
				} catch (err) {
					return fail(400, {
						error: err instanceof Error ? err.message : 'Failed to upload attachment',
						to_raw, cc_raw, bcc_raw, subject, body,
					});
				}
			}
		}

		redirect(302, '/sent');
	},

	delete_attachment: async ({ locals, request }) => {
		const session = locals.session!;
		const data = await request.formData();
		const attachment_uuid = String(data.get('attachment_uuid') ?? '').trim();
		const draft_uuid = String(data.get('draft_uuid') ?? '').trim();

		if (!attachment_uuid) return fail(400, { error: 'Attachment UUID required' });
		
		await deleteAttachment(attachment_uuid);
		
		if (draft_uuid) {
			return { success: true };
		}
		return { success: true };
	},

	autosave: async ({ locals, request }) => {
		const session = locals.session!;
		const data = await request.formData();

		const draft_uuid = String(data.get('draft_uuid') ?? '').trim() || undefined;
		const to_raw = String(data.get('to') ?? '').trim();
		const cc_raw = String(data.get('cc') ?? '').trim();
		const bcc_raw = String(data.get('bcc') ?? '').trim();
		const subject = String(data.get('subject') ?? '');
		const body = String(data.get('body') ?? '');
		const content_type = String(data.get('content_type') ?? 'text/plain') as 'text/plain' | 'text/markdown';

		// Don't fail on invalid handles during autosave - just save what we have
		const toHandles = parseHandles(to_raw);
		const ccHandles = parseHandles(cc_raw);
		const bccHandles = parseHandles(bcc_raw);

		// Expand groups to individual handles
		const toExpanded  = expandGroupsToHandles(toHandles, session.acting_as_uuid);
		const ccExpanded  = expandGroupsToHandles(ccHandles, session.acting_as_uuid);
		const bccExpanded = expandGroupsToHandles(bccHandles, session.acting_as_uuid);

		const { resolved: toResolved } = await resolveHandles(toExpanded);
		const { resolved: ccResolved } = await resolveHandles(ccExpanded);
		const { resolved: bccResolved } = await resolveHandles(bccExpanded);

		const mailbox = getMailbox(session.acting_as_uuid);
		const from_handle_cache = mailbox?.handle_cache ?? session.handle;

		const draft = saveDraft({
			draft_uuid,
			from_owner_uuid: session.acting_as_uuid,
			from_handle_cache,
			to: toResolved,
			cc: ccResolved,
			bcc: bccResolved,
			subject,
			body,
			content_type,
		});

		// Return success with draft UUID (no redirect)
		return { success: true, draft_uuid: draft.uuid };
	},
};
