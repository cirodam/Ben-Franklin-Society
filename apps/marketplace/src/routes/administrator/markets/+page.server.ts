import { redirect }                from '@sveltejs/kit';
import { getAllMarketplaces, createMarketplace } from '$lib/server/physical.js';
import type { Actions, PageServerLoad } from './$types.js';

export const load: PageServerLoad = async () => {
	return { marketplaces: getAllMarketplaces() };
};

export const actions: Actions = {
	create: async ({ request }) => {
		const fd = await request.formData();
		const name             = String(fd.get('name')             ?? '').trim();
		const location         = String(fd.get('location')         ?? '').trim();
		const description      = String(fd.get('description')      ?? '').trim() || null;
		const default_schedule = String(fd.get('default_schedule') ?? '').trim() || null;

		if (!name || !location) return { error: 'Name and location are required.' };

		const uuid = createMarketplace({ name, location, description, default_schedule });
		redirect(303, `/administrator/markets/${uuid}`);
	},
};
