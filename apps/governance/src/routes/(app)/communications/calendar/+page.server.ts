import { fail } from '@sveltejs/kit';
import { randomUUID } from 'node:crypto';
import type { PageServerLoad, Actions } from './$types.js';
import { db } from '$lib/server/db.js';
import { hasPermission, PERMISSIONS } from '$lib/server/infrastructure/permissions.js';
import { audit } from '$lib/server/documents/audit.js';

export interface CalendarEvent {
	uuid: string;
	title: string;
	description: string | null;
	organizer_uuid: string;
	starts_at: string;
	ends_at: string | null;
	location: string | null;
	created_at: string;
	cancelled_at: string | null;
}

export const load: PageServerLoad = async ({ locals }) => {
	const events = db
		.prepare(`SELECT * FROM calendar_event WHERE cancelled_at IS NULL ORDER BY starts_at ASC`)
		.all() as CalendarEvent[];

	const actingAs = locals.session?.acting_as_uuid ?? null;
	const canWrite = actingAs ? hasPermission(actingAs, PERMISSIONS.CALENDAR_WRITE) : false;

	return { events, canWrite };
};

export const actions: Actions = {
	create: async ({ locals, request }) => {
		if (!locals.session) return fail(401, { error: 'Not authenticated' });
		const actingAs = locals.session.acting_as_uuid;
		if (!hasPermission(actingAs, PERMISSIONS.CALENDAR_WRITE))
			return fail(403, { error: 'Insufficient permissions' });

		const data = await request.formData();
		const title       = String(data.get('title')       ?? '').trim();
		const starts_at   = String(data.get('starts_at')   ?? '').trim();
		const ends_at     = String(data.get('ends_at')     ?? '').trim() || null;
		const location    = String(data.get('location')    ?? '').trim() || null;
		const description = String(data.get('description') ?? '').trim() || null;

		if (!title || !starts_at) return fail(400, { error: 'Title and start time are required.' });

		const uuid = randomUUID();
		const createdAt = new Date().toISOString();
		db.prepare(
			`INSERT INTO calendar_event (uuid, title, description, organizer_uuid, starts_at, ends_at, location, created_at)
			 VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
		).run(uuid, title, description, actingAs, starts_at, ends_at, location, createdAt);

		audit(actingAs, 'calendar.create', 'calendar_event', uuid, title);
		return { success: true };
	},

	cancel: async ({ locals, request }) => {
		if (!locals.session) return fail(401, { error: 'Not authenticated' });
		const actingAs = locals.session.acting_as_uuid;
		if (!hasPermission(actingAs, PERMISSIONS.CALENDAR_WRITE))
			return fail(403, { error: 'Insufficient permissions' });

		const data = await request.formData();
		const event_uuid = String(data.get('event_uuid') ?? '').trim();
		if (!event_uuid) return fail(400, { error: 'Missing event_uuid' });

		const event = db.prepare('SELECT title FROM calendar_event WHERE uuid = ?').get(event_uuid) as { title: string } | undefined;
		if (!event) return fail(404, { error: 'Event not found' });

		db.prepare(`UPDATE calendar_event SET cancelled_at = ? WHERE uuid = ?`).run(new Date().toISOString(), event_uuid);
		audit(actingAs, 'calendar.cancel', 'calendar_event', event_uuid, `Cancelled: ${event.title}`);
		return { success: true };
	},
};
