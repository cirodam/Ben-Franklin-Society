import { error, fail } from '@sveltejs/kit';
import type { PageServerLoad, Actions } from './$types.js';
import { 
	listMeetings, 
	createMeeting, 
	getMeetingByUuid, 
	updateMeetingStatus, 
	updateMeeting,
	deleteMeeting,
	type MeetingStatus 
} from '$lib/server/governance/meetings.js';
import { hasPermission, PERMISSIONS } from '$lib/server/infrastructure/permissions.js';
import { getAssociationByUuid } from '$lib/server/organization/associations.js';

export const load: PageServerLoad = async ({ params, locals }) => {
	if (!locals.session) error(401, 'Not authenticated');

	// Get the committee
	const association = getAssociationByUuid(params.uuid);
	if (!association) error(404, 'Committee not found');
	if (association.type !== 'committee' && association.type !== 'general_assembly') {
		error(400, 'Invalid association type');
	}

	// List meetings
	const upcomingMeetings = listMeetings({ body_uuid: association.uuid, upcoming: true });
	const pastMeetings = listMeetings({ body_uuid: association.uuid })
		.filter(m => m.status === 'completed' || m.status === 'cancelled')
		.slice(0, 10); // Last 10 past meetings

	const canManage = hasPermission(
		locals.session.acting_as_uuid,
		PERMISSIONS.MOTIONS_ADVANCE,
		association.uuid
	);

	return {
		association,
		upcomingMeetings,
		pastMeetings,
		canManage,
	};
};

export const actions: Actions = {
	create: async ({ params, locals, request }) => {
		if (!locals.session) error(401, 'Not authenticated');
		const actingAs = locals.session.acting_as_uuid;

		const association = getAssociationByUuid(params.uuid);
		if (!association) return fail(404, { error: 'Committee not found' });

		if (!hasPermission(actingAs, PERMISSIONS.MOTIONS_ADVANCE, association.uuid)) {
			return fail(403, { error: 'Insufficient permissions' });
		}

		const data = await request.formData();
		const title = data.get('title') as string;
		const scheduled_at = data.get('scheduled_at') as string;
		const location = data.get('location') as string;
		const notes = data.get('notes') as string;

		if (!title || !scheduled_at) {
			return fail(400, { error: 'Title and scheduled time are required' });
		}

		try {
			const meeting = createMeeting({
				body_uuid: association.uuid,
				title,
				scheduled_at,
				location: location || null,
				notes: notes || null,
				created_by_uuid: actingAs,
			});

			return { success: true, meeting_uuid: meeting.uuid };
		} catch (err) {
			return fail(500, { error: (err as Error).message });
		}
	},

	updateStatus: async ({ locals, request }) => {
		if (!locals.session) error(401, 'Not authenticated');
		const actingAs = locals.session.acting_as_uuid;

		const data = await request.formData();
		const meeting_uuid = data.get('meeting_uuid') as string;
		const status = data.get('status') as MeetingStatus;

		if (!meeting_uuid || !status) {
			return fail(400, { error: 'Meeting UUID and status are required' });
		}

		const meeting = getMeetingByUuid(meeting_uuid);
		if (!meeting) return fail(404, { error: 'Meeting not found' });

		if (!hasPermission(actingAs, PERMISSIONS.MOTIONS_ADVANCE, meeting.body_uuid)) {
			return fail(403, { error: 'Insufficient permissions' });
		}

		try {
			updateMeetingStatus(meeting_uuid, status);
			return { success: true };
		} catch (err) {
			return fail(500, { error: (err as Error).message });
		}
	},

	update: async ({ locals, request }) => {
		if (!locals.session) error(401, 'Not authenticated');
		const actingAs = locals.session.acting_as_uuid;

		const data = await request.formData();
		const meeting_uuid = data.get('meeting_uuid') as string;
		const title = data.get('title') as string;
		const scheduled_at = data.get('scheduled_at') as string;
		const location = data.get('location') as string;
		const notes = data.get('notes') as string;

		if (!meeting_uuid) {
			return fail(400, { error: 'Meeting UUID is required' });
		}

		const meeting = getMeetingByUuid(meeting_uuid);
		if (!meeting) return fail(404, { error: 'Meeting not found' });

		if (!hasPermission(actingAs, PERMISSIONS.MOTIONS_ADVANCE, meeting.body_uuid)) {
			return fail(403, { error: 'Insufficient permissions' });
		}

		try {
			updateMeeting(meeting_uuid, {
				title: title || undefined,
				scheduled_at: scheduled_at || undefined,
				location: location || undefined,
				notes: notes || undefined,
			});
			return { success: true };
		} catch (err) {
			return fail(500, { error: (err as Error).message });
		}
	},

	delete: async ({ locals, request }) => {
		if (!locals.session) error(401, 'Not authenticated');
		const actingAs = locals.session.acting_as_uuid;

		const data = await request.formData();
		const meeting_uuid = data.get('meeting_uuid') as string;

		if (!meeting_uuid) {
			return fail(400, { error: 'Meeting UUID is required' });
		}

		const meeting = getMeetingByUuid(meeting_uuid);
		if (!meeting) return fail(404, { error: 'Meeting not found' });

		if (!hasPermission(actingAs, PERMISSIONS.MOTIONS_ADVANCE, meeting.body_uuid)) {
			return fail(403, { error: 'Insufficient permissions' });
		}

		try {
			deleteMeeting(meeting_uuid);
			return { success: true };
		} catch (err) {
			return fail(500, { error: (err as Error).message });
		}
	}
};
