import type { PageServerLoad } from './$types.js';
import { listMotions } from '$lib/server/motions.js';
import { getAssociationByUuid } from '$lib/server/associations.js';

export const load: PageServerLoad = async ({ locals }) => {
	const personUuid = locals.person.uuid;
	
	// Get all motions introduced by this person
	const allMotions = listMotions();
	const myMotions = allMotions.filter(m => m.introduced_by_uuid === personUuid);
	
	// Enrich with body name
	const enrichedMotions = myMotions.map(motion => {
		const body = getAssociationByUuid(motion.body_uuid);
		return {
			...motion,
			body_name: body?.name || 'Unknown Body'
		};
	});
	
	return {
		motions: enrichedMotions
	};
};
