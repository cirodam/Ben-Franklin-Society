import { error } from '@sveltejs/kit';
import type { LayoutServerLoad } from './$types.js';
import { getOidcClient } from '$lib/server/auth/oidc.js';
import { PERMISSIONS } from '$lib/server/auth/permissions.js';

export const load: LayoutServerLoad = async ({ locals }) => {
	const session = locals.session!;
	if (!getOidcClient().hasPermission(session, 'bank', PERMISSIONS.ADMIN)) {
		error(403, 'Admin access required.');
	}
	return {};
};
