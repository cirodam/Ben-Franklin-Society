import type { PageServerLoad } from './$types.js';
import { searchAccounts } from '$lib/server/admin.js';

export const load: PageServerLoad = async ({ url }) => {
	const q = url.searchParams.get('q')?.trim() ?? '';
	const accounts = searchAccounts(q);
	return { q, accounts };
};
