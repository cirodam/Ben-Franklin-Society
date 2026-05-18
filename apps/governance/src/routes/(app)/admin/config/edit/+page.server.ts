import { fail, redirect } from '@sveltejs/kit';
import { getAllCommunityConfig, updateCommunityConfig } from '$lib/server/infrastructure/config.js';
import type { Actions, PageServerLoad } from './$types.js';

export const load: PageServerLoad = async () => {
	const entries = getAllCommunityConfig();
	return { entries };
};

export const actions: Actions = {
	update: async ({ request }) => {
		const fd = await request.formData();
		const entries = getAllCommunityConfig();

		try {
			// Update each config entry
			for (const entry of entries) {
				const value = String(fd.get(entry.key) ?? '').trim();
				if (value && value !== entry.value) {
					updateCommunityConfig(entry.key, value);
				}
			}

			redirect(303, '/config');
		} catch (err: any) {
			return fail(400, { 
				error: err.message || 'Failed to update configuration.'
			});
		}
	}
};
