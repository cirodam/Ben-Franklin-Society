import type { PageServerLoad, Actions } from './$types.js';
import { searchAccounts, getAccountsByOwner } from '$lib/server/accounts.js';
import { getTransactionsForAccount } from '$lib/server/ledger.js';

export const load: PageServerLoad = async ({ url }) => {
	const q = url.searchParams.get('q')?.trim().toLowerCase() ?? '';
	if (!q) return { q: '', result: null, recentTxs: [] };

	// Look up account by handle (searches bank accounts only)
	const searchResults = searchAccounts(q, 5);
	const account = searchResults[0];
	if (!account) return { q, result: null, recentTxs: [] };

	// Get all accounts for this owner
	const accounts = getAccountsByOwner(account.owner_uuid);

	// Show recent transactions for the account
	const recentTxs = getTransactionsForAccount(account.uuid, { limit: 10 });

	const result = {
		kind: 'account' as const,
		label: account.name,
		accounts,
	};

	return { q, result, recentTxs };
};

export const actions: Actions = {
	lookup: async ({ request }) => {
		const data = await request.formData();
		const handle = String(data.get('handle') ?? '').trim().toLowerCase();
		return { handle };
	},
};
