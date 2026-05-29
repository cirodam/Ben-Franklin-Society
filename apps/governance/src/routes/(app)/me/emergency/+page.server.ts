import { redirect, fail } from '@sveltejs/kit';
import type { PageServerLoad, Actions } from './$types';
import { getPersonByUuid } from '$lib/server/organization/people.js';
import {
	listEmergencySkills,
	listEmergencyTools,
	getPersonSkills,
	getPersonTools,
	addPersonSkill,
	addPersonTool,
	updatePersonSkill,
	updatePersonTool,
	removePersonSkill,
	removePersonTool
} from '$lib/server/organization/emergency-registry.js';

export const load: PageServerLoad = async ({ locals }) => {
	const session = locals.session;
	if (!session) {
		throw redirect(302, '/login');
	}

	const person = getPersonByUuid(session.person_uuid);
	if (!person) {
		throw redirect(302, '/login');
	}

	const allSkills = listEmergencySkills();
	const allTools = listEmergencyTools();
	const personSkills = getPersonSkills(session.person_uuid);
	const personTools = getPersonTools(session.person_uuid);

	return {
		person,
		allSkills,
		allTools,
		personSkills,
		personTools
	};
};

export const actions: Actions = {
	addSkill: async ({ request, locals }) => {
		if (!locals.session) {
			return fail(401, { error: 'Not authenticated' });
		}

		const fd = await request.formData();
		const skillUuid = String(fd.get('skill_uuid') ?? '');
		const notes = String(fd.get('notes') ?? '').trim();
		const proficiency = String(fd.get('proficiency') ?? '');

		if (!skillUuid) {
			return fail(400, { error: 'Skill is required' });
		}

		try {
			addPersonSkill(locals.session.person_uuid, skillUuid, {
				notes: notes || undefined,
				proficiency: proficiency as 'beginner' | 'intermediate' | 'expert' || undefined,
				available: true
			});
		} catch (err: any) {
			return fail(400, { error: err.message || 'Failed to add skill' });
		}

		return { success: true };
	},

	updateSkill: async ({ request, locals }) => {
		if (!locals.session) {
			return fail(401, { error: 'Not authenticated' });
		}

		const fd = await request.formData();
		const skillUuid = String(fd.get('skill_uuid') ?? '');
		const notes = String(fd.get('notes') ?? '').trim();
		const proficiency = String(fd.get('proficiency') ?? '');
		const available = fd.get('available') === 'true';

		if (!skillUuid) {
			return fail(400, { error: 'Skill is required' });
		}

		try {
			updatePersonSkill(locals.session.person_uuid, skillUuid, {
				notes: notes || null,
				proficiency: proficiency as 'beginner' | 'intermediate' | 'expert' || null,
				available
			});
		} catch (err: any) {
			return fail(400, { error: err.message || 'Failed to update skill' });
		}

		return { success: true };
	},

	removeSkill: async ({ request, locals }) => {
		if (!locals.session) {
			return fail(401, { error: 'Not authenticated' });
		}

		const fd = await request.formData();
		const skillUuid = String(fd.get('skill_uuid') ?? '');

		if (!skillUuid) {
			return fail(400, { error: 'Skill is required' });
		}

		try {
			removePersonSkill(locals.session.person_uuid, skillUuid);
		} catch (err: any) {
			return fail(400, { error: err.message || 'Failed to remove skill' });
		}

		return { success: true };
	},

	addTool: async ({ request, locals }) => {
		if (!locals.session) {
			return fail(401, { error: 'Not authenticated' });
		}

		const fd = await request.formData();
		const toolUuid = String(fd.get('tool_uuid') ?? '');
		const notes = String(fd.get('notes') ?? '').trim();
		const quantityStr = String(fd.get('quantity') ?? '').trim();

		if (!toolUuid) {
			return fail(400, { error: 'Tool is required' });
		}

		const quantity = quantityStr ? parseInt(quantityStr, 10) : undefined;
		if (quantityStr && (isNaN(quantity!) || quantity! < 1)) {
			return fail(400, { error: 'Quantity must be a positive number' });
		}

		try {
			addPersonTool(locals.session.person_uuid, toolUuid, {
				notes: notes || undefined,
				quantity,
				available: true
			});
		} catch (err: any) {
			return fail(400, { error: err.message || 'Failed to add tool' });
		}

		return { success: true };
	},

	updateTool: async ({ request, locals }) => {
		if (!locals.session) {
			return fail(401, { error: 'Not authenticated' });
		}

		const fd = await request.formData();
		const toolUuid = String(fd.get('tool_uuid') ?? '');
		const notes = String(fd.get('notes') ?? '').trim();
		const quantityStr = String(fd.get('quantity') ?? '').trim();
		const available = fd.get('available') === 'true';

		if (!toolUuid) {
			return fail(400, { error: 'Tool is required' });
		}

		const quantity = quantityStr ? parseInt(quantityStr, 10) : null;
		if (quantityStr && (isNaN(quantity!) || quantity! < 1)) {
			return fail(400, { error: 'Quantity must be a positive number' });
		}

		try {
			updatePersonTool(locals.session.person_uuid, toolUuid, {
				notes: notes || null,
				quantity,
				available
			});
		} catch (err: any) {
			return fail(400, { error: err.message || 'Failed to update tool' });
		}

		return { success: true };
	},

	removeTool: async ({ request, locals }) => {
		if (!locals.session) {
			return fail(401, { error: 'Not authenticated' });
		}

		const fd = await request.formData();
		const toolUuid = String(fd.get('tool_uuid') ?? '');

		if (!toolUuid) {
			return fail(400, { error: 'Tool is required' });
		}

		try {
			removePersonTool(locals.session.person_uuid, toolUuid);
		} catch (err: any) {
			return fail(400, { error: err.message || 'Failed to remove tool' });
		}

		return { success: true };
	}
};
