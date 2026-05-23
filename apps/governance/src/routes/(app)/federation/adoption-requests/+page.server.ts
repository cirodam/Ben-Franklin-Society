import type { PageServerLoad, Actions } from './$types.js';
import { getAllAdoptionRequests, approveAdoption, rejectAdoption } from '$lib/server/federation/lineage/adoption.js';
import { getIdentity } from '$lib/server/federation/lineage/identity.js';
import { fail } from '@sveltejs/kit';

export const load: PageServerLoad = async () => {
	const identity = getIdentity();
	const requests = getAllAdoptionRequests();

	return {
		identity: identity
			? {
					handle: identity.handle,
					uuid: identity.uuid
			  }
			: null,
		requests: requests.map((r) => ({
			request_id: r.request_id,
			child_handle: r.child_handle,
			child_uuid: r.child_uuid,
			message: r.message,
			status: r.status,
			requested_at: r.requested_at,
			responded_at: r.responded_at,
			response_message: r.response_message,
			child_bfs_url: r.child_bfs_url,
			child_endpoint: r.child_endpoint
		}))
	};
};

export const actions: Actions = {
	approve: async ({ request }) => {
		const data = await request.formData();
		const request_id = data.get('request_id') as string;
		const response_message = data.get('response_message') as string;

		if (!request_id) {
			return fail(400, { error: 'request_id is required' });
		}

		const result = await approveAdoption({
			request_id,
			response_message: response_message || undefined
		});

		if (!result.success) {
			return fail(400, { error: result.error });
		}

		return { success: true, action: 'approve' };
	},

	reject: async ({ request }) => {
		const data = await request.formData();
		const request_id = data.get('request_id') as string;
		const response_message = data.get('response_message') as string;

		if (!request_id) {
			return fail(400, { error: 'request_id is required' });
		}

		const result = rejectAdoption({
			request_id,
			response_message: response_message || undefined
		});

		if (!result.success) {
			return fail(400, { error: result.error });
		}

		return { success: true, action: 'reject' };
	}
};
