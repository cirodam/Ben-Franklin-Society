import { error } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types.js';
import { getClassified, getListingsByPrincipal } from '$lib/server/listings.js';
import { insertReport } from '$lib/server/moderation.js';

export const load: PageServerLoad = async ({ params, locals }) => {
	const listing = getClassified(params.uuid);
	if (!listing) error(404, 'Listing not found.');

	// Seller's other active listings (exclude this one)
	const { classifieds: sellerClassifieds, services: sellerServices } =
		getListingsByPrincipal(listing.seller_uuid);

	const otherClassifieds = sellerClassifieds.filter((l) => l.uuid !== listing.uuid).slice(0, 5);
	const isOwn = locals.session?.acting_as_uuid === listing.seller_uuid;

	return { listing, otherClassifieds, sellerServices: sellerServices.slice(0, 5), isOwn };
};

export const actions: Actions = {
	report: async ({ request, params, locals }) => {
		const session = locals.session!;
		const listing = getClassified(params.uuid);
		if (!listing) error(404);
		if (listing.seller_uuid === session.acting_as_uuid) return { reportError: 'You cannot report your own listing.' };
		const fd = await request.formData();
		const reason = String(fd.get('reason') ?? '').trim();
		if (!reason) return { reportError: 'Please provide a reason.' };
		insertReport(params.uuid, 'classified', session.acting_as_uuid, reason);
		return { reported: true };
	},
};
