import { error, redirect }                      from '@sveltejs/kit';
import { getReport, dismissReport, removeListing, suspendSeller } from '$lib/server/moderation.js';
import { getClassified, getService }             from '$lib/server/listings.js';
import type { Actions, PageServerLoad }          from './$types.js';

export const load: PageServerLoad = async ({ params }) => {
	const report = getReport(params.uuid);
	if (!report) error(404, 'Report not found.');

	// Load full listing for context
	const listing =
		report.listing_type === 'classified'
			? getClassified(report.listing_uuid)
			: getService(report.listing_uuid);

	return { report, listing };
};

export const actions: Actions = {
	dismiss: async ({ request, params, locals }) => {
		const fd     = await request.formData();
		const reason = String(fd.get('reason') ?? '').trim();
		if (!reason) return { error: 'Reason is required.', action: 'dismiss' };
		dismissReport(params.uuid, locals.session!.person_uuid, reason);
		redirect(303, '/administrator');
	},

	remove_listing: async ({ request, params, locals }) => {
		const report = getReport(params.uuid);
		if (!report) error(404);
		const fd     = await request.formData();
		const reason = String(fd.get('reason') ?? '').trim();
		if (!reason) return { error: 'Reason is required.', action: 'remove_listing' };
		removeListing(report.listing_uuid, report.listing_type, locals.session!.person_uuid, reason, params.uuid);
		redirect(303, '/administrator');
	},

	suspend_seller: async ({ request, params, locals }) => {
		const report = getReport(params.uuid);
		if (!report) error(404);
		const fd     = await request.formData();
		const reason = String(fd.get('reason') ?? '').trim();
		if (!reason) return { error: 'Reason is required.', action: 'suspend_seller' };
		suspendSeller(report.seller_uuid, locals.session!.person_uuid, reason, params.uuid);
		redirect(303, '/administrator');
	},
};
