import type { PageServerLoad } from './$types.js';
import { getLedgerStats } from '$lib/server/ledger.js';

export const load: PageServerLoad = async () => {
	return { stats: getLedgerStats() };
};
