import { error } from '@sveltejs/kit';
import type { PageServerLoad } from './$types.js';
import { getAccountByUuid, getAccountsForContext } from '$lib/server/domain/accounts.js';
import { canAccessAccount } from '$lib/server/auth/authorization.js';
import { getTransactionsForAccount } from '$lib/server/core/ledger.js';

const RECENT_TRANSACTIONS_LIMIT = 20;

export const load: PageServerLoad = async ({ locals, params }) => {
	const session = locals.session!;
	const accountUuid = params.uuid;

	// Get the specific account
	const account = getAccountByUuid(accountUuid);
	if (!account) {
		error(404, 'Account not found');
	}

	// Verify access to the account (owner or admin)
	if (!canAccessAccount(session, account)) {
		error(403, 'Access denied');
	}

	// Get all accounts for the current context (for transfer context)
	const allAccounts = getAccountsForContext(session);

	// Get recent transactions
	const recentTransactions = getTransactionsForAccount(accountUuid, {
		limit: RECENT_TRANSACTIONS_LIMIT,
		offset: 0,
	});

	return {
		account,
		allAccounts,
		recentTransactions,
	};
};
