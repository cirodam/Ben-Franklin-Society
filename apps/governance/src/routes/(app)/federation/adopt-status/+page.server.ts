import type { PageServerLoad, Actions } from './$types.js';
import { error, redirect } from '@sveltejs/kit';
import { checkAdoptionStatus, completeAdoption } from '$lib/server/federation/lineage/adoption.js';

export const load: PageServerLoad = async ({ url }) => {
	const request_id = url.searchParams.get('request_id');
	const parent_url = url.searchParams.get('parent_url');

	if (!request_id || !parent_url) {
		throw error(400, 'request_id and parent_url are required');
	}

	// Check status with parent
	const result = await checkAdoptionStatus({
		request_id,
		parent_url
	});

	return {
		request_id,
		parent_url,
		status: result.status,
		founding_record: result.founding_record || null,
		response_message: result.response_message || null,
		error: result.error || null
	};
};

export const actions: Actions = {
	complete: async ({ url }) => {
		const request_id = url.searchParams.get('request_id');
		const parent_url = url.searchParams.get('parent_url');

		if (!request_id || !parent_url) {
			return { success: false, error: 'request_id and parent_url are required' };
		}

		// Fetch the founding record from parent
		const statusResult = await checkAdoptionStatus({
			request_id,
			parent_url
		});

		if (statusResult.status !== 'approved' || !statusResult.founding_record) {
			return { success: false, error: 'Adoption not approved or founding record not available' };
		}

		// Complete adoption on our side
		const result = completeAdoption({
			founding_record: statusResult.founding_record
		});

		if (!result.success) {
			return { success: false, error: result.error };
		}

		// Redirect to federation page to see new parent
		throw redirect(303, '/federation');
	}
};
