import type { PageServerLoad } from './$types.js';
import { getAccountsByOwner, type Account } from '$lib/server/domain/accounts.js';
import { getTransactionsForAccount } from '$lib/server/core/ledger.js';
import { error } from '@sveltejs/kit';

const PAGE_SIZE = 50;

export const load: PageServerLoad = async ({ locals, url }) => {
	const session = locals.session!;
	const accounts = getAccountsByOwner(session.acting_as_uuid);

	const accountUuid = url.searchParams.get('account') ?? accounts[0]?.uuid ?? null;
	const typeFilter  = url.searchParams.get('type') ?? '';
	const offset      = parseInt(url.searchParams.get('offset') ?? '0', 10);

	if (!accountUuid) return { accounts, transactions: [], account: null, typeFilter, offset, hasMore: false };

	// Ensure the account belongs to the acting principal.
	const account = accounts.find((a: Account) => a.uuid === accountUuid);
	if (!account) error(403, 'Not your account.');

	const transactions = getTransactionsForAccount(accountUuid, {
		limit:  PAGE_SIZE + 1,
		offset,
		type:   typeFilter || undefined,
	});

	const hasMore = transactions.length > PAGE_SIZE;
	if (hasMore) transactions.pop();

	return { accounts, account, transactions, typeFilter, offset, hasMore };
};
