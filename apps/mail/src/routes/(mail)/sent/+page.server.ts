import type { PageServerLoad } from './$types.js';
import { getSent } from '$lib/server/messages/queries.js';

const PAGE_SIZE = 25;

export const load: PageServerLoad = async ({ locals, url }) => {
	const session = locals.session!;
	const page    = Math.max(0, parseInt(url.searchParams.get('page') ?? '0', 10));

	const messages = getSent(session.acting_as_uuid, {
		limit:  PAGE_SIZE + 1,
		offset: page * PAGE_SIZE,
	});

	const hasMore = messages.length > PAGE_SIZE;
	if (hasMore) messages.pop();

	return { messages, page, hasMore };
};
