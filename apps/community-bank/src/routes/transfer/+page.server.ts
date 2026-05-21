import { fail, redirect } from '@sveltejs/kit';
import type { PageServerLoad, Actions } from './$types.js';
import { getAccountsForContext, getAccountByUuid } from '$lib/server/domain/accounts.js';
import { canTransferFrom } from '$lib/server/auth/authorization.js';
import { postTransaction } from '$lib/server/core/ledger.js';
import { TransactionType, TransactionSource } from '$lib/server/transaction-types.js';

export const load: PageServerLoad = async ({ locals, url }) => {
	const session = locals.session!;
	const accounts = getAccountsForContext(session).filter(
		(a) => a.is_frozen === 0
	);
	
	// Require at least 2 accounts for internal transfers
	if (accounts.length < 2) {
		throw redirect(303, '/');
	}
	
	const preselect = url.searchParams.get('from') ?? '';
	return { accounts, preselect };
};

export const actions: Actions = {
	default: async ({ locals, request }) => {
		const session = locals.session!;
		const data = await request.formData();

		const from_uuid   = String(data.get('from_uuid')    ?? '').trim();
		const to_uuid     = String(data.get('to_uuid')      ?? '').trim();
		const amount_str  = String(data.get('amount')       ?? '').trim();
		const memo        = String(data.get('memo')         ?? '').trim() || null;

		if (!from_uuid || !to_uuid || !amount_str)
			return fail(400, { error: 'All fields are required.' });

		const amount = parseInt(amount_str, 10);
		if (isNaN(amount) || amount <= 0)
			return fail(400, { error: 'Amount must be a positive whole number.' });

		// Verify both accounts exist and we have permission
		const fromAccount = getAccountByUuid(from_uuid);
		const toAccount = getAccountByUuid(to_uuid);

		if (!fromAccount)
			return fail(404, { error: 'Source account not found.' });
		
		if (!toAccount)
			return fail(404, { error: 'Destination account not found.' });
		
		// Check transfer permission (must own from account or be admin)
		if (!canTransferFrom(session, fromAccount))
			return fail(403, { error: 'Not authorized to transfer from this account.' });
		
		// For internal transfers, must also own destination
		if (toAccount.owner_uuid !== session.acting_as_uuid)
			return fail(403, { error: 'Destination account not yours.' });

		if (fromAccount.is_frozen === 1)
			return fail(403, { error: 'Source account is frozen.' });

		if (toAccount.is_frozen === 1)
			return fail(403, { error: 'Destination account is frozen.' });

		if (from_uuid === to_uuid)
			return fail(400, { error: 'Cannot transfer to the same account.' });

		postTransaction({
			from_uuid,
			to_uuid,
			amount,
			type: TransactionType.TRANSFER,
			source: TransactionSource.ONLINE,
			memo: memo || `Transfer from ${fromAccount.name} to ${toAccount.name}`,
		});

		throw redirect(303, '/');
	},
};
