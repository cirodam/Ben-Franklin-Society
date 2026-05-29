import { error, fail, redirect } from '@sveltejs/kit';
import type { PageServerLoad, Actions } from './$types.js';
import { db } from '$lib/server/db.js';
import { createMotion } from '$lib/server/governance/motion/mutations.js';
import type { MotionDocument } from '@bfs/types';

export const load: PageServerLoad = async ({ url, locals }) => {
	if (!locals.session) {
		error(401, 'Not authenticated');
	}

	const bodyParam = url.searchParams.get('body');
	if (!bodyParam) {
		error(400, 'Body parameter is required');
	}

	// Look up body by UUID or handle
	const body = db
		.prepare(`
			SELECT uuid, name, handle 
			FROM association 
			WHERE uuid = ? OR handle = ?
		`)
		.get(bodyParam, bodyParam) as { uuid: string; name: string; handle: string } | undefined;

	if (!body) {
		error(404, 'Body not found');
	}

	// Create a draft motion structure for the UI
	const draftMotion: MotionDocument = {
		uuid: 'draft',
		type: 'motion',
		slug: 'draft',
		document_id: null,
		version: 1,
		title: '',
		owner_uuid: locals.session.acting_as_uuid,
		created_at: new Date().toISOString(),
		updated_at: new Date().toISOString(),
		content: {
			provisions: [
				{
					number: '1',
					text: '',
					reasoning: ''
				}
			],
			introducer_uuid: locals.session.acting_as_uuid,
			body_uuid: body.uuid,
			body_name: body.name,
			motion_number: '',
		}
	};

	return {
		body,
		draftMotion
	};
};

export const actions: Actions = {
	default: async ({ request, locals, url }) => {
		if (!locals.session) {
			return fail(401, { message: 'Not authenticated' });
		}

		const bodyParam = url.searchParams.get('body');
		if (!bodyParam) {
			return fail(400, { message: 'Body parameter is required' });
		}

		// Look up body
		const body = db
			.prepare(`
				SELECT uuid, name, handle 
				FROM association 
				WHERE uuid = ? OR handle = ?
			`)
			.get(bodyParam, bodyParam) as { uuid: string; name: string; handle: string } | undefined;

		if (!body) {
			return fail(404, { message: 'Body not found' });
		}

		const data = await request.formData();
		const title = String(data.get('title') ?? '').trim();
		const provisionsJson = String(data.get('provisions') ?? '[]');

		if (!title) {
			return fail(400, { message: 'Title is required' });
		}

		let provisions;
		try {
			provisions = JSON.parse(provisionsJson);
		} catch {
			return fail(400, { message: 'Invalid provisions data' });
		}

		if (!Array.isArray(provisions) || provisions.length === 0) {
			return fail(400, { message: 'At least one provision is required' });
		}

		// Filter out empty provisions
		provisions = provisions.filter(p => p.text && p.text.trim());

		if (provisions.length === 0) {
			return fail(400, { message: 'At least one provision with text is required' });
		}

		// Create motion in body's inbox folder
		// Convert provisions array to single body/reasoning for backwards compatibility
		const firstProvision = provisions[0];
		
		const motion = createMotion({
			title,
			body: firstProvision.text,
			reasoning: firstProvision.reasoning || null,
			introduced_by_uuid: locals.session.acting_as_uuid,
			body_uuid: body.uuid,
			body_name: body.name,
		});

		// Redirect to the motion detail page
		throw redirect(303, `/governance/motions/${motion.slug}`);
	}
};
