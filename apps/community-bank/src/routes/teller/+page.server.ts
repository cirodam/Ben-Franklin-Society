import type { PageServerLoad, Actions } from './$types.js';
import { getAccountByHandle, getAccountsByPrincipal } from '$lib/server/accounts.js';
import { getTransactionsForAccount } from '$lib/server/ledger.js';

export const load: PageServerLoad = async ({ url }) => {
	const q = url.searchParams.get('q')?.trim().toLowerCase() ?? '';
	if (!q) return { q: '', result: null, recentTxs: [] };

	// Look up account by handle (searches bank accounts only)
	const account = getAccountByHandle(q);
	if (!account) return { q, result: null, recentTxs: [] };

	// Get all accounts for this principal
	const accounts = getAccountsByPrincipal(account.principal_uuid);

	// Show recent transactions for the Primary account
	const recentTxs = getTransactionsForAccount(account.uuid, { limit: 10 });

	const result = {
		kind: 'account' as const,
		label: `@${account.handle_cache}`,
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
