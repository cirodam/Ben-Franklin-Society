import { error } from '@sveltejs/kit';
import { getOidcClient } from '$lib/server/oidc.js';
import { PERMISSIONS } from '$lib/server/permissions.js';
import type { LayoutServerLoad } from './$types.js';

export const load: LayoutServerLoad = async ({ locals }) => {
	const session = locals.session!;
	if (!getOidcClient().hasPermission(session, 'marketplace', PERMISSIONS.ADMINISTRATOR)) {
		error(403, 'Administrator access required.');
	}
	return {};
};
