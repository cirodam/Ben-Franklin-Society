import { error, redirect }         from '@sveltejs/kit';
import { isSellerSuspended, createClassified } from '$lib/server/listings.js';
import { CLASSIFIED_CATEGORIES }   from '$lib/server/categories.js';
import type { Actions, PageServerLoad } from './$types.js';

export const load: PageServerLoad = async ({ locals }) => {
	const session = locals.session!;
	const suspended = isSellerSuspended(session.acting_as_uuid);
	return { suspended, categories: CLASSIFIED_CATEGORIES };
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
		const priceRaw    = String(fd.get('price')       ?? '0').trim();
		const negotiable  = fd.get('price_negotiable') === '1';
		const scope       = String(fd.get('scope')       ?? 'local') as 'local' | 'federated';
		const expiresAt   = String(fd.get('expires_at')  ?? '').trim() || null;

		if (!title || !description || !category) {
			return { error: 'Title, description, and category are required.' };
		}

		const price = Math.round(parseFloat(priceRaw) || 0);

		const uuid = createClassified({
			seller_uuid:           session.acting_as_uuid,
			seller_handle_cache:   session.handle,
			seller_society_handle: session.handle,
			title,
			description,
			category,
			price,
			price_negotiable: negotiable,
			scope,
			expires_at: expiresAt,
		});

		redirect(303, `/classifieds/${uuid}`);
	},
};
