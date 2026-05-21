import type { PageServerLoad } from './$types.js';
import { getInbox } from '$lib/server/messages/queries.js';

const PAGE_SIZE = 25;

export const load: PageServerLoad = async ({ locals, url }) => {
	const session = locals.session;

	// If no session, parent layout will redirect to login
	if (!session) {
		return { threads: [], page: 0, hasMore: false };
	}

	const page    = Math.max(0, parseInt(url.searchParams.get('page') ?? '0', 10));

	const threads = getInbox(session.acting_as_uuid, {
		limit:  PAGE_SIZE + 1,
		offset: page * PAGE_SIZE,
	});

	const hasMore = threads.length > PAGE_SIZE;
	if (hasMore) threads.pop();

	return { threads, page, hasMore };
};
