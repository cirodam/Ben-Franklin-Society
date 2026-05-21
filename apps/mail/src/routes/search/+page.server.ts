import { error } from '@sveltejs/kit';
import type { PageServerLoad } from './$types.js';
import { searchMessages, countSearchResults, type SearchFilters } from '$lib/server/search.js';

export const load: PageServerLoad = async ({ locals, url }) => {
	const session = locals.session;
	if (!session) {
		error(401, 'Not authenticated');
	}

	const query = url.searchParams.get('q') || '';
	const page = parseInt(url.searchParams.get('page') || '0', 10);
	const sender = url.searchParams.get('sender') || undefined;
	const from_date = url.searchParams.get('from') || undefined;
	const to_date = url.searchParams.get('to') || undefined;
	const sent_only = url.searchParams.get('sent') === 'true';
	const received_only = url.searchParams.get('received') === 'true';

	if (!query || query.trim().length === 0) {
		return {
			query: '',
			results: [],
			total: 0,
			page: 0,
			hasMore: false,
			filters: {}
		};
	}

	const filters: SearchFilters = {
		sender,
		from_date,
		to_date,
		sent_only,
		received_only
	};

	const PAGE_SIZE = 25;
	const offset = page * PAGE_SIZE;

	const results = searchMessages(
		session.principal_uuid,
		query,
		filters,
		{ limit: PAGE_SIZE + 1, offset }
	);

	const hasMore = results.length > PAGE_SIZE;
	if (hasMore) {
		results.pop(); // Remove extra item used for hasMore check
	}

	const total = countSearchResults(session.principal_uuid, query, filters);

	return {
		query,
		results,
		total,
		page,
		hasMore,
		filters
	};
};
