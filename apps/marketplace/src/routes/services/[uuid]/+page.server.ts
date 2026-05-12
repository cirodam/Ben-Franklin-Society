import { error } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types.js';
import { getService, getListingsByPrincipal } from '$lib/server/listings.js';
import { insertReport } from '$lib/server/moderation.js';

export const load: PageServerLoad = async ({ params, locals }) => {
	const listing = getService(params.uuid);
	if (!listing) error(404, 'Service listing not found.');

	const { classifieds: providerClassifieds, services: providerServices } =
		getListingsByPrincipal(listing.provider_uuid);

	const otherServices    = providerServices.filter((l) => l.uuid !== listing.uuid).slice(0, 5);
	const otherClassifieds = providerClassifieds.slice(0, 5);
	const isOwn = locals.session?.acting_as_uuid === listing.provider_uuid;

	return { listing, otherServices, otherClassifieds, isOwn };
};

export const actions: Actions = {
	report: async ({ request, params, locals }) => {
		const session = locals.session!;
		const listing = getService(params.uuid);
		if (!listing) error(404);
		if (listing.provider_uuid === session.acting_as_uuid) return { reportError: 'You cannot report your own listing.' };
		const fd = await request.formData();
		const reason = String(fd.get('reason') ?? '').trim();
		if (!reason) return { reportError: 'Please provide a reason.' };
		insertReport(params.uuid, 'service', session.acting_as_uuid, reason);
		return { reported: true };
	},
};
