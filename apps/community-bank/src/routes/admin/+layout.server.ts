import { error } from '@sveltejs/kit';
import type { LayoutServerLoad } from './$types.js';
import { oidcClient } from '$lib/server/oidc.js';
import { PERMISSIONS } from '$lib/server/permissions.js';

export const load: LayoutServerLoad = async ({ locals }) => {
	const session = locals.session!;
	if (!oidcClient.hasPermission(session, 'community-bank', PERMISSIONS.ADMIN)) {
		error(403, 'Admin access required.');
	}
	return {};
};
