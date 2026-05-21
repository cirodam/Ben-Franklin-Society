import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types.js';
import { searchAccounts } from '$lib/server/domain/accounts.js';

export const GET: RequestHandler = async ({ url, locals }) => {
	if (!locals.session) {
		return json({ error: 'Unauthorized' }, { status: 401 });
	}

	const query = url.searchParams.get('q') || '';
	const status = url.searchParams.get('status');

	// Get all matching accounts
	let accounts = searchAccounts(query);

	// Apply filters
	if (status) {
		accounts = accounts.filter(a => a.is_frozen === (status === 'frozen' ? 1 : 0));
	}

	// Return results (limit to 50 already in searchAccounts)
	return json({ accounts });
};
