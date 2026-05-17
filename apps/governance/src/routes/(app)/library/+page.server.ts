import type { PageServerLoad } from './$types.js';
import { listDocuments, getCorpus, searchLibrary, getLibraryStats } from '$lib/server/library.js';

export const load: PageServerLoad = async ({ url }) => {
	// Get filter parameters from URL
	const typeParam = url.searchParams.get('type');
	const statusParam = url.searchParams.get('status');
	const queryParam = url.searchParams.get('q');

	// Determine which types to show
	const types = typeParam ? typeParam.split(',') : ['governing', 'motion'];

	// Search library items
	const items = searchLibrary({
		type: types,
		status: statusParam || undefined,
		query: queryParam || undefined,
	});

	// Get statistics
	const stats = getLibraryStats();

	// Still get corpus for backward compatibility
	const corpus = getCorpus();
	const documents = listDocuments(); // For legacy filtering in UI

	return {
		items,
		stats,
		corpus,
		documents, // Legacy
		filters: {
			types,
			status: statusParam || 'all',
			query: queryParam || '',
		}
	};
};
