import type { Actions, PageServerLoad } from './$types.js';
import { fail } from '@sveltejs/kit';
import {
	getTemplates,
	getTemplate,
	createTemplate,
	updateTemplate,
	deleteTemplate,
} from '$lib/server/templates.js';

export const load: PageServerLoad = async ({ locals }) => {
	const session = locals.session!;
	const templates = getTemplates(session.acting_as_uuid);
	return { templates };
};

export const actions: Actions = {
	create: async ({ locals, request }) => {
		const session = locals.session!;
		const data = await request.formData();
		const name = String(data.get('name') ?? '').trim();
		const subject = String(data.get('subject') ?? '').trim();
		const body = String(data.get('body') ?? '').trim();

		if (!name) return fail(400, { error: 'Template name is required.' });
		if (!subject) return fail(400, { error: 'Template subject is required.' });
		if (!body) return fail(400, { error: 'Template body is required.' });

		try {
			createTemplate({
				mailbox_uuid: session.acting_as_uuid,
				name,
				subject,
				body,
			});
			return { success: true };
		} catch (err) {
			return fail(400, { error: 'A template with this name already exists.' });
		}
	},

	update: async ({ locals, request }) => {
		const session = locals.session!;
		const data = await request.formData();
		const uuid = String(data.get('uuid') ?? '').trim();
		const name = String(data.get('name') ?? '').trim();
		const subject = String(data.get('subject') ?? '').trim();
		const body = String(data.get('body') ?? '').trim();

		if (!uuid) return fail(400, { error: 'Template UUID is required.' });
		if (!name) return fail(400, { error: 'Template name is required.' });
		if (!subject) return fail(400, { error: 'Template subject is required.' });
		if (!body) return fail(400, { error: 'Template body is required.' });

		const template = getTemplate(uuid, session.acting_as_uuid);
		if (!template) return fail(404, { error: 'Template not found.' });

		try {
			updateTemplate({
				uuid,
				mailbox_uuid: session.acting_as_uuid,
				name,
				subject,
				body,
			});
			return { success: true };
		} catch (err) {
			return fail(400, { error: 'A template with this name already exists.' });
		}
	},

	delete: async ({ locals, request }) => {
		const session = locals.session!;
		const data = await request.formData();
		const uuid = String(data.get('uuid') ?? '').trim();

		if (!uuid) return fail(400, { error: 'Template UUID is required.' });

		const template = getTemplate(uuid, session.acting_as_uuid);
		if (!template) return fail(404, { error: 'Template not found.' });

		deleteTemplate(uuid, session.acting_as_uuid);
		return { success: true };
	},
};
