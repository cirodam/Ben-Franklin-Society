import { error, redirect }                                          from '@sveltejs/kit';
import {
	getMarketplace, getSession, cancelSession,
	getStallsWithAssignments, assignStall, removeAssignment,
} from '$lib/server/physical.js';
import { lookupPersonByHandle }                                    from '$lib/server/governance-api.js';
import type { Actions, PageServerLoad }                            from './$types.js';

export const load: PageServerLoad = async ({ params }) => {
	const marketplace = getMarketplace(params.uuid);
	if (!marketplace) error(404, 'Marketplace not found.');
	const session = getSession(params.session_uuid);
	if (!session || session.marketplace_uuid !== params.uuid) error(404, 'Session not found.');
	const stalls = getStallsWithAssignments(params.uuid, params.session_uuid);
	return { marketplace, session, stalls };
};

export const actions: Actions = {
	cancel: async ({ params }) => {
		cancelSession(params.session_uuid);
		redirect(303, `/administrator/markets/${params.uuid}`);
	},

	assign: async ({ request, params }) => {
		const fd       = await request.formData();
		const stall_uuid = String(fd.get('stall_uuid') ?? '').trim();
		const handle     = String(fd.get('handle')     ?? '').trim().replace(/^@/, '');
		const notes      = String(fd.get('notes')      ?? '').trim() || null;

		if (!stall_uuid || !handle) return { error: 'Stall and handle are required.', action: 'assign' };

		const person = await lookupPersonByHandle(handle);

		if (!person) return { error: `No member found with handle @${handle}.`, action: 'assign' };

		assignStall(stall_uuid, params.session_uuid, person.uuid, handle, notes);
		return { success: true, action: 'assign' };
	},

	remove_assignment: async ({ request }) => {
		const fd   = await request.formData();
		const uuid = String(fd.get('assignment_uuid') ?? '').trim();
		if (uuid) removeAssignment(uuid);
		return { success: true, action: 'assign' };
	},
};
