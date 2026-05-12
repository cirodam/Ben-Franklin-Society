import { fail, error } from '@sveltejs/kit';
import type { PageServerLoad, Actions } from './$types.js';
import {
	getAllScheduledTransfers,
	pauseScheduledTransfer,
	unpauseScheduledTransfer,
	cancelScheduledTransfer,
	logAdminAction,
} from '$lib/server/admin.js';
import { db } from '$lib/server/db.js';

function getTransfer(uuid: string) {
	return db
		.prepare(`SELECT * FROM scheduled_transfer WHERE uuid = ?`)
		.get(uuid) as { uuid: string; status: string } | undefined;
}

export const load: PageServerLoad = async () => {
	return { transfers: getAllScheduledTransfers() };
};

export const actions: Actions = {
	pause: async ({ request, locals }) => {
		const data = await request.formData();
		const uuid = String(data.get('uuid') ?? '').trim();
		const transfer = getTransfer(uuid);
		if (!transfer) return fail(404, { error: 'Transfer not found.' });
		if (transfer.status !== 'active') return fail(400, { error: 'Only active transfers can be paused.' });

		pauseScheduledTransfer(uuid);
		logAdminAction({
			action: 'pause_scheduled_transfer',
			target_uuid: uuid,
			target_type: 'scheduled_transfer',
			actor_uuid: locals.session!.acting_as_uuid,
			memo: 'Scheduled transfer paused by admin.',
		});
		return { success: true };
	},

	unpause: async ({ request, locals }) => {
		const data = await request.formData();
		const uuid = String(data.get('uuid') ?? '').trim();
		const transfer = getTransfer(uuid);
		if (!transfer) return fail(404, { error: 'Transfer not found.' });
		if (transfer.status !== 'paused') return fail(400, { error: 'Only paused transfers can be unpaused.' });

		unpauseScheduledTransfer(uuid);
		logAdminAction({
			action: 'unpause_scheduled_transfer',
			target_uuid: uuid,
			target_type: 'scheduled_transfer',
			actor_uuid: locals.session!.acting_as_uuid,
			memo: 'Scheduled transfer unpaused by admin.',
		});
		return { success: true };
	},

	cancel: async ({ request, locals }) => {
		const data = await request.formData();
		const uuid = String(data.get('uuid') ?? '').trim();
		const transfer = getTransfer(uuid);
		if (!transfer) return fail(404, { error: 'Transfer not found.' });
		if (transfer.status === 'cancelled') return fail(400, { error: 'Transfer is already cancelled.' });

		cancelScheduledTransfer(uuid);
		logAdminAction({
			action: 'cancel_scheduled_transfer',
			target_uuid: uuid,
			target_type: 'scheduled_transfer',
			actor_uuid: locals.session!.acting_as_uuid,
			memo: 'Scheduled transfer cancelled by admin.',
		});
		return { success: true };
	},
};
