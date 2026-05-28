import type { LayoutServerLoad } from './$types';

export const load: LayoutServerLoad = async ({ locals }) => {
	return {
		user: locals.user
			? {
					uuid: locals.user.uuid,
					username: locals.user.username,
					displayName: locals.user.displayName
			  }
			: null
	};
};
