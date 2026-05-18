import { error, fail, redirect } from '@sveltejs/kit';
import { getAssociationByUuid, updateAssociation } from '$lib/server/organization/associations.js';
import type { Actions, PageServerLoad } from './$types.js';

export const load: PageServerLoad = async ({ params }) => {
	const association = getAssociationByUuid(params.uuid);
	if (!association) {
		error(404, 'College not found');
	}
	if (association.type !== 'college') {
		error(400, 'Not a college');
	}

	return { association };
};

export const actions: Actions = {
	update: async ({ params, request }) => {
		const association = getAssociationByUuid(params.uuid);
		if (!association || association.type !== 'college') {
			error(404, 'College not found');
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

			redirect(303, `/colleges/${params.uuid}`);
		} catch (err: any) {
			return fail(400, { 
				error: err.message || 'Failed to update college.',
				name, governingDocumentSlug, status
			});
		}
	}
};
