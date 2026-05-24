import { fail, redirect } from '@sveltejs/kit';
import { createAssociation, getAssociationByHandle } from '$lib/server/organization/associations.js';
import { listEnactedMotions } from '$lib/server/governance/motion/index.js';
import type { Actions, PageServerLoad } from './$types.js';

export const load: PageServerLoad = async () => {
	const enactedMotions = listEnactedMotions();
	return { enactedMotions };
};

export const actions: Actions = {
	create: async ({ request }) => {
		const fd = await request.formData();
		const handle = String(fd.get('handle') ?? '').trim().toLowerCase();
		const name = String(fd.get('name') ?? '').trim();
		const abbreviation = String(fd.get('abbreviation') ?? '').trim().toUpperCase() || undefined;
		const governingDocumentSlug = String(fd.get('governing_document_slug') ?? '').trim() || undefined;
		const establishedByMotionUuid = String(fd.get('established_by_motion_uuid') ?? '').trim() || undefined;

		// Validation
		if (!handle || !name) {
			return fail(400, { 
				error: 'Handle and name are required.',
				handle, name, governingDocumentSlug
			});
		}

		if (!/^[a-z0-9_-]{2,64}$/.test(handle)) {
			return fail(400, { 
				error: 'Handle must be 2-64 lowercase letters, numbers, hyphens, or underscores.',
				handle, name, governingDocumentSlug
			});
		}

		// Check if handle is already taken
		if (getAssociationByHandle(handle)) {
			return fail(400, {
				error: 'An association with this handle already exists.',
				handle, name, governingDocumentSlug
			});
		}

		try {
			const service = createAssociation({
				handle,
				name,
				abbreviation,
				type: 'service',
				governing_document_slug: governingDocumentSlug,
				established_by_motion_uuid: establishedByMotionUuid
			});

			redirect(303, `/organization/services/${service.uuid}`);
		} catch (err: any) {
			return fail(400, { 
				error: err.message || 'Failed to create service.',
				handle, name, governingDocumentSlug
			});
		}
	}
};
