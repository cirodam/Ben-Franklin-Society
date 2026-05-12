import { error, redirect }                          from '@sveltejs/kit';
import { getClassified, updateClassified, withdrawClassified } from '$lib/server/listings.js';
import { CLASSIFIED_CATEGORIES }                   from '$lib/server/categories.js';
import type { Actions, PageServerLoad }             from './$types.js';

export const load: PageServerLoad = async ({ params, locals }) => {
	const listing = getClassified(params.uuid);
	if (!listing) error(404, 'Listing not found.');
	if (listing.seller_uuid !== locals.session!.acting_as_uuid) error(403, 'Not your listing.');
	if (listing.status === 'removed') error(403, 'This listing has been removed.');
	return { listing, categories: CLASSIFIED_CATEGORIES };
};

export const actions: Actions = {
	update: async ({ request, params, locals }) => {
		const listing = getClassified(params.uuid);
		if (!listing || listing.seller_uuid !== locals.session!.acting_as_uuid) error(403);

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
		updateClassified(params.uuid, locals.session!.acting_as_uuid, {
			title, description, category, price, price_negotiable: negotiable, scope, expires_at: expiresAt,
		});
		return { success: true };
	},

	withdraw: async ({ params, locals }) => {
		const listing = getClassified(params.uuid);
		if (!listing || listing.seller_uuid !== locals.session!.acting_as_uuid) error(403);
		withdrawClassified(params.uuid, locals.session!.acting_as_uuid);
		redirect(303, '/my-listings');
	},
};
