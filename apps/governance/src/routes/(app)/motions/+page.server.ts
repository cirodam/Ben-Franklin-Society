import type { PageServerLoad } from './$types.js';
import { listMotions } from '$lib/server/motions.js';

export const load: PageServerLoad = async () => {
	return { motions: listMotions() };
};
