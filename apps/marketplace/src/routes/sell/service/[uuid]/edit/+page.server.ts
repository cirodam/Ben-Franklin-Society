import { error, redirect }                        from '@sveltejs/kit';
import { getService, updateService, withdrawService } from '$lib/server/listings.js';
import { SERVICE_CATEGORIES }                    from '$lib/server/categories.js';
import type { Actions, PageServerLoad }           from './$types.js';

export const load: PageServerLoad = async ({ params, locals }) => {
	const listing = getService(params.uuid);
	if (!listing) error(404, 'Listing not found.');
	if (listing.provider_uuid !== locals.session!.acting_as_uuid) error(403, 'Not your listing.');
	if (listing.status === 'removed') error(403, 'This listing has been removed.');
	return { listing, categories: SERVICE_CATEGORIES };
};

export const actions: Actions = {
	update: async ({ request, params, locals }) => {
		const listing = getService(params.uuid);
		if (!listing || listing.provider_uuid !== locals.session!.acting_as_uuid) error(403);

		const fd = await request.formData();
		const title       = String(fd.get('title')       ?? '').trim();
		const description = String(fd.get('description') ?? '').trim();
		const category    = String(fd.get('category')    ?? '').trim();
		const rateRaw     = String(fd.get('rate')        ?? '0').trim();
		const rate_unit   = String(fd.get('rate_unit')   ?? 'negotiable') as 'per_hour' | 'per_job' | 'negotiable';
		const service_area = String(fd.get('service_area') ?? '').trim() || null;
		const scope       = String(fd.get('scope')       ?? 'local') as 'local' | 'federated';

		if (!title || !description || !category) {
			return { error: 'Title, description, and category are required.' };
		}

		const rate = Math.round(parseFloat(rateRaw) || 0);
		updateService(params.uuid, locals.session!.acting_as_uuid, {
			title, description, category, rate, rate_unit, service_area, scope,
		});
		return { success: true };
	},

	withdraw: async ({ params, locals }) => {
		const listing = getService(params.uuid);
		if (!listing || listing.provider_uuid !== locals.session!.acting_as_uuid) error(403);
		withdrawService(params.uuid, locals.session!.acting_as_uuid);
		redirect(303, '/my-listings');
	},
};
