import type { PageServerLoad } from './$types.js';
import { getAllGoverningDocs } from '$lib/server/documents/society-governing.js';

export const load: PageServerLoad = async ({ url, locals }) => {
	const viewParam = url.searchParams.get('view') || 'enacted';

	// Load governing documents from each status folder
	const enacted = getAllGoverningDocs('enacted');
	const underConsideration = getAllGoverningDocs('inbox');
	const repealed = getAllGoverningDocs('repealed');
	const sunsetted = getAllGoverningDocs('sunsetted');
	const archived = [...repealed, ...sunsetted];

	return {
		enacted,
		underConsideration,
		archived,
		currentView: viewParam,
		person: locals.person
	};
};
