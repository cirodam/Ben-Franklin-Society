import type { PageServerLoad } from './$types.js';
import { getAccountByPrincipalAndName } from '$lib/server/accounts.js';
import { getTransactionsForNamedAccount } from '$lib/server/ledger.js';
import { lookupAssociationByHandle } from '$lib/server/governance-api.js';

const PAGE_SIZE = 50;

async function getSpecialAccount(assocHandle: string, accountName: string) {
	const assoc = await lookupAssociationByHandle(assocHandle);
	if (!assoc) return null;
	return getAccountByPrincipalAndName(assoc.uuid, accountName);
}

export const load: PageServerLoad = async ({ url }) => {
	const offset = parseInt(url.searchParams.get('offset') ?? '0', 10);
	const view   = url.searchParams.get('view') ?? 'treasury'; // 'treasury' | 'sif'

	const treasury = await getSpecialAccount('society', 'Treasury');
	const sif      = await getSpecialAccount('social-insurance', 'Social Insurance Fund');

	const account   = view === 'sif' ? sif : treasury;
	const txs = account
		? getTransactionsForNamedAccount(account.name, { limit: PAGE_SIZE + 1, offset })
		: [];

	const hasMore = txs.length > PAGE_SIZE;
	if (hasMore) txs.pop();

	return { treasury, sif, account, transactions: txs, view, offset, hasMore };
};
