import { error, fail } from '@sveltejs/kit';
import type { PageServerLoad, Actions } from './$types.js';
import {
	getDocumentBySlug,
	getSectionByUuid,
	getArticleByUuid,
	getSectionHistory,
	updateSection,
} from '$lib/server/documents.js';
import { hasPermission, PERMISSIONS } from '$lib/server/permissions.js';
import { audit } from '$lib/server/audit.js';

export const load: PageServerLoad = async ({ params, locals }) => {
	const doc = getDocumentBySlug(params.slug);
	if (!doc) error(404, 'Document not found');

	const section = getSectionByUuid(params.sectionUuid);
	if (!section) error(404, 'Section not found');

	const article = getArticleByUuid(section.article_uuid);
	if (!article || article.document_uuid !== doc.uuid) error(404, 'Section not found');

	const history = getSectionHistory(section.uuid);

	let canEdit = false;
	if (locals.session && doc.owner_uuid) {
		canEdit = hasPermission(locals.session.acting_as_uuid, PERMISSIONS.DOCUMENTS_EDIT, doc.owner_uuid);
	}

	return { doc, article, section, history, canEdit };
};

export const actions: Actions = {
	edit: async ({ params, locals, request }) => {
		if (!locals.session) return fail(401, { error: 'Not authenticated' });
		const actingAs = locals.session.acting_as_uuid;

		const doc = getDocumentBySlug(params.slug);
		if (!doc) error(404, 'Document not found');

		if (!doc.owner_uuid || !hasPermission(actingAs, PERMISSIONS.DOCUMENTS_EDIT, doc.owner_uuid)) {
			return fail(403, { error: 'Insufficient permissions' });
		}

		const section = getSectionByUuid(params.sectionUuid);
		if (!section) error(404, 'Section not found');

		const data = await request.formData();
		const title     = String(data.get('title')     ?? '').trim();
		const prose     = String(data.get('prose')     ?? '').trim();
		const rationale = String(data.get('rationale') ?? '').trim();

		if (!prose) return fail(400, { error: 'Prose is required' });

		updateSection(section.uuid, { title, prose, rationale, editorUuid: actingAs });
		audit(actingAs, 'section.edit', 'section', section.uuid,
			`Section edited in "${doc.title}"`);

		return { success: true };
	},
};
