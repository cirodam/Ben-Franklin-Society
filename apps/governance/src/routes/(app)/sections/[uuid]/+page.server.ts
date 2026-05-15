import { error } from '@sveltejs/kit';
import type { PageServerLoad } from './$types.js';
import {
	getSectionByUuid,
	getRolesByAssociation,
	getAssociationByUuid,
	getCurrentMembers,
	getPermissionsForRole,
} from '$lib/server/associations.js';
import { hasPermission, PERMISSIONS } from '$lib/server/permissions.js';
import { db } from '$lib/server/db.js';

export const load: PageServerLoad = async ({ params, locals }) => {
	const section = getSectionByUuid(params.uuid);
	if (!section) error(404, 'Section not found');

	const association = getAssociationByUuid(section.association_uuid);
	if (!association) error(404, 'Association not found');

	const actingAs = locals.session?.acting_as_uuid ?? null;
	const canManage = actingAs
		? hasPermission(actingAs, PERMISSIONS.ROLES_ASSIGN, association.uuid)
		: false;

	// Get all roles in this association
	const allRoles = getRolesByAssociation(association.uuid);
	
	// Filter roles for this section
	const sectionRoles = allRoles.filter(r => r.section_uuid === section.uuid);

	// Enrich roles with holders
	const enrichedRoles = sectionRoles.map((role) => {
		const holders = (
			db
				.prepare(
					`SELECT p.uuid, p.handle, p.given_name, p.family_name
					 FROM role_assignment ra
					 JOIN person p ON p.uuid = ra.person_uuid
					 WHERE ra.role_uuid = ? AND ra.removed_at IS NULL`
				)
				.all(role.uuid) as { uuid: string; handle: string; given_name: string; family_name: string }[]
		);
		return { ...role, holders };
	});

	// Build hierarchy within this section
	interface RoleWithChildren {
		uuid: string;
		title: string;
		compensation_franks: number;
		holders: Array<{ uuid: string; handle: string; given_name: string; family_name: string }>;
		children: RoleWithChildren[];
	}

	const roleMap = new Map<string, RoleWithChildren>();
	const rootRoles: RoleWithChildren[] = [];

	// Create all role objects
	for (const role of enrichedRoles) {
		roleMap.set(role.uuid, {
			uuid: role.uuid,
			title: role.title,
			compensation_franks: role.compensation_franks,
			holders: role.holders,
			children: []
		});
	}

	// Build hierarchy
	for (const role of enrichedRoles) {
		const roleNode = roleMap.get(role.uuid)!;
		const parentUuid = role.reports_to_role_uuid;
		
		// If parent is in this section, add as child. Otherwise, it's a root.
		if (parentUuid && roleMap.has(parentUuid)) {
			roleMap.get(parentUuid)!.children.push(roleNode);
		} else {
			rootRoles.push(roleNode);
		}
	}

	// Sort
	const sortRoles = (roles: RoleWithChildren[]) => {
		roles.sort((a, b) => a.title.localeCompare(b.title));
		roles.forEach(r => sortRoles(r.children));
	};
	sortRoles(rootRoles);

	// Get members for assignment UI (if needed later)
	const members = getCurrentMembers(association.uuid);
	const memberDetails = members.map((m) => {
		const person = db
			.prepare('SELECT uuid, handle, given_name, family_name FROM person WHERE uuid = ?')
			.get(m.person_uuid) as { uuid: string; handle: string; given_name: string; family_name: string } | undefined;
		return { ...m, person: person ?? null };
	});

	return {
		section,
		association,
		roles: enrichedRoles,
		roleHierarchy: rootRoles,
		members: memberDetails,
		canManage
	};
};
