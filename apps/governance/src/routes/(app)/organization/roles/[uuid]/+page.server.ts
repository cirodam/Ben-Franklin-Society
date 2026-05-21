import { error, fail } from '@sveltejs/kit';
import type { PageServerLoad, Actions } from './$types.js';
import { getRoleByUuid, getPermissionsForRole, setRolePermissions } from '$lib/server/organization/roles.js';
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

	// Define all available permissions across all apps
	const availablePermissions = [
		{
			app: 'governance',
			label: 'Governance',
			permissions: [
				{ value: 'motions:create', label: 'Create motions' },
				{ value: 'motions:advance', label: 'Advance motions' },
				{ value: 'vote_sessions:create', label: 'Create vote sessions' },
				{ value: 'vote_sessions:close', label: 'Close vote sessions' },
				{ value: 'vote_sessions:finalize', label: 'Finalize vote sessions' },
				{ value: 'sortition:record', label: 'Record sortition' },
				{ value: 'seat_terms:vacate', label: 'Vacate seat terms' },
				{ value: 'members:add', label: 'Add members' },
				{ value: 'members:remove', label: 'Remove members' },
				{ value: 'library:create', label: 'Create library documents' },
				{ value: 'library:edit', label: 'Edit library documents' },
				{ value: 'library:adopt', label: 'Adopt library documents' },
				{ value: 'library:repeal', label: 'Repeal library documents' },
				{ value: 'roles:assign', label: 'Assign roles' },
				{ value: 'record:write', label: 'Write to record' },
				{ value: 'people:add', label: 'Add people' },
				{ value: 'people:edit', label: 'Edit people' },
				{ value: 'people:remove', label: 'Remove people' },
				{ value: 'calendar:write', label: 'Write to calendar' },
				{ value: 'governance:admin', label: 'Governance admin' }
			]
		},
		{
			app: 'mail',
			label: 'Mail',
			permissions: [
				{ value: 'moderator', label: 'Moderator' }
			]
		},
		{
			app: 'bank',
			label: 'Community Bank',
			permissions: [
				{ value: 'teller', label: 'Teller' },
				{ value: 'admin', label: 'Admin' }
			]
		},
		{
			app: 'marketplace',
			label: 'Marketplace',
			permissions: [
				{ value: 'administrator', label: 'Administrator' }
			]
		}
	];

	return {
		role,
		association,
		section,
		parentRole,
		holders,
		childRoles,
		permissions: rolePermissions,
		history,
		canManage,
		availablePermissions
	};
};

export const actions: Actions = {
	update_permissions: async ({ request, params, locals }) => {
		const actingAs = locals.session?.acting_as_uuid;
		if (!actingAs) {
			return fail(403, { error: 'Not authorized' });
		}

		const role = getRoleByUuid(params.uuid);
		if (!role) {
			return fail(404, { error: 'Role not found' });
		}

		const formData = await request.formData();
		const permissionsJson = formData.get('permissions');
		
		if (typeof permissionsJson !== 'string') {
			return fail(400, { error: 'Invalid permissions data' });
		}

		try {
			const permissions = JSON.parse(permissionsJson) as Array<{ app: string; permission: string }>;
			
			// Validate permissions
			for (const perm of permissions) {
				if (!perm.app || !perm.permission) {
					return fail(400, { error: 'Invalid permission format' });
				}
			}

			setRolePermissions(role.uuid, permissions);

			return { success: true };
		} catch (err) {
			console.error('Error updating permissions:', err);
			return fail(500, { error: 'Failed to update permissions' });
		}
	}
};
