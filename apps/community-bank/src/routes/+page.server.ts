import type { PageServerLoad } from './$types.js';
import { getAccountsByPrincipal, createAccount } from '$lib/server/accounts.js';

export const load: PageServerLoad = async ({ locals }) => {
	const session = locals.session!;

	let accounts = getAccountsByPrincipal(session.acting_as_uuid);

	// Auto-provision a Primary account on first visit if none exists.
	if (accounts.length === 0) {
		createAccount({
			principal_uuid: session.acting_as_uuid,
			name: 'Primary',
			handle_cache: session.handle,
		});
		accounts = getAccountsByPrincipal(session.acting_as_uuid);
	}

	return { accounts };
};
