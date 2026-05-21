import { redirect } from '@sveltejs/kit';
import type { LayoutServerLoad } from './$types.js';
import { getAvailableContexts } from '$lib/server/infrastructure/auth.js';

export const load: LayoutServerLoad = async ({ locals }) => {
	if (!locals.session || !locals.person) {
		redirect(302, '/login');
	}
	
	// Get available contexts for the person
	const availableContexts = getAvailableContexts(locals.person.uuid);
	
	return {
		person: locals.person,
		sessionUuid: locals.session.uuid,
		actingAsUuid: locals.session.acting_as_uuid,
		availableContexts,
	};
};
