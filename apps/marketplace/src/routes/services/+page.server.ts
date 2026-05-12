import type { PageServerLoad } from './$types.js';
import { getServices } from '$lib/server/listings.js';
import { SERVICE_CATEGORIES } from '$lib/server/categories.js';

export const load: PageServerLoad = async ({ url }) => {
	const category = url.searchParams.get('category') ?? undefined;
	const keyword  = url.searchParams.get('keyword')  ?? undefined;
	const scope    = (url.searchParams.get('scope') as 'local' | 'federated' | null) ?? undefined;
	const page     = Number(url.searchParams.get('page') ?? '1');

	const { listings, total } = getServices({ category, keyword, scope, page });

	return { listings, total, categories: SERVICE_CATEGORIES, filters: { category, keyword, scope, page } };
};
