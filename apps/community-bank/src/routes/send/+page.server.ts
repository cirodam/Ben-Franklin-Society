import { fail } from '@sveltejs/kit';
import type { PageServerLoad, Actions } from './$types.js';
import { getAccountsByPrincipal, getAccountByUuid, getAccountByPrincipalAndName } from '$lib/server/accounts.js';
import { postTransaction } from '$lib/server/ledger.js';
import { lookupPersonByHandle, lookupAssociationByHandle } from '$lib/server/governance-api.js';

export const load: PageServerLoad = async ({ locals, url }) => {
	const session = locals.session!;
	const accounts = getAccountsByPrincipal(session.acting_as_uuid).filter(
		(a) => a.status === 'active'
	);
	const preselect = url.searchParams.get('from') ?? '';
	return { accounts, preselect };
};

/** Resolve a handle string to an account UUID in the bank DB. */
async function resolveRecipient(handle: string): Promise<{ account_uuid: string } | null> {
	// Look up the person by handle in Governance, then find their Primary account.
	const person = await lookupPersonByHandle(handle);
	if (person && person.status !== 'revoked') {
		const acct = getAccountByPrincipalAndName(person.uuid, 'Primary');
		return acct ? { account_uuid: acct.uuid } : null;
	}
	// Could also be an association handle.
	const assoc = await lookupAssociationByHandle(handle);
	if (assoc && assoc.status === 'active') {
		const acct = getAccountByPrincipalAndName(assoc.uuid, 'Primary');
		return acct ? { account_uuid: acct.uuid } : null;
	}
	return null;
}

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

		// Resolve recipient.
		const recipient = await resolveRecipient(to_handle);
		if (!recipient)
			return fail(400, { error: `No account found for @${to_handle}.` });

		if (recipient.account_uuid === from_uuid)
			return fail(400, { error: 'Cannot send to yourself.' });

		const toAccount = getAccountByUuid(recipient.account_uuid);
		if (!toAccount || toAccount.status === 'frozen')
			return fail(400, { error: 'Recipient account is frozen.' });

		postTransaction({
			from_uuid,
			to_uuid: recipient.account_uuid,
			amount,
			type: 'transfer',
			source: 'online',
			memo,
		});

		return { success: true };
	},
};
