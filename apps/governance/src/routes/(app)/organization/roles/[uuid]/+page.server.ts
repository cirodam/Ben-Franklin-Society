import { error } from '@sveltejs/kit';
import type { PageServerLoad } from './$types.js';
import { getRoleByUuid, getPermissionsForRole } from '$lib/server/organization/roles.js';
import { getAssociationByUuid } from '$lib/server/organization/associations.js';
import { getSectionByUuid } from '$lib/server/organization/org-sections.js';
import { db } from '$lib/server/db.js';

export const load: PageServerLoad = async ({ params, locals }) => {
	const role = getRoleByUuid(params.uuid);
	if (!role) error(404, 'Role not found');

	// Get association
	const association = getAssociationByUuid(role.association_uuid);
	if (!association) error(404, 'Association not found');

	// Get section if exists
	const section = role.section_uuid ? getSectionByUuid(role.section_uuid) : null;

	// Get parent role if exists
	const parentRole = role.reports_to_role_uuid ? getRoleByUuid(role.reports_to_role_uuid) : null;

	// Get current holders
	const holders = db
		.prepare(
			`SELECT p.uuid, p.handle, p.given_name, p.family_name, ra.assigned_at
			 FROM role_assignment ra
			 JOIN person p ON p.uuid = ra.person_uuid
			 WHERE ra.role_uuid = ? AND ra.removed_at IS NULL
			 ORDER BY ra.assigned_at DESC`
		)
		.all(role.uuid) as Array<{
		uuid: string;
		handle: string;
		given_name: string;
		family_name: string;
		assigned_at: string;
	}>;

	// Get child roles
	const childRoles = db
		.prepare('SELECT * FROM role WHERE reports_to_role_uuid = ? ORDER BY title')
		.all(role.uuid) as Array<{
		uuid: string;
		title: string;
		description: string | null;
		compensation_franks: number;
	}>;

	// Get permissions
	const rolePermissions = getPermissionsForRole(role.uuid);

	// Get role history
	const history = db
		.prepare(
			`SELECT ra.uuid, ra.person_uuid, ra.assigned_at, ra.removed_at, 
			        p.handle, p.given_name, p.family_name
			 FROM role_assignment ra
			 JOIN person p ON p.uuid = ra.person_uuid
			 WHERE ra.role_uuid = ?
			 ORDER BY ra.assigned_at DESC
			 LIMIT 50`
		)
		.all(role.uuid) as Array<{
		uuid: string;
		person_uuid: string;
		assigned_at: string;
		removed_at: string | null;
		handle: string;
		given_name: string;
		family_name: string;
	}>;

	const actingAs = locals.session?.acting_as_uuid ?? null;
	const canManage = !!actingAs;

	return {
		role,
		association,
		section,
		parentRole,
		holders,
		childRoles,
		permissions: rolePermissions,
		history,
		canManage
	};
};
