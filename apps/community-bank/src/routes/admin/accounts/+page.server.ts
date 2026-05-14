import { fail } from '@sveltejs/kit';
import type { PageServerLoad, Actions } from './$types.js';
import { 
	createAccount, 
	searchAccounts, 
	updateAccountMetadata,
	type AccountType 
} from '$lib/server/accounts.js';
import { logAdminAction } from '$lib/server/admin.js';

export const load: PageServerLoad = async ({ url }) => {
	const query = url.searchParams.get('q') || '';
	const accounts = query ? searchAccounts(query) : [];
	
	return {
		accounts,
		query,
	};
};

export const actions: Actions = {
	create: async ({ request, locals }) => {
		const data = await request.formData();
		const principalUuid = String(data.get('principal_uuid') ?? '').trim();
		const name = String(data.get('name') ?? '').trim();
		const handleCache = String(data.get('handle_cache') ?? '').trim();
		const accountType = String(data.get('account_type') ?? 'standard').trim() as AccountType;

		// Validation
		if (!principalUuid) return fail(400, { error: 'Principal UUID is required' });
		if (!name) return fail(400, { error: 'Account name is required' });
		if (!handleCache) return fail(400, { error: 'Handle is required' });

		// Validate UUID format (basic check)
		const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
		if (!uuidRegex.test(principalUuid)) {
			return fail(400, { error: 'Invalid UUID format' });
		}

		try {
			const account = createAccount({
				principal_uuid: principalUuid,
				name,
				handle_cache: handleCache,
				account_type: accountType,
			});

			logAdminAction({
				action: 'create_account',
				target_uuid: account.uuid,
				target_type: 'account',
				actor_uuid: locals.session!.acting_as_uuid,
				memo: `Created ${accountType} account "${name}" for ${handleCache}`,
			});

			return { success: true, created: account.uuid };
		} catch (err) {
			return fail(500, { error: String(err) });
		}
	},

	update_metadata: async ({ request, locals }) => {
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
				actor_uuid: locals.session!.acting_as_uuid,
				memo: `Updated account metadata`,
			});

			return { success: true, updated: accountUuid };
		} catch (err) {
			return fail(500, { error: String(err) });
		}
	},
};
