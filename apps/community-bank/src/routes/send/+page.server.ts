	import { fail } from '@sveltejs/kit';
import type { PageServerLoad, Actions } from './$types.js';
import { getAccountsForContext, getAccountByUuid, searchAccounts } from '$lib/server/domain/accounts.js';
import { canTransferFrom } from '$lib/server/auth/authorization.js';
import { postTransaction } from '$lib/server/core/ledger.js';
import { TransactionType, TransactionSource } from '$lib/server/transaction-types.js';

export const load: PageServerLoad = async ({ locals, url }) => {
	const session = locals.session!;
	const accounts = getAccountsForContext(session).filter(
		(a) => a.is_frozen === 0
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
		const currency    = String(data.get('currency')     ?? 'franks').trim();
		const amount_str  = String(data.get('amount')       ?? '').trim();
		const memo        = String(data.get('memo')         ?? '').trim() || null;

		if (!from_uuid || !to_handle || !amount_str)
			return fail(400, { error: 'All fields are required.' });

		if (!['franks', 'florens'].includes(currency))
			return fail(400, { error: 'Invalid currency type.' });

		const amount = parseInt(amount_str, 10);
		if (isNaN(amount) || amount <= 0)
			return fail(400, { error: 'Amount must be a positive whole number.' });

		// Verify the source account belongs to the acting principal and we have permission
		const fromAccount = getAccountByUuid(from_uuid);
		if (!fromAccount)
			return fail(404, { error: 'Account not found.' });
		
		if (!canTransferFrom(session, fromAccount))
			return fail(403, { error: 'Not authorized to transfer from this account.' });
		
		if (fromAccount.is_frozen === 1)
			return fail(403, { error: 'That account is frozen.' });

		// Resolve recipient by handle (search by name/uuid)
		const searchResults = searchAccounts(to_handle, 5);
		const toAccount = searchResults[0];
		if (!toAccount)
			return fail(400, { error: `No account found matching "${to_handle}".` });

		if (toAccount.uuid === from_uuid)
			return fail(400, { error: 'Cannot send to yourself.' });

		if (toAccount.is_frozen === 1)
			return fail(400, { error: 'Recipient account is frozen.' });

		postTransaction({
			from_uuid,
			to_uuid: toAccount.uuid,
			currency: currency as 'franks' | 'florens',
			amount,
			type: TransactionType.TRANSFER,
			source: TransactionSource.ONLINE,
			memo,
		});

		return { success: true };
	},
};
