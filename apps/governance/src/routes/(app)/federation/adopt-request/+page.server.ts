import type { PageServerLoad, Actions } from './$types.js';
import { getIdentity } from '$lib/server/federation/lineage/identity.js';
import { requestAdoption } from '$lib/server/federation/lineage/adoption.js';
import { fail, redirect } from '@sveltejs/kit';

export const load: PageServerLoad = async () => {
	const identity = getIdentity();

	if (!identity) {
		return {
			canRequest: false,
			reason: 'Society identity not initialized'
		};
	}

	if (identity.parent_uuid) {
		return {
			canRequest: false,
			reason: 'Already have a parent society'
		};
	}

	return {
		canRequest: true,
		identity: {
			handle: identity.handle,
			uuid: identity.uuid
		}
	};
};

export const actions: Actions = {
	default: async ({ request }) => {
		const data = await request.formData();
		const parentUrl = data.get('parent_url') as string;
		const message = data.get('message') as string;

		if (!parentUrl) {
			return fail(400, { error: 'Parent URL is required' });
		}

		const result = await requestAdoption({
			parentUrl,
			message: message || undefined
		});

		if (!result.success) {
			return fail(400, { error: result.error });
		}

		return redirect(303, '/federation/adopt-status?request_id=' + result.request_id);
	}
};
