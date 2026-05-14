import { error, fail, redirect } from '@sveltejs/kit';
import { getAssociationByUuid, updateAssociation } from '$lib/server/associations.js';
import type { Actions, PageServerLoad } from './$types.js';

export const load: PageServerLoad = async ({ params }) => {
	const association = getAssociationByUuid(params.uuid);
	if (!association) {
		error(404, 'Service not found');
	}
	if (association.type !== 'service') {
		error(400, 'Not a service');
	}

	return { association };
};

export const actions: Actions = {
	update: async ({ params, request }) => {
		const association = getAssociationByUuid(params.uuid);
		if (!association || association.type !== 'service') {
			error(404, 'Service not found');
		}

		const fd = await request.formData();
		const name = String(fd.get('name') ?? '').trim();
		const governingDocumentSlug = String(fd.get('governing_document_slug') ?? '').trim() || null;
		const status = String(fd.get('status') ?? 'active') as 'active' | 'inactive' | 'dissolved';

		if (!name) {
			return fail(400, { 
				error: 'Name is required.',
				name, governingDocumentSlug, status
			});
		}

		try {
			updateAssociation(params.uuid, {
				name,
				governing_document_slug: governingDocumentSlug,
				status
			});

			redirect(303, `/services/${params.uuid}`);
		} catch (err: any) {
			return fail(400, { 
				error: err.message || 'Failed to update service.',
				name, governingDocumentSlug, status
			});
		}
	}
};
