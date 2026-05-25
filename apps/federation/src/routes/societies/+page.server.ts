import type { PageServerLoad } from './$types';
import { getAllSocieties } from '$lib/server/queries.js';

export const load: PageServerLoad = async ({ url }) => {
	const page = parseInt(url.searchParams.get('page') || '1');
	const limit = 50;

	const { societies, total } = getAllSocieties({ page, limit });

	return {
		societies,
		total,
		page,
		limit,
		totalPages: Math.ceil(total / limit)
	};
};
