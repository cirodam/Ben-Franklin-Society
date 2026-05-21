import { fail } from '@sveltejs/kit';
import type { PageServerLoad, Actions } from './$types.js';
import { getAccountsForContext, createAccount, getAccountByOwnerAndName } from '$lib/server/accounts.js';

export const load: PageServerLoad = async ({ locals, parent }) => {
	const session = locals.session;

	// If no session, parent layout will redirect to login
	if (!session) {
		return { accounts: [] };
	}

	let accounts = getAccountsForContext(session);

	// Auto-provision a Primary account on first visit if none exists for this context
	if (accounts.length === 0) {
		createAccount({
			owner_uuid: session.acting_as_uuid,
			name: 'Primary',
			handle_cache: session.handle,
		});
		accounts = getAccountsForContext(session);
	}
	
	// Get parent data (session, isAdmin, etc)
	const parentData = await parent();

	return { 
		accounts,
		...parentData
	};
};

export const actions: Actions = {
	create_account: async ({ locals, request }) => {
		const session = locals.session!;
		const data = await request.formData();
		const name = String(data.get('name') ?? '').trim();

		if (!name) {
			return fail(400, { error: 'Account name is required' });
		}

		// Check if account with this name already exists
		const existing = getAccountByOwnerAndName(session.acting_as_uuid, name);
		if (existing) {
			return fail(400, { error: `You already have an account named "${name}"` });
		}

		// Validate name (alphanumeric, spaces, hyphens, underscores)
		if (!/^[a-zA-Z0-9 _-]+$/.test(name)) {
			return fail(400, { error: 'Account name can only contain letters, numbers, spaces, hyphens, and underscores' });
		}

		if (name.length > 50) {
			return fail(400, { error: 'Account name must be 50 characters or less' });
		}

		try {
			createAccount({
				owner_uuid: session.acting_as_uuid,
				name,
				handle_cache: session.handle,
				account_type: 'standard',
			});

			return { success: true };
		} catch (err) {
			return fail(500, { error: 'Failed to create account' });
		}
	}
};
