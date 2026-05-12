import type { PageServerLoad } from './$types.js';
import { getClassifieds } from '$lib/server/listings.js';
import { CLASSIFIED_CATEGORIES } from '$lib/server/categories.js';

export const load: PageServerLoad = async ({ url }) => {
	const category   = url.searchParams.get('category')   ?? undefined;
	const keyword    = url.searchParams.get('keyword')    ?? undefined;
	const minPrice   = url.searchParams.get('minPrice')   ? Number(url.searchParams.get('minPrice'))   : undefined;
	const maxPrice   = url.searchParams.get('maxPrice')   ? Number(url.searchParams.get('maxPrice'))   : undefined;
	const negotiable = url.searchParams.get('negotiable') === '1' ? true : undefined;
	const scope      = (url.searchParams.get('scope') as 'local' | 'federated' | null) ?? undefined;
	const page       = Number(url.searchParams.get('page') ?? '1');

	const { listings, total } = getClassifieds({ category, keyword, minPrice, maxPrice, negotiable, scope, page });

	return { listings, total, categories: CLASSIFIED_CATEGORIES, filters: { category, keyword, minPrice, maxPrice, negotiable: negotiable ?? false, scope, page } };
};
