import { error, fail, redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types.js';
import { getRoleByUuid, updateRole, deleteRole } from '$lib/server/organization/roles.js';
import { getAssociationByUuid } from '$lib/server/organization/associations.js';
import { getSectionsByAssociation } from '$lib/server/organization/org-sections.js';
import { db } from '$lib/server/db.js';

export const load: PageServerLoad = async ({ params, locals }) => {
	const role = getRoleByUuid(params.uuid);
	if (!role) error(404, 'Role not found');

	const association = getAssociationByUuid(role.association_uuid);
	if (!association) error(404, 'Association not found');

	const sections = getSectionsByAssociation(role.association_uuid);
	
	// Get all roles in the association except this one (for reports-to select)
	const allRoles = db
		.prepare('SELECT uuid, title, reports_to_role_uuid FROM role WHERE association_uuid = ? AND uuid != ? ORDER BY title')
		.all(role.association_uuid, role.uuid) as Array<{
		uuid: string;
		title: string;
		reports_to_role_uuid: string | null;
	}>;

	const actingAs = locals.session?.acting_as_uuid ?? null;
	if (!actingAs) {
		error(403, 'Not authorized');
	}

	return {
		role,
		association,
		sections,
		allRoles
	};
};

export const actions: Actions = {
	update: async ({ params, request }) => {
		const role = getRoleByUuid(params.uuid);
		if (!role) error(404, 'Role not found');

		const fd = await request.formData();
		const title = String(fd.get('title') ?? '').trim();
		const section_uuid = String(fd.get('section_uuid') ?? '') || null;
		const reports_to_role_uuid = String(fd.get('reports_to_role_uuid') ?? '') || null;
		const description = String(fd.get('description') ?? '').trim() || null;
		const compensation_franks = parseInt(String(fd.get('compensation_franks') ?? '0'), 10);

		if (!title) {
			return fail(400, {
				error: 'Title is required.',
				title, section_uuid, reports_to_role_uuid, description, compensation_franks
			});
		}

		// Validate that reports_to doesn't create a circular reference
		if (reports_to_role_uuid) {
			const wouldCreateCycle = checkForCycle(params.uuid, reports_to_role_uuid);
			if (wouldCreateCycle) {
				return fail(400, {
					error: 'Cannot create circular reporting structure.',
					title, section_uuid, reports_to_role_uuid, description, compensation_franks
				});
			}
		}

		try {
			updateRole(params.uuid, {
				title,
				section_uuid,
				reports_to_role_uuid,
				description,
				compensation_franks
			});

			redirect(303, `/organization/roles/${params.uuid}`);
		} catch (err: any) {
			return fail(400, {
				error: err.message || 'Failed to update role.',
				title, section_uuid, reports_to_role_uuid, description, compensation_franks
			});
		}
	},

	delete: async ({ params }) => {
		const role = getRoleByUuid(params.uuid);
		if (!role) error(404, 'Role not found');

		const association = getAssociationByUuid(role.association_uuid);
		if (!association) error(404, 'Association not found');

		try {
			deleteRole(params.uuid);
			
			const associationType = association.type === 'service' ? 'services' : 
			                       association.type === 'college' ? 'colleges' : 
			                       association.type === 'committee' ? 'committees' : 'associations';
			
			redirect(303, `/organization/${associationType}/${association.uuid}`);
		} catch (err: any) {
			return fail(400, { error: err.message || 'Failed to delete role.' });
		}
	}
};

/**
 * Check if setting reports_to_role_uuid would create a cycle
 */
function checkForCycle(roleUuid: string, reportsToUuid: string): boolean {
	const visited = new Set<string>();
	let current: string | null = reportsToUuid;

	while (current) {
		if (current === roleUuid) return true; // Found a cycle
		if (visited.has(current)) return false; // Already checked this path
		visited.add(current);

		const role = getRoleByUuid(current);
		current = role?.reports_to_role_uuid ?? null;
	}

	return false;
}
