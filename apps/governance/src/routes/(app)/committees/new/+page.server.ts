import { fail, redirect } from '@sveltejs/kit';
import { createAssociation, getAssociationByHandle, setSortitionConfig, listAssociations } from '$lib/server/associations.js';
import type { Actions, PageServerLoad } from './$types.js';

export const load: PageServerLoad = async () => {
	// Get list of colleges for sortition source selection
	const colleges = listAssociations({ type: 'college' }).filter(c => c.status === 'active');
	return { colleges };
};

export const actions: Actions = {
	create: async ({ request }) => {
		const fd = await request.formData();
		const handle = String(fd.get('handle') ?? '').trim().toLowerCase();
		const name = String(fd.get('name') ?? '').trim();
		const abbreviation = String(fd.get('abbreviation') ?? '').trim().toUpperCase() || undefined;
		const governingDocumentSlug = String(fd.get('governing_document_slug') ?? '').trim() || undefined;
		const establishedByMotionUuid = String(fd.get('established_by_motion_uuid') ?? '').trim() || undefined;
		
		// Sortition configuration
		const enableSortition = fd.get('enable_sortition') === 'on';
		const seatCount = Number(fd.get('seat_count') ?? 5);
		const termDays = Number(fd.get('term_days') ?? 180);
		const sourceCollegeUuid = String(fd.get('source_college_uuid') ?? '').trim() || undefined;

		// Validation
		if (!handle || !name) {
			return fail(400, { 
				error: 'Handle and name are required.',
				handle, name, governingDocumentSlug, enableSortition, seatCount, termDays, sourceCollegeUuid
			});
		}

		if (!/^[a-z0-9_-]{2,64}$/.test(handle)) {
			return fail(400, { 
				error: 'Handle must be 2-64 lowercase letters, numbers, hyphens, or underscores.',
				handle, name, governingDocumentSlug, enableSortition, seatCount, termDays, sourceCollegeUuid
			});
		}

		if (enableSortition && (!seatCount || seatCount < 1)) {
			return fail(400, {
				error: 'Seat count must be at least 1 when sortition is enabled.',
				handle, name, governingDocumentSlug, enableSortition, seatCount, termDays, sourceCollegeUuid
			});
		}

		if (enableSortition && (!termDays || termDays < 1)) {
			return fail(400, {
				error: 'Term length must be at least 1 day when sortition is enabled.',
				handle, name, governingDocumentSlug, enableSortition, seatCount, termDays, sourceCollegeUuid
			});
		}

		// Check if handle is already taken
		if (getAssociationByHandle(handle)) {
			return fail(400, {
				error: 'An association with this handle already exists.',
				handle, name, governingDocumentSlug, enableSortition, seatCount, termDays, sourceCollegeUuid
			});
		}

		try {
			const committee = createAssociation({
				handle,
				name,
				abbreviation,
				type: 'committee',
				governing_document_slug: governingDocumentSlug,
				established_by_motion_uuid: establishedByMotionUuid
			});

			// Configure sortition if enabled
			if (enableSortition) {
				setSortitionConfig({
					association_uuid: committee.uuid,
					seat_count: seatCount,
					term_days: termDays,
					source_college_uuid: sourceCollegeUuid
				});
			}

			redirect(303, `/committees/${committee.uuid}`);
		} catch (err: any) {
			return fail(400, { 
				error: err.message || 'Failed to create committee.',
				handle, name, governingDocumentSlug, enableSortition, seatCount, termDays, sourceCollegeUuid
			});
		}
	}
};
