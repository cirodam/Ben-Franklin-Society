import { fail, redirect } from '@sveltejs/kit';
import type { PageServerLoad, Actions } from './$types.js';
import { getAccountsForContext, getAccountByUuid, getAccountsByOwner } from '$lib/server/domain/accounts.js';
import { canTransferFrom } from '$lib/server/auth/authorization.js';
import { postTransaction } from '$lib/server/core/ledger.js';
import { TransactionType, TransactionSource } from '$lib/server/transaction-types.js';
import { resolveHandle } from '$lib/server/external/governance.js';

export const load: PageServerLoad = async ({ locals, url }) => {
	const session = locals.session!;
	const accounts = getAccountsForContext(session).filter(
		(a) => a.is_frozen === 0
	);
	
	// Need at least one account to transfer from
	if (accounts.length === 0) {
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
		const to_input    = String(data.get('to_input')     ?? '').trim(); // Can be UUID or handle
		const currency    = String(data.get('currency')     ?? 'franks').trim();
		const amount_str  = String(data.get('amount')       ?? '').trim();
		const memo        = String(data.get('memo')         ?? '').trim() || null;

		if (!from_uuid || !to_input || !amount_str)
			return fail(400, { error: 'All fields are required.' });

		if (!['franks', 'florens'].includes(currency))
			return fail(400, { error: 'Invalid currency type.' });

		// Parse amount as decimal (e.g., 12.54) and convert to cents (1254)
		const amountDecimal = parseFloat(amount_str);
		if (isNaN(amountDecimal) || amountDecimal <= 0)
			return fail(400, { error: 'Amount must be a positive number.' });
		
		// Validate max 2 decimal places
		if (!/^\d+(\.\d{1,2})?$/.test(amount_str))
			return fail(400, { error: 'Amount can have at most 2 decimal places.' });
		
		const amount = Math.round(amountDecimal * 100); // Convert to cents

		// Verify source account exists and we have permission
		const fromAccount = getAccountByUuid(from_uuid);
		
		// Resolve destination - could be a UUID or a handle
		let toAccount = getAccountByUuid(to_input);
		
		if (!toAccount) {
			// Try resolving as a handle
			const personInfo = await resolveHandle(to_input);
			if (!personInfo) {
				return fail(404, { error: `No account found matching "${to_input}".` });
			}
			
			// Find this person's accounts (use their primary/first account)
			const personAccounts = getAccountsByOwner(personInfo.uuid);
			if (personAccounts.length === 0) {
				return fail(404, { error: `${personInfo.name} has no bank accounts.` });
			}
			
			toAccount = personAccounts[0]; // Use first account
		}

		if (!fromAccount)
			return fail(404, { error: 'Source account not found.' });
		
		if (!toAccount)
			return fail(404, { error: 'Destination account not found.' });
		
		// Check transfer permission (must own from account or be admin)
		if (!canTransferFrom(session, fromAccount))
			return fail(403, { error: 'Not authorized to transfer from this account.' });

		if (fromAccount.is_frozen === 1)
			return fail(403, { error: 'Source account is frozen.' });

		if (toAccount.is_frozen === 1)
			return fail(403, { error: 'Destination account is frozen.' });

		if (from_uuid === to_uuid)
			return fail(400, { error: 'Cannot transfer to the same account.' });

		postTransaction({
			from_uuid,
			to_uuid,
			currency: currency as 'franks' | 'florens',
			amount,
			type: TransactionType.TRANSFER,
			source: TransactionSource.ONLINE,
			memo: memo || `Transfer from ${fromAccount.name} to ${toAccount.name}`,
		});

		throw redirect(303, '/');
	},
};
