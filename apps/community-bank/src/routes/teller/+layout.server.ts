import { error } from '@sveltejs/kit';
import type { LayoutServerLoad } from './$types.js';
import { getOidcClient } from '$lib/server/oidc.js';
import { PERMISSIONS } from '$lib/server/permissions.js';

export const load: LayoutServerLoad = async ({ locals }) => {
	const session = locals.session!;
	if (!getOidcClient().hasPermission(session, 'community-bank', PERMISSIONS.TELLER)) {
		error(403, 'Teller access required.');
	}
	return {};
};
