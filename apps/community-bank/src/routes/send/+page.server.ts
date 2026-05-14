import { fail } from '@sveltejs/kit';
import type { PageServerLoad, Actions } from './$types.js';
import { getAccountsByPrincipal, getAccountByUuid, getAccountByHandle } from '$lib/server/accounts.js';
import { postTransaction } from '$lib/server/ledger.js';
import { TransactionType, TransactionSource } from '$lib/server/transaction-types.js';

export const load: PageServerLoad = async ({ locals, url }) => {
	const session = locals.session!;
	const accounts = getAccountsByPrincipal(session.acting_as_uuid).filter(
		(a) => a.status === 'active'
	);
	const preselect = url.searchParams.get('from') ?? '';
	return { accounts, preselect };
};

export const actions: Actions = {
	default: async ({ locals, request }) => {
		const session = locals.session!;
		const data = await request.formData();

		const from_uuid   = String(data.get('from_uuid')    ?? '').trim();
		const to_handle   = String(data.get('to_handle')    ?? '').trim().toLowerCase();
		const amount_str  = String(data.get('amount')       ?? '').trim();
		const memo        = String(data.get('memo')         ?? '').trim() || null;

		if (!from_uuid || !to_handle || !amount_str)
			return fail(400, { error: 'All fields are required.' });

		const amount = parseInt(amount_str, 10);
		if (isNaN(amount) || amount <= 0)
			return fail(400, { error: 'Amount must be a positive whole number.' });

		// Verify the source account belongs to the acting principal.
		const fromAccount = getAccountByUuid(from_uuid);
		if (!fromAccount || fromAccount.principal_uuid !== session.acting_as_uuid)
			return fail(403, { error: 'Not your account.' });
		if (fromAccount.status === 'frozen')
			return fail(403, { error: 'That account is frozen.' });

		// Resolve recipient by handle (searches bank accounts only).
		const toAccount = getAccountByHandle(to_handle);
		if (!toAccount)
			return fail(400, { error: `No account found for @${to_handle}.` });

		if (toAccount.uuid === from_uuid)
			return fail(400, { error: 'Cannot send to yourself.' });

		if (toAccount.status === 'frozen')
			return fail(400, { error: 'Recipient account is frozen.' });

		postTransaction({
			from_uuid,
			to_uuid: toAccount.uuid,
			amount,
			type: TransactionType.TRANSFER,
			source: TransactionSource.ONLINE,
			memo,
		});

		return { success: true };
	},
};
