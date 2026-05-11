import { error } from '@sveltejs/kit';
import type { PageServerLoad } from './$types.js';
import { getAssociationByHandle } from '$lib/server/associations.js';
import { getCurrentMembers } from '$lib/server/associations.js';

export const load: PageServerLoad = async () => {
	const association = getAssociationByHandle('general-assembly');
	if (!association) error(404, 'General Assembly not found');
	const members = getCurrentMembers(association.uuid);
	return { association, members };
};
