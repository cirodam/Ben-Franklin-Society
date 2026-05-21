import { fail } from '@sveltejs/kit';
import type { PageServerLoad, Actions } from './$types.js';
import { searchAccounts, getAccountByUuid } from '$lib/server/domain/accounts.js';
import { postTransaction, getSlipsForTellerToday } from '$lib/server/core/ledger.js';
import { TransactionType, TransactionSource } from '$lib/server/transaction-types.js';

export const load: PageServerLoad = async ({ locals }) => {
	const session = locals.session!;
	const slips = getSlipsForTellerToday(session.acting_as_uuid);
	return { slips };
};

export const actions: Actions = {
	default: async ({ locals, request }) => {
		const session = locals.session!;
		const data = await request.formData();

		const from_handle  = String(data.get('from_handle')  ?? '').trim().toLowerCase();
		const to_handle    = String(data.get('to_handle')    ?? '').trim().toLowerCase();
		const amount_str   = String(data.get('amount')       ?? '').trim();
		const slip_serial  = String(data.get('slip_serial')  ?? '').trim();
		const memo         = String(data.get('memo')         ?? '').trim() || null;

		if (!from_handle || !to_handle || !amount_str || !slip_serial)
			return fail(400, { error: 'All fields are required, including the slip serial number.' });

		const amount = parseInt(amount_str, 10);
		if (isNaN(amount) || amount <= 0)
			return fail(400, { error: 'Amount must be a positive whole number.' });

		if (from_handle === to_handle)
			return fail(400, { error: 'From and to handles must be different.' });

		const fromResults = searchAccounts(from_handle, 5);
		const fromAccount = fromResults[0];
		if (!fromAccount)
			return fail(400, { error: `No account found matching "${from_handle}".` });

		const toResults = searchAccounts(to_handle, 5);
		const toAccount = toResults[0];
		if (!toAccount)
			return fail(400, { error: `No account found matching "${to_handle}".` });

		if (fromAccount.is_frozen === 1)
			return fail(400, { error: `Account for "${fromAccount.name}" is frozen.` });
		if (toAccount.is_frozen === 1)
			return fail(400, { error: `Account for "${toAccount.name}" is frozen.` });

		postTransaction({
			from_uuid: fromAccount.uuid,
			to_uuid: toAccount.uuid,
			amount,
			type: TransactionType.TRANSFER,
			source: TransactionSource.TELLER,
			slip_serial,
			memo,
			entered_by_uuid: session.acting_as_uuid,
		});

		return { success: true };
	},
};
