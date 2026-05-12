import { error, redirect }       from '@sveltejs/kit';
import { isSellerSuspended, createService } from '$lib/server/listings.js';
import { SERVICE_CATEGORIES }    from '$lib/server/categories.js';
import type { Actions, PageServerLoad } from './$types.js';

export const load: PageServerLoad = async ({ locals }) => {
	const session = locals.session!;
	const suspended = isSellerSuspended(session.acting_as_uuid);
	return { suspended, categories: SERVICE_CATEGORIES };
};

export const actions: Actions = {
	create: async ({ request, locals }) => {
		const session = locals.session!;
		if (isSellerSuspended(session.acting_as_uuid)) {
			return { error: 'Your account is suspended.' };
		}

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

		const uuid = createService({
			provider_uuid:           session.acting_as_uuid,
			provider_handle_cache:   session.handle,
			provider_society_handle: session.handle,
			title,
			description,
			category,
			rate,
			rate_unit,
			service_area,
			scope,
		});

		redirect(303, `/services/${uuid}`);
	},
};
