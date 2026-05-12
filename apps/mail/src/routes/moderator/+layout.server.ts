import { error } from '@sveltejs/kit';
import type { LayoutServerLoad } from './$types.js';
import { oidcClient } from '$lib/server/oidc.js';
import { PERMISSIONS } from '$lib/server/permissions.js';

export const load: LayoutServerLoad = async ({ locals }) => {
	const session = locals.session!; // outer layout already ensured session exists
	if (!oidcClient.hasPermission(session, 'mail', PERMISSIONS.MODERATOR)) {
		error(403, 'Access denied.');
	}
	return {};
};
