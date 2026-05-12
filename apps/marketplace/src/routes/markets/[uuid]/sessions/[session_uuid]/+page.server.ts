import { error }                                       from '@sveltejs/kit';
import { getMarketplace, getSession, getStallsWithAssignments } from '$lib/server/physical.js';
import type { PageServerLoad }                          from './$types.js';

export const load: PageServerLoad = async ({ params }) => {
	const marketplace = getMarketplace(params.uuid);
	if (!marketplace) error(404, 'Marketplace not found.');
	const session = getSession(params.session_uuid);
	if (!session || session.marketplace_uuid !== params.uuid) error(404, 'Session not found.');
	const stalls = getStallsWithAssignments(params.uuid, params.session_uuid);
	return { marketplace, session, stalls };
};
