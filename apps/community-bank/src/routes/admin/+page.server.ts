import { error, fail } from '@sveltejs/kit';
import type { PageServerLoad, Actions } from './$types.js';
import { searchAccounts } from '$lib/server/admin.js';
import { createAccount } from '$lib/server/accounts.js';
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
	
	const q = url.searchParams.get('q')?.trim() ?? '';
	const accounts = searchAccounts(q);
	return { q, accounts, session };
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
		const demurrageExempt = data.get('demurrage_exempt') === 'true';

		// Validation
		if (!ownerUuid) return fail(400, { error: 'Owner UUID is required' });
		if (!name) return fail(400, { error: 'Account name is required' });

		// Validate UUID format (basic check)
		const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
		if (!uuidRegex.test(ownerUuid)) {
			return fail(400, { error: 'Invalid UUID format' });
		}

		try {
			const account = createAccount({
				owner_uuid: ownerUuid,
				name,
				demurrage_exempt: demurrageExempt
			});

			logAdminAction({
				action: 'create_account',
				target_uuid: account.uuid,
				target_type: 'account',
				actor_uuid: session.person_uuid,
				memo: `Created account "${name}" for owner ${ownerUuid} (acting as ${session.acting_as_uuid})`,
			});

			return { success: true, created: account.uuid };
		} catch (err) {
			return fail(500, { error: String(err) });
		}
	},
};
