import { redirect, fail } from '@sveltejs/kit';
import type { PageServerLoad, Actions } from './$types';
import {
	listEmergencySkills,
	createEmergencySkill,
	updateEmergencySkill,
	deactivateEmergencySkill
} from '$lib/server/organization/emergency-registry.js';

export const load: PageServerLoad = async ({ locals }) => {
	const session = locals.session;
	if (!session) {
		throw redirect(302, '/login');
	}

	// TODO: Add admin permission check
	// For now, any logged-in user can access

	const skills = listEmergencySkills();
	const activeSkills = skills.filter(s => s.active);
	const inactiveSkills = skills.filter(s => !s.active);

	return {
		activeSkills,
		inactiveSkills
	};
};

export const actions: Actions = {
	create: async ({ request, locals }) => {
		if (!locals.session) {
			return fail(401, { error: 'Not authenticated' });
		}

		const fd = await request.formData();
		const name = String(fd.get('name') ?? '').trim();
		const category = String(fd.get('category') ?? '').trim();
		const description = String(fd.get('description') ?? '').trim();

		if (!name) {
			return fail(400, { error: 'Name is required' });
		}

		try {
			createEmergencySkill({
				name,
				category: category || undefined,
				description: description || undefined
			});
		} catch (err: any) {
			return fail(400, { error: err.message || 'Failed to create skill' });
		}

		return { success: true };
	},

	update: async ({ request, locals }) => {
		if (!locals.session) {
			return fail(401, { error: 'Not authenticated' });
		}

		const fd = await request.formData();
		const uuid = String(fd.get('uuid') ?? '');
		const name = String(fd.get('name') ?? '').trim();
		const category = String(fd.get('category') ?? '').trim();
		const description = String(fd.get('description') ?? '').trim();

		if (!uuid || !name) {
			return fail(400, { error: 'UUID and name are required' });
		}

		try {
			updateEmergencySkill(uuid, {
				name,
				category: category || null,
				description: description || null
			});
		} catch (err: any) {
			return fail(400, { error: err.message || 'Failed to update skill' });
		}

		return { success: true };
	},

	deactivate: async ({ request, locals }) => {
		if (!locals.session) {
			return fail(401, { error: 'Not authenticated' });
		}

		const fd = await request.formData();
		const uuid = String(fd.get('uuid') ?? '');

		if (!uuid) {
			return fail(400, { error: 'UUID is required' });
		}

		try {
			deactivateEmergencySkill(uuid);
		} catch (err: any) {
			return fail(400, { error: err.message || 'Failed to deactivate skill' });
		}

		return { success: true };
	}
};
