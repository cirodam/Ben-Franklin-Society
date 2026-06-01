import { redirect } from '@sveltejs/kit';
import type { LayoutServerLoad } from './$types.js';
import { getAvailableContexts } from '$lib/server/infrastructure/auth.js';
import { getCommunityConfig } from '$lib/server/infrastructure/config.js';

export const load: LayoutServerLoad = async ({ locals }) => {
	if (!locals.session || !locals.person) {
		redirect(302, '/login');
	}
	
	// Get available contexts for the person
	const availableContexts = getAvailableContexts(locals.person.uuid);
	
	// Get society location for sidebar
	const societyLocation = getCommunityConfig('society_location') ?? 'The Working Society';
	
	return {
		person: locals.person,
		sessionUuid: locals.session.uuid,
		actingAsUuid: locals.session.acting_as_uuid,
		availableContexts,
		societyLocation,
	};
};
