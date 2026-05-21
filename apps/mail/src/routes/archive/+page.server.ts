import { error } from '@sveltejs/kit';
import type { PageServerLoad, Actions } from './$types.js';
import { getArchived, unarchiveThread } from '$lib/server/messages.js';

export const load: PageServerLoad = async ({ locals, url }) => {
	const session = locals.session;
	if (!session) {
		error(401, 'Not authenticated');
	}

	const page = parseInt(url.searchParams.get('page') || '0', 10);
	const PAGE_SIZE = 25;

	const threadsWithExtra = getArchived(session.principal_uuid, {
		limit: PAGE_SIZE + 1,
		offset: page * PAGE_SIZE
	});

	const hasMore = threadsWithExtra.length > PAGE_SIZE;
	const threads = hasMore ? threadsWithExtra.slice(0, PAGE_SIZE) : threadsWithExtra;

	return {
		threads,
		page,
		hasMore
	};
};

export const actions: Actions = {
	unarchive: async ({ locals, request }) => {
		const session = locals.session;
		if (!session) {
			error(401, 'Not authenticated');
		}

		const data = await request.formData();
		const thread_id = data.get('thread_id') as string;

		if (!thread_id) {
			return { error: 'Thread ID required' };
		}

		unarchiveThread(thread_id, session.principal_uuid);
		return { success: true };
	}
};
