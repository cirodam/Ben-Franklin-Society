import { fail, error } from '@sveltejs/kit';
import type { PageServerLoad, Actions } from './$types.js';
import {
	getAllGroupedTransfers,
	createGroupedTransfer,
	pauseGroupedTransfer,
	unpauseGroupedTransfer,
	cancelGroupedTransfer,
	logAdminAction,
	type TransferMode,
	type TargetFilter,
} from '$lib/server/admin.js';
import { db } from '$lib/server/db.js';

function getTransfer(uuid: string) {
	return db
		.prepare(`SELECT * FROM scheduled_transfer WHERE uuid = ?`)
		.get(uuid) as { uuid: string; status: string } | undefined;
}

export const load: PageServerLoad = async () => {
	return { transfers: getAllGroupedTransfers() };
};

export const actions: Actions = {
	create: async ({ request, locals }) => {
		const data = await request.formData();
		const name = String(data.get('name') ?? '').trim();
		const transferMode = String(data.get('transfer_mode') ?? 'flat') as TransferMode;
		const targetFilter = String(data.get('target_filter') ?? 'specific') as TargetFilter;
		const toUuid = String(data.get('to_uuid') ?? '').trim();
		const schedule = String(data.get('schedule') ?? 'monthly') as 'daily' | 'weekly' | 'monthly';
		const type = String(data.get('type') ?? 'transfer').trim();

		// Validation
		if (!name) return fail(400, { error: 'Transfer name is required' });
		if (!toUuid) return fail(400, { error: 'Recipient account is required' });

		try {
			const opts: Parameters<typeof createGroupedTransfer>[0] = {
				name,
				to_uuid: toUuid,
				type,
				schedule,
				requested_by_principal_uuid: locals.session!.acting_as_uuid,
				transfer_mode: transferMode,
				target_filter: targetFilter,
			};

			if (transferMode === 'flat') {
				const fromUuid = String(data.get('from_uuid') ?? '').trim();
				const amount = parseFloat(String(data.get('amount') ?? '0'));
				if (!fromUuid) return fail(400, { error: 'Source account is required for flat transfers' });
				if (!amount || amount <= 0) return fail(400, { error: 'Amount must be positive' });
				
				opts.from_uuid = fromUuid;
				opts.amount = Math.round(amount * 100); // Convert to cents
			} else {
				// Percentage mode
				const ratePercentage = parseFloat(String(data.get('rate_percentage') ?? '0'));
				const thresholdFranks = parseFloat(String(data.get('threshold') ?? '0'));
				
				if (!ratePercentage || ratePercentage <= 0 || ratePercentage > 100) {
					return fail(400, { error: 'Rate percentage must be between 0 and 100' });
				}
				
				opts.rate_percentage = ratePercentage / 100; // Convert to decimal (0.005 for 0.5%)
				
				if (targetFilter === 'all_above_threshold') {
					if (!thresholdFranks || thresholdFranks <= 0) {
						return fail(400, { error: 'Threshold is required for above-threshold filter' });
					}
					opts.threshold = Math.round(thresholdFranks * 100); // Convert to cents
				}
			}

			const transfer = createGroupedTransfer(opts);
			
			logAdminAction({
				action: 'create_grouped_transfer',
				target_uuid: transfer.uuid,
				target_type: 'scheduled_transfer',
				actor_uuid: locals.session!.acting_as_uuid,
				memo: `Created grouped transfer: ${name}`,
			});

			return { success: true, created: transfer.uuid };
		} catch (err) {
			return fail(400, { error: String(err) });
		}
	},

	pause: async ({ request, locals }) => {
		const data = await request.formData();
		const uuid = String(data.get('uuid') ?? '').trim();
		const transfer = getTransfer(uuid);
		if (!transfer) return fail(404, { error: 'Transfer not found.' });
		if (transfer.status !== 'active') return fail(400, { error: 'Only active transfers can be paused.' });

		pauseGroupedTransfer(uuid);
		logAdminAction({
			action: 'pause_grouped_transfer',
			target_uuid: uuid,
			target_type: 'scheduled_transfer',
			actor_uuid: locals.session!.acting_as_uuid,
			memo: 'Grouped transfer paused by admin.',
		});
		return { success: true };
	},

	unpause: async ({ request, locals }) => {
		const data = await request.formData();
		const uuid = String(data.get('uuid') ?? '').trim();
		const transfer = getTransfer(uuid);
		if (!transfer) return fail(404, { error: 'Transfer not found.' });
		if (transfer.status !== 'paused') return fail(400, { error: 'Only paused transfers can be unpaused.' });

		unpauseGroupedTransfer(uuid);
		logAdminAction({
			action: 'unpause_grouped_transfer',
			target_uuid: uuid,
			target_type: 'scheduled_transfer',
			actor_uuid: locals.session!.acting_as_uuid,
			memo: 'Grouped transfer unpaused by admin.',
		});
		return { success: true };
	},

	cancel: async ({ request, locals }) => {
		const data = await request.formData();
		const uuid = String(data.get('uuid') ?? '').trim();
		const transfer = getTransfer(uuid);
		if (!transfer) return fail(404, { error: 'Transfer not found.' });
		if (transfer.status === 'cancelled') return fail(400, { error: 'Transfer is already cancelled.' });

		cancelGroupedTransfer(uuid);
		logAdminAction({
			action: 'cancel_grouped_transfer',
			target_uuid: uuid,
			target_type: 'scheduled_transfer',
			actor_uuid: locals.session!.acting_as_uuid,
			memo: 'Scheduled transfer cancelled by admin.',
		});
		return { success: true };
	},
};
