import type { Actions, PageServerLoad } from './$types';
import { fail } from '@sveltejs/kit';
import {
	getContactGroups,
	getContactGroup,
	createContactGroup,
	updateContactGroup,
	deleteContactGroup,
} from '$lib/server/contacts.js';
import { getPrincipalByHandle } from '$lib/server/oidc.js';

export const load: PageServerLoad = async ({ locals }) => {
	const session = locals.session!;
	const groups = getContactGroups(session.acting_as_uuid);
	return { groups };
};

export const actions: Actions = {
	create: async ({ locals, request }) => {
		const session = locals.session!;
		const data = await request.formData();
		const name = String(data.get('name') ?? '').trim();
		const membersRaw = String(data.get('members') ?? '').trim();

		if (!name) return fail(400, { error: 'Group name is required' });
		if (!membersRaw) return fail(400, { error: 'At least one member is required' });

		// Parse comma-separated handles
		const handles = membersRaw
			.split(',')
			.map((h) => h.trim())
			.filter(Boolean);

		// Resolve handles to principals
		const members: Array<{ principal_uuid: string; handle_cache: string }> = [];
		for (const handle of handles) {
			const cleanHandle = handle.startsWith('@') ? handle.slice(1) : handle;
			const principal = await getPrincipalByHandle(cleanHandle);
			if (!principal) {
				return fail(400, { error: `Handle not found: @${cleanHandle}` });
			}
			members.push({
				principal_uuid: principal.uuid,
				handle_cache: cleanHandle,
			});
		}

		try {
			createContactGroup({
				mailbox_uuid: session.acting_as_uuid,
				name,
				members,
			});
			return { success: true };
		} catch (err: any) {
			if (err.message?.includes('UNIQUE constraint')) {
				return fail(400, { error: 'A group with this name already exists' });
			}
			throw err;
		}
	},

	update: async ({ locals, request }) => {
		const session = locals.session!;
		const data = await request.formData();
		const uuid = String(data.get('uuid') ?? '').trim();
		const name = String(data.get('name') ?? '').trim();
		const membersRaw = String(data.get('members') ?? '').trim();

		if (!uuid) return fail(400, { error: 'Group UUID is required' });
		if (!name) return fail(400, { error: 'Group name is required' });
		if (!membersRaw) return fail(400, { error: 'At least one member is required' });

		// Verify ownership
		const existing = getContactGroup(uuid, session.acting_as_uuid);
		if (!existing) return fail(404, { error: 'Group not found' });

		// Parse and resolve members
		const handles = membersRaw
			.split(',')
			.map((h) => h.trim())
			.filter(Boolean);
		const members: Array<{ principal_uuid: string; handle_cache: string }> = [];
		for (const handle of handles) {
			const cleanHandle = handle.startsWith('@') ? handle.slice(1) : handle;
			const principal = await getPrincipalByHandle(cleanHandle);
			if (!principal) {
				return fail(400, { error: `Handle not found: @${cleanHandle}` });
			}
			members.push({
				principal_uuid: principal.uuid,
				handle_cache: cleanHandle,
			});
		}

		try {
			updateContactGroup({
				uuid,
				mailbox_uuid: session.acting_as_uuid,
				name,
				members,
			});
			return { success: true };
		} catch (err: any) {
			if (err.message?.includes('UNIQUE constraint')) {
				return fail(400, { error: 'A group with this name already exists' });
			}
			throw err;
		}
	},

	delete: async ({ locals, request }) => {
		const session = locals.session!;
		const data = await request.formData();
		const uuid = String(data.get('uuid') ?? '').trim();

		if (!uuid) return fail(400, { error: 'Group UUID is required' });

		// Verify ownership
		const existing = getContactGroup(uuid, session.acting_as_uuid);
		if (!existing) return fail(404, { error: 'Group not found' });

		deleteContactGroup(uuid, session.acting_as_uuid);
		return { success: true };
	},
};
