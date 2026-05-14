import { error, fail, redirect } from '@sveltejs/kit';
import { getAssociationByUuid, updateAssociation, getSortitionConfig, setSortitionConfig, listAssociations } from '$lib/server/associations.js';
import type { Actions, PageServerLoad } from './$types.js';

export const load: PageServerLoad = async ({ params }) => {
	const association = getAssociationByUuid(params.uuid);
	if (!association) {
		error(404, 'Committee not found');
	}
	if (association.type !== 'committee') {
		error(400, 'Not a committee');
	}

	const sortitionConfig = getSortitionConfig(params.uuid);
	const colleges = listAssociations({ type: 'college' }).filter(c => c.status === 'active');

	return { association, sortitionConfig, colleges };
};

export const actions: Actions = {
	update: async ({ params, request }) => {
		const association = getAssociationByUuid(params.uuid);
		if (!association || association.type !== 'committee') {
			error(404, 'Committee not found');
		}

		const fd = await request.formData();
		const name = String(fd.get('name') ?? '').trim();
		const governingDocumentSlug = String(fd.get('governing_document_slug') ?? '').trim() || null;
		const status = String(fd.get('status') ?? 'active') as 'active' | 'inactive' | 'dissolved';

		// Sortition configuration
		const enableSortition = fd.get('enable_sortition') === 'on';
		const seatCount = Number(fd.get('seat_count') ?? 5);
		const termDays = Number(fd.get('term_days') ?? 180);
		const sourceCollegeUuid = String(fd.get('source_college_uuid') ?? '').trim() || undefined;

		if (!name) {
			return fail(400, { 
				error: 'Name is required.',
				name, governingDocumentSlug, status, enableSortition, seatCount, termDays, sourceCollegeUuid
			});
		}

		if (enableSortition && (!seatCount || seatCount < 1)) {
			return fail(400, {
				error: 'Seat count must be at least 1 when sortition is enabled.',
				name, governingDocumentSlug, status, enableSortition, seatCount, termDays, sourceCollegeUuid
			});
		}

		if (enableSortition && (!termDays || termDays < 1)) {
			return fail(400, {
				error: 'Term length must be at least 1 day when sortition is enabled.',
				name, governingDocumentSlug, status, enableSortition, seatCount, termDays, sourceCollegeUuid
			});
		}

		try {
			updateAssociation(params.uuid, {
				name,
				governing_document_slug: governingDocumentSlug,
				status
			});

			// Update sortition configuration
			if (enableSortition) {
				setSortitionConfig({
					association_uuid: params.uuid,
					seat_count: seatCount,
					term_days: termDays,
					source_college_uuid: sourceCollegeUuid
				});
			}

			redirect(303, `/committees/${params.uuid}`);
		} catch (err: any) {
			return fail(400, { 
				error: err.message || 'Failed to update committee.',
				name, governingDocumentSlug, status, enableSortition, seatCount, termDays, sourceCollegeUuid
			});
		}
	}
};
