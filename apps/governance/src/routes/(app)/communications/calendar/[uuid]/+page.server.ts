import { error, fail } from '@sveltejs/kit';
import type { PageServerLoad, Actions } from './$types.js';
import { db } from '$lib/server/db.js';
import { hasPermission, PERMISSIONS } from '$lib/server/infrastructure/permissions.js';
import type { CalendarEvent } from '../+page.server.js';

export const load: PageServerLoad = async ({ locals, params }) => {
	const event = db
		.prepare(`SELECT * FROM calendar_event WHERE uuid = ?`)
		.get(params.uuid) as CalendarEvent | undefined;

	if (!event) error(404, 'Event not found');

	const actingAs = locals.session?.acting_as_uuid ?? null;
	const canWrite = actingAs ? hasPermission(actingAs, PERMISSIONS.CALENDAR_WRITE) : false;

	return { event, canWrite };
};

export const actions: Actions = {
	cancel: async ({ locals, params }) => {
		if (!locals.session) return fail(401, { error: 'Not authenticated' });
		const actingAs = locals.session.acting_as_uuid;
		if (!hasPermission(actingAs, PERMISSIONS.CALENDAR_WRITE))
			return fail(403, { error: 'Insufficient permissions' });

		db.prepare(`UPDATE calendar_event SET cancelled_at = ? WHERE uuid = ?`)
			.run(new Date().toISOString(), params.uuid);

		return { success: true };
	},
};
