import { error, fail } from '@sveltejs/kit';
import type { PageServerLoad, Actions } from './$types.js';
import {
	getMeetingWithAgenda,
	addAgendaItem,
	removeAgendaItem,
	recordOutcome,
	updateMeetingStatus,
	type ActionTaken,
} from '$lib/server/meetings.js';
import { listMotions } from '$lib/server/motions.js';
import { hasPermission, PERMISSIONS } from '$lib/server/permissions.js';
import { addEntry } from '$lib/server/record.js';
import { audit } from '$lib/server/audit.js';

export const load: PageServerLoad = async ({ params, locals }) => {
	if (!locals.session) error(401, 'Not authenticated');

	const meeting = getMeetingWithAgenda(params.uuid);
	if (!meeting) error(404, 'Meeting not found');

	// Get motions that could be added to agenda (status = introduced or deliberation)
	const availableMotions = listMotions({ bodyUuid: meeting.body_uuid })
		.filter((m) => {
			// Only motions in introduced or deliberation status
			if (m.status !== 'introduced' && m.status !== 'deliberation') return false;
			// Not already on this meeting's agenda
			return !meeting.agenda_items.some((item) => item.motion_uuid === m.uuid);
		});

	const canManage = hasPermission(
		locals.session.acting_as_uuid,
		PERMISSIONS.MOTIONS_ADVANCE,
		meeting.body_uuid
	);

	return {
		meeting,
		availableMotions,
		canManage,
		actingAs: locals.session.acting_as_uuid,
	};
};

export const actions: Actions = {
	addToAgenda: async ({ params, locals, request }) => {
		if (!locals.session) error(401, 'Not authenticated');
		const actingAs = locals.session.acting_as_uuid;

		const meeting = getMeetingWithAgenda(params.uuid);
		if (!meeting) return fail(404, { error: 'Meeting not found' });

		if (!hasPermission(actingAs, PERMISSIONS.MOTIONS_ADVANCE, meeting.body_uuid)) {
			return fail(403, { error: 'Insufficient permissions' });
		}

		const data = await request.formData();
		const motion_uuid = data.get('motion_uuid') as string;
		const notes = data.get('notes') as string;

		if (!motion_uuid) {
			return fail(400, { error: 'Motion UUID is required' });
		}

		try {
			addAgendaItem({
				meeting_uuid: params.uuid,
				motion_uuid,
				notes: notes || null,
			});

			return { success: true };
		} catch (err) {
			return fail(500, { error: (err as Error).message });
		}
	},

	removeFromAgenda: async ({ params, locals, request }) => {
		if (!locals.session) error(401, 'Not authenticated');
		const actingAs = locals.session.acting_as_uuid;

		const meeting = getMeetingWithAgenda(params.uuid);
		if (!meeting) return fail(404, { error: 'Meeting not found' });

		if (!hasPermission(actingAs, PERMISSIONS.MOTIONS_ADVANCE, meeting.body_uuid)) {
			return fail(403, { error: 'Insufficient permissions' });
		}

		const data = await request.formData();
		const agenda_item_uuid = data.get('agenda_item_uuid') as string;

		if (!agenda_item_uuid) {
			return fail(400, { error: 'Agenda item UUID is required' });
		}

		try {
			removeAgendaItem(agenda_item_uuid);
			return { success: true };
		} catch (err) {
			return fail(500, { error: (err as Error).message });
		}
	},

	recordOutcome: async ({ params, locals, request }) => {
		if (!locals.session) error(401, 'Not authenticated');
		const actingAs = locals.session.acting_as_uuid;

		const meeting = getMeetingWithAgenda(params.uuid);
		if (!meeting) return fail(404, { error: 'Meeting not found' });

		if (!hasPermission(actingAs, PERMISSIONS.MOTIONS_ADVANCE, meeting.body_uuid)) {
			return fail(403, { error: 'Insufficient permissions' });
		}

		const data = await request.formData();
		const motion_uuid = data.get('motion_uuid') as string;
		const action_taken = data.get('action_taken') as ActionTaken;
		const vote_aye = data.get('vote_aye') as string;
		const vote_nay = data.get('vote_nay') as string;
		const vote_abstain = data.get('vote_abstain') as string;
		const notes = data.get('notes') as string;

		if (!motion_uuid || !action_taken) {
			return fail(400, { error: 'Motion UUID and action are required' });
		}

		try {
			const outcome = recordOutcome({
				meeting_uuid: params.uuid,
				motion_uuid,
				action_taken,
				vote_aye: vote_aye ? parseInt(vote_aye, 10) : null,
				vote_nay: vote_nay ? parseInt(vote_nay, 10) : null,
				vote_abstain: vote_abstain ? parseInt(vote_abstain, 10) : null,
				notes: notes || null,
				recorded_by_uuid: actingAs,
			});

			// Record in the official record
			addEntry(
				meeting.body_uuid,
				actingAs,
				`meeting_outcome_${action_taken}`,
				'motion',
				motion_uuid,
				`Meeting outcome: ${action_taken} for motion "${meeting.agenda_items.find((i) => i.motion_uuid === motion_uuid)?.motion_title}"`
			);

			audit(
				actingAs,
				`meeting.outcome.${action_taken}`,
				'motion',
				motion_uuid,
				`Recorded outcome at meeting "${meeting.title}"`
			);

			return { success: true, outcome_uuid: outcome.uuid };
		} catch (err) {
			return fail(500, { error: (err as Error).message });
		}
	},

	startMeeting: async ({ params, locals }) => {
		if (!locals.session) error(401, 'Not authenticated');
		const actingAs = locals.session.acting_as_uuid;

		const meeting = getMeetingWithAgenda(params.uuid);
		if (!meeting) return fail(404, { error: 'Meeting not found' });

		if (!hasPermission(actingAs, PERMISSIONS.MOTIONS_ADVANCE, meeting.body_uuid)) {
			return fail(403, { error: 'Insufficient permissions' });
		}

		try {
			updateMeetingStatus(params.uuid, 'in_progress');
			return { success: true };
		} catch (err) {
			return fail(500, { error: (err as Error).message });
		}
	},

	completeMeeting: async ({ params, locals }) => {
		if (!locals.session) error(401, 'Not authenticated');
		const actingAs = locals.session.acting_as_uuid;

		const meeting = getMeetingWithAgenda(params.uuid);
		if (!meeting) return fail(404, { error: 'Meeting not found' });

		if (!hasPermission(actingAs, PERMISSIONS.MOTIONS_ADVANCE, meeting.body_uuid)) {
			return fail(403, { error: 'Insufficient permissions' });
		}

		try {
			updateMeetingStatus(params.uuid, 'completed');
			return { success: true };
		} catch (err) {
			return fail(500, { error: (err as Error).message });
		}
	},
};
