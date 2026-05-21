import { fail, error } from '@sveltejs/kit';
import type { PageServerLoad, Actions } from './$types.js';
import { 
	createAccount, 
	searchAccounts, 
	updateAccountMetadata,
	type AccountType 
} from '$lib/server/accounts.js';
import { logAdminAction } from '$lib/server/admin.js';
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
	
	const query = url.searchParams.get('q') || '';
	const accounts = query ? searchAccounts(query) : [];
	
	return {
		accounts,
		query,
	};
};

export const actions: Actions = {
	create: async ({ request, locals }) => {
		const session = locals.session!;
		
		if (!hasAppWideAdmin(session)) {
			return fail(403, { error: 'Access denied: Requires bank:admin permission' });
		}
		
		const data = await request.formData();
		const ownerUuid = String(data.get('owner_uuid') ?? '').trim();
		const name = String(data.get('name') ?? '').trim();
		const handleCache = String(data.get('handle_cache') ?? '').trim();
		const accountType = String(data.get('account_type') ?? 'standard').trim() as AccountType;

		// Validation
		if (!ownerUuid) return fail(400, { error: 'Owner UUID is required' });
		if (!name) return fail(400, { error: 'Account name is required' });
		if (!handleCache) return fail(400, { error: 'Handle is required' });

		// Validate UUID format (basic check)
		const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
		if (!uuidRegex.test(ownerUuid)) {
			return fail(400, { error: 'Invalid UUID format' });
		}

		try {
			const account = createAccount({
				owner_uuid: ownerUuid,
				name,
				handle_cache: handleCache,
				account_type: accountType,
			});

			logAdminAction({
				action: 'create_account',
				target_uuid: account.uuid,
				target_type: 'account',
				actor_uuid: session.person_uuid,
				memo: `Created ${accountType} account "${name}" for ${handleCache} (acting as ${session.acting_as_uuid})`,
			});

			return { success: true, created: account.uuid };
		} catch (err) {
			return fail(500, { error: String(err) });
		}
	},

	update_metadata: async ({ request, locals }) => {
		const session = locals.session!;
		
		if (!hasAppWideAdmin(session)) {
			return fail(403, { error: 'Access denied: Requires bank:admin permission' });
		}
		
		const data = await request.formData();
		const accountUuid = String(data.get('account_uuid') ?? '').trim();
		const accountType = data.get('account_type') as AccountType | null;

		if (!accountUuid) return fail(400, { error: 'Account UUID is required' });

		try {
			const updates: { account_type?: AccountType } = {};
			if (accountType) updates.account_type = accountType;

			updateAccountMetadata(accountUuid, updates);

			logAdminAction({
				action: 'update_account_metadata',
				target_uuid: accountUuid,
				target_type: 'account',
				actor_uuid: session.person_uuid,
				memo: `Updated account metadata`,
			});

			return { success: true, updated: accountUuid };
		} catch (err) {
			return fail(500, { error: String(err) });
		}
	},
};
