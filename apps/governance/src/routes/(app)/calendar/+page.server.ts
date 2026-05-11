import type { PageServerLoad } from './$types.js';
import { db } from '$lib/server/db.js';

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

export const load: PageServerLoad = async () => {
	const events = db
		.prepare(`SELECT * FROM calendar_event WHERE cancelled_at IS NULL ORDER BY starts_at ASC`)
		.all() as CalendarEvent[];
	return { events };
};
