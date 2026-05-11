import { error } from '@sveltejs/kit';
import type { PageServerLoad } from './$types.js';
import { getAssociationByHandle, getCurrentMembers } from '$lib/server/associations.js';

export const load: PageServerLoad = async () => {
	const association = getAssociationByHandle('central-bank');
	if (!association) error(404, 'Central Bank not found');
	const members = getCurrentMembers(association.uuid);
	return { association, members };
};
