import { error } from '@sveltejs/kit';
import type { PageServerLoad } from './$types.js';
import { getAssociationByHandle, getCurrentMembers } from '$lib/server/organization/associations.js';

export const load: PageServerLoad = async () => {
	const association = getAssociationByHandle('social-insurance');
	if (!association) error(404, 'Social Insurance Fund not found');
	const members = getCurrentMembers(association.uuid);
	return { association, members };
};
