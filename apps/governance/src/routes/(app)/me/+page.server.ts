import { redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import { getPersonByUuid } from '$lib/server/organization/people.js';
import { getHouseholdsByPerson, getHouseholdMembers, getDependentsByHousehold } from '$lib/server/organization/households.js';
import { getPersonSkills, getPersonTools } from '$lib/server/organization/emergency-registry.js';

export const load: PageServerLoad = async ({ locals }) => {
	const session = locals.session;
	if (!session) {
		throw redirect(302, '/login');
	}

	const person = getPersonByUuid(session.person_uuid);
	if (!person) {
		throw redirect(302, '/login');
	}

	// Get households this person is a member of
	const households = getHouseholdsByPerson(person.uuid);
	
	// For each household, get members and dependents
	const householdDetails = households.map(household => {
		const members = getHouseholdMembers(household.uuid);
		const dependents = getDependentsByHousehold(household.uuid);
		
		return {
			household,
			members,
			dependents
		};
	});

	// Get emergency registry data
	const emergencySkills = getPersonSkills(person.uuid);
	const emergencyTools = getPersonTools(person.uuid);

	return {
		person,
		households: householdDetails,
		emergencySkills,
		emergencyTools
	};
};
