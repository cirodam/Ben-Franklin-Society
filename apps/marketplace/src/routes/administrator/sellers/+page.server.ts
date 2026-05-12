import { getAllSellers, suspendSeller, reinstateSeller } from '$lib/server/moderation.js';
import type { Actions, PageServerLoad } from './$types.js';

export const load: PageServerLoad = async ({ url }) => {
	const q = url.searchParams.get('q')?.trim() || undefined;
	return { sellers: getAllSellers({ q }), q: q ?? '' };
};

export const actions: Actions = {
	suspend: async ({ request, locals }) => {
		const fd           = await request.formData();
		const principal_uuid = String(fd.get('principal_uuid') ?? '').trim();
		const reason       = String(fd.get('reason')       ?? '').trim();
		if (!principal_uuid || !reason) return { error: 'Reason is required.' };
		suspendSeller(principal_uuid, locals.session!.person_uuid, reason);
		return { success: true };
	},

	reinstate: async ({ request, locals }) => {
		const fd           = await request.formData();
		const principal_uuid = String(fd.get('principal_uuid') ?? '').trim();
		const reason       = String(fd.get('reason')       ?? '').trim();
		if (!principal_uuid || !reason) return { error: 'Reason is required.' };
		reinstateSeller(principal_uuid, locals.session!.person_uuid, reason);
		return { success: true };
	},
};
