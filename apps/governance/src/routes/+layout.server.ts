import type { LayoutServerLoad } from './$types.js';
import { getAvailableContexts } from '$lib/server/infrastructure/auth.js';

export const load: LayoutServerLoad = async ({ locals }) => {
	const session = locals.session;
	const person = locals.person;
	
	// Fetch available contexts if user is logged in
	let availableContexts = [];
	if (person) {
		availableContexts = getAvailableContexts(person.uuid);
	}
	
	return {
		session,
		person,
		availableContexts
	};
};
