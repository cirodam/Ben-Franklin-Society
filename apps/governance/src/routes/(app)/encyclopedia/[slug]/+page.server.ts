import { error } from '@sveltejs/kit';
import { getArticle } from '$lib/server/encyclopedia/articles.js';
import type { PageServerLoad } from './$types.js';

export const load: PageServerLoad = async ({ params }) => {
	const article = getArticle(params.slug);

	if (!article) {
		error(404, 'Article not found');
	}

	return { article };
};
