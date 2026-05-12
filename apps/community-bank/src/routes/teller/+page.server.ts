import type { PageServerLoad, Actions } from './$types.js';
import { getAccountByPrincipalAndName, getAccountsByPrincipal } from '$lib/server/accounts.js';
import { getTransactionsForAccount } from '$lib/server/ledger.js';
import { lookupPersonByHandle, lookupAssociationByHandle } from '$lib/server/governance-api.js';

async function lookupByHandle(handle: string) {
	// Person first, then association.
	const person = await lookupPersonByHandle(handle);

	if (person && person.status !== 'revoked') {
		const accounts = getAccountsByPrincipal(person.uuid);
		return { kind: 'person' as const, label: `${person.given_name} ${person.family_name} (@${person.handle})`, accounts };
	}

	const assoc = await lookupAssociationByHandle(handle);

	if (assoc && assoc.status !== 'dissolved') {
		const accounts = getAccountsByPrincipal(assoc.uuid);
		return { kind: 'association' as const, label: `${assoc.name} (@${assoc.handle})`, accounts };
	}

	return null;
}

export const load: PageServerLoad = async ({ url }) => {
	const q = url.searchParams.get('q')?.trim().toLowerCase() ?? '';
	if (!q) return { q: '', result: null, recentTxs: [] };

	const result = await lookupByHandle(q);
	if (!result || result.accounts.length === 0) return { q, result: null, recentTxs: [] };

	// Show recent transactions for their Primary (or first) account.
	const primary = result.accounts.find((a) => a.name === 'Primary') ?? result.accounts[0];
	const recentTxs = getTransactionsForAccount(primary.uuid, { limit: 10 });

	return { q, result, recentTxs };
};

export const actions: Actions = {
	lookup: async ({ request }) => {
		const data = await request.formData();
		const handle = String(data.get('handle') ?? '').trim().toLowerCase();
		return { handle };
	},
};
