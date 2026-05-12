import { fail, redirect } from '@sveltejs/kit';
import type { PageServerLoad, Actions } from './$types.js';
import { getMessage, saveDraft, sendMessage, resolveHandle } from '$lib/server/messages.js';
import { getMailbox } from '$lib/server/mailboxes.js';

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

	let draft: Awaited<ReturnType<typeof getMessage>> = null;
	if (draft_uuid) {
		const msg = getMessage(draft_uuid);
		if (msg && msg.from_principal_uuid === session.acting_as_uuid && msg.status === 'draft') {
			draft = msg;
		}
	}

	let prefill: Prefill | null = null;

	if (reply_to) {
		const src = getMessage(reply_to);
		if (src && src.status === 'sent') {
			prefill = {
				to_raw:  `@${src.from_handle_cache}`,
				subject: src.subject.startsWith('Re: ') ? src.subject : `Re: ${src.subject}`,
				body:    '',
			};
		}
	} else if (forward) {
		const src = getMessage(forward);
		if (src && src.status === 'sent') {
			const fwdBody = `\n\n--- Forwarded message ---\nFrom: @${src.from_handle_cache}\n\n${src.body}`;
			prefill = {
				to_raw:  '',
				subject: src.subject.startsWith('Fwd: ') ? src.subject : `Fwd: ${src.subject}`,
				body:    fwdBody,
			};
		}
	}

	return { draft, prefill };
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
		const subject    = String(data.get('subject')    ?? '');
		const body       = String(data.get('body')       ?? '');

		const toHandles  = parseHandles(to_raw);
		const ccHandles  = parseHandles(cc_raw);

		const { resolved: toResolved, failed: toFailed }   = await resolveHandles(toHandles);
		const { resolved: ccResolved, failed: ccFailed }   = await resolveHandles(ccHandles);
		const allFailed = [...toFailed, ...ccFailed];

		if (allFailed.length > 0) {
			return fail(400, {
				error:    `No mailbox found for: @${allFailed.join(', @')}`,
				to_raw,   cc_raw, subject, body,
			});
		}

		const mailbox           = getMailbox(session.acting_as_uuid);
		const from_handle_cache = mailbox?.handle_cache ?? session.handle;

		const draft = saveDraft({
			draft_uuid,
			from_principal_uuid: session.acting_as_uuid,
			from_handle_cache,
			to:  toResolved,
			cc:  ccResolved,
			subject,
			body,
		});

		redirect(302, `/compose?draft=${draft.uuid}`);
	},

	send: async ({ locals, request }) => {
		const session = locals.session!;
		const data    = await request.formData();

		const draft_uuid = String(data.get('draft_uuid') ?? '').trim() || undefined;
		const to_raw     = String(data.get('to')         ?? '').trim();
		const cc_raw     = String(data.get('cc')         ?? '').trim();
		const subject    = String(data.get('subject')    ?? '').trim();
		const body       = String(data.get('body')       ?? '').trim();

		if (!to_raw)  return fail(400, { error: 'At least one recipient is required.', to_raw, cc_raw, subject, body });
		if (!subject) return fail(400, { error: 'Subject is required.',                to_raw, cc_raw, subject, body });
		if (!body)    return fail(400, { error: 'Body is required.',                   to_raw, cc_raw, subject, body });

		const toHandles = parseHandles(to_raw);
		const ccHandles = parseHandles(cc_raw);

		const { resolved: toResolved, failed: toFailed } = await resolveHandles(toHandles);
		const { resolved: ccResolved, failed: ccFailed } = await resolveHandles(ccHandles);
		const allFailed = [...toFailed, ...ccFailed];

		if (allFailed.length > 0) {
			return fail(400, {
				error: `No mailbox found for: @${allFailed.join(', @')}`,
				to_raw, cc_raw, subject, body,
			});
		}

		if (!toResolved.length) {
			return fail(400, { error: 'At least one valid recipient is required.', to_raw, cc_raw, subject, body });
		}

		const mailbox           = getMailbox(session.acting_as_uuid);
		const from_handle_cache = mailbox?.handle_cache ?? session.handle;

		sendMessage({
			draft_uuid,
			from_principal_uuid: session.acting_as_uuid,
			from_handle_cache,
			to:  toResolved,
			cc:  ccResolved,
			subject,
			body,
		});

		redirect(302, '/sent');
	},
};
