import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types.js';
import { searchAccounts } from '$lib/server/accounts.js';

export const GET: RequestHandler = async ({ url, locals }) => {
	if (!locals.session) {
		return json({ error: 'Unauthorized' }, { status: 401 });
	}

	const query = url.searchParams.get('q') || '';
	const accountType = url.searchParams.get('account_type');
	const status = url.searchParams.get('status');

	// Get all matching accounts
	let accounts = searchAccounts(query);

	// Apply filters
	if (accountType) {
		accounts = accounts.filter(a => a.account_type === accountType);
	}
	if (status) {
		accounts = accounts.filter(a => a.status === status);
	}

	// Return results (limit to 50 already in searchAccounts)
	return json({ accounts });
};
