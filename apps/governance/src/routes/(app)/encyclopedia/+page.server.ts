import { getAllArticles, getCategories } from '$lib/server/encyclopedia/articles.js';
import type { PageServerLoad } from './$types.js';

export const load: PageServerLoad = async () => {
	const articles = getAllArticles();
	const categories = getCategories();

	return {
		articles,
		categories
	};
};
