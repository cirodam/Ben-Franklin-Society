import { error } from '@sveltejs/kit';
import type { PageServerLoad } from './$types.js';
import { searchAccounts } from '$lib/server/admin.js';
import { hasAppWideAdmin } from '$lib/server/authorization.js';

export const load: PageServerLoad = async ({ locals, url }) => {
	const session = locals.session;
	
	if (!session) {
		error(401, 'Not authenticated');
	}
	
	// Must have app-wide admin permission
	if (!hasAppWideAdmin(session)) {
		error(403, 'Access denied: Requires bank:admin permission');
	}
	
	const q = url.searchParams.get('q')?.trim() ?? '';
	const accounts = searchAccounts(q);
	return { q, accounts, session };
};
