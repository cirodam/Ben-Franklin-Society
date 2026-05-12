import type { PageServerLoad } from './$types.js';
import { getMyClassifieds, getMyServices } from '$lib/server/listings.js';

export const load: PageServerLoad = async ({ locals }) => {
	const session = locals.session!;
	const classifieds = getMyClassifieds(session.acting_as_uuid);
	const services    = getMyServices(session.acting_as_uuid);
	return { classifieds, services };
};
