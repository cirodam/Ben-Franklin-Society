import { error, redirect }                              from '@sveltejs/kit';
import {
	getMarketplace, updateMarketplace, closeMarketplace,
	getAllSessions, createSession, getStalls, createStall, retireStall,
} from '$lib/server/physical.js';
import type { Actions, PageServerLoad }                from './$types.js';

export const load: PageServerLoad = async ({ params }) => {
	const marketplace = getMarketplace(params.uuid);
	if (!marketplace) error(404, 'Marketplace not found.');
	const sessions = getAllSessions(params.uuid);
	const stalls   = getStalls(params.uuid);
	return { marketplace, sessions, stalls };
};

export const actions: Actions = {
	update: async ({ request, params }) => {
		const fd = await request.formData();
		const name             = String(fd.get('name')             ?? '').trim();
		const location         = String(fd.get('location')         ?? '').trim();
		const description      = String(fd.get('description')      ?? '').trim() || null;
		const default_schedule = String(fd.get('default_schedule') ?? '').trim() || null;
		if (!name || !location) return { error: 'Name and location are required.', action: 'update' };
		updateMarketplace(params.uuid, { name, location, description, default_schedule });
		return { success: true, action: 'update' };
	},

	close: async ({ params }) => {
		closeMarketplace(params.uuid);
		redirect(303, '/administrator/markets');
	},

	create_session: async ({ request, params }) => {
		const fd       = await request.formData();
		const starts_at = String(fd.get('starts_at') ?? '').trim();
		const ends_at   = String(fd.get('ends_at')   ?? '').trim();
		const notes     = String(fd.get('notes')     ?? '').trim() || null;
		if (!starts_at || !ends_at) return { error: 'Start and end times are required.', action: 'session' };
		const uuid = createSession({ marketplace_uuid: params.uuid, starts_at, ends_at, notes });
		redirect(303, `/administrator/markets/${params.uuid}/sessions/${uuid}`);
	},

	create_stall: async ({ request, params }) => {
		const fd          = await request.formData();
		const name        = String(fd.get('stall_name')        ?? '').trim();
		const description = String(fd.get('stall_description') ?? '').trim() || null;
		if (!name) return { error: 'Stall name is required.', action: 'stall' };
		createStall({ marketplace_uuid: params.uuid, name, description });
		return { success: true, action: 'stall' };
	},

	retire_stall: async ({ request }) => {
		const fd   = await request.formData();
		const uuid = String(fd.get('stall_uuid') ?? '').trim();
		if (uuid) retireStall(uuid);
		return { success: true, action: 'stall' };
	},
};
