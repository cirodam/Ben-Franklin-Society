import { getMonetaryStatus, getMonetaryOperations } from '$lib/server/monetary.js';
import type { PageServerLoad } from './$types.js';

export const load: PageServerLoad = async () => {
	const status = await getMonetaryStatus();
	const recentOperations = getMonetaryOperations({ limit: 10 });

	return {
		status,
		recentOperations
	};
};
