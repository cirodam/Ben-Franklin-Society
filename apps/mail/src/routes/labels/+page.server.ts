import type { Actions, PageServerLoad } from './$types.js';
import { fail } from '@sveltejs/kit';
import {
	getLabels,
	getLabel,
	createLabel,
	updateLabel,
	deleteLabel,
} from '$lib/server/labels.js';

export const load: PageServerLoad = async ({ locals }) => {
	const session = locals.session!;
	const labels = getLabels(session.acting_as_uuid);
	return { labels };
};

export const actions: Actions = {
	create: async ({ locals, request }) => {
		const session = locals.session!;
		const data = await request.formData();
		const name = String(data.get('name') ?? '').trim();
		const color = String(data.get('color') ?? '').trim() || undefined;

		if (!name) return fail(400, { error: 'Label name is required.' });

		try {
			createLabel({
				mailbox_uuid: session.acting_as_uuid,
				name,
				color,
			});
			return { success: true };
		} catch (err) {
			return fail(400, { error: 'A label with this name already exists.' });
		}
	},

	update: async ({ locals, request }) => {
		const session = locals.session!;
		const data = await request.formData();
		const uuid = String(data.get('uuid') ?? '').trim();
		const name = String(data.get('name') ?? '').trim();
		const color = String(data.get('color') ?? '').trim() || undefined;

		if (!uuid) return fail(400, { error: 'Label UUID is required.' });
		if (!name) return fail(400, { error: 'Label name is required.' });

		const label = getLabel(uuid, session.acting_as_uuid);
		if (!label) return fail(404, { error: 'Label not found.' });

		try {
			updateLabel({
				uuid,
				mailbox_uuid: session.acting_as_uuid,
				name,
				color,
			});
			return { success: true };
		} catch (err) {
			return fail(400, { error: 'A label with this name already exists.' });
		}
	},

	delete: async ({ locals, request }) => {
		const session = locals.session!;
		const data = await request.formData();
		const uuid = String(data.get('uuid') ?? '').trim();

		if (!uuid) return fail(400, { error: 'Label UUID is required.' });

		const label = getLabel(uuid, session.acting_as_uuid);
		if (!label) return fail(404, { error: 'Label not found.' });

		deleteLabel(uuid, session.acting_as_uuid);
		return { success: true };
	},
};
