import { error, redirect, fail } from '@sveltejs/kit';
import type { PageServerLoad, Actions } from './$types.js';
import {
	getAssociationByUuid,
	getCurrentMembers,
	getRolesByAssociation,
	createRole,
	assignRole as assignRoleToMember,
	removeRole,
	getPermissionsForRole,
} from '$lib/server/associations.js';
import { hasPermission, PERMISSIONS } from '$lib/server/permissions.js';
import { addEntry } from '$lib/server/record.js';
import { audit } from '$lib/server/audit.js';
import { listEnactedMotions, getMotionByUuid } from '$lib/server/motions.js';
import { db } from '$lib/server/db.js';

export const load: PageServerLoad = async ({ params, locals }) => {
	const association = getAssociationByUuid(params.uuid);
	if (!association) error(404, 'Service not found');
	if (association.type !== 'service') redirect(302, `/associations/${params.uuid}`);

	const actingAs = locals.session?.acting_as_uuid ?? null;
	const canAssign = actingAs
		? hasPermission(actingAs, PERMISSIONS.ROLES_ASSIGN, association.uuid)
		: false;

	const members = getCurrentMembers(association.uuid);
	const roles = getRolesByAssociation(association.uuid);

	// Enrich roles with holders and permissions
	const enrichedRoles = roles.map((role) => {
		const holders = (
			db
				.prepare(
					`SELECT p.uuid, p.handle, p.given_name, p.family_name
					 FROM person_role pr
					 JOIN person p ON p.uuid = pr.person_uuid
					 WHERE pr.role_uuid = ? AND pr.removed_at IS NULL`
				)
				.all(role.uuid) as { uuid: string; handle: string; given_name: string; family_name: string }[]
		);
		const permissions = getPermissionsForRole(role.uuid);
		return { ...role, holders, permissions };
	});

	// Build role hierarchy for org chart
	interface RoleWithChildren {
		uuid: string;
		name: string;
		level: number | null;
		division: string | null;
		salary_monthly: number | null;
		daily_rate: number | null;
		term_days: number | null;
		children: RoleWithChildren[];
	}

	const roleMap = new Map<string, RoleWithChildren>();
	const rootRoles: RoleWithChildren[] = [];

	// First pass: create all role objects
	for (const role of roles) {
		roleMap.set(role.uuid, {
			uuid: role.uuid,
			name: role.name,
			level: (role as any).level ?? null,
			division: (role as any).division ?? null,
			salary_monthly: (role as any).salary_monthly ?? null,
			daily_rate: (role as any).daily_rate ?? null,
			term_days: (role as any).term_days ?? null,
			children: []
		});
	}

	// Second pass: build hierarchy
	for (const role of roles) {
		const roleNode = roleMap.get(role.uuid)!;
		const parentUuid = (role as any).parent_role_uuid;
		
		if (parentUuid && roleMap.has(parentUuid)) {
			roleMap.get(parentUuid)!.children.push(roleNode);
		} else {
			rootRoles.push(roleNode);
		}
	}

	// Sort children by level and name
	const sortRoles = (roles: RoleWithChildren[]) => {
		roles.sort((a, b) => {
			if (a.level !== b.level) return (a.level ?? 99) - (b.level ?? 99);
			return a.name.localeCompare(b.name);
		});
		roles.forEach(r => sortRoles(r.children));
	};
	sortRoles(rootRoles);

	const memberDetails = members.map((m) => {
		const person = db
			.prepare('SELECT uuid, handle, given_name, family_name FROM person WHERE uuid = ?')
			.get(m.person_uuid) as { uuid: string; handle: string; given_name: string; family_name: string } | undefined;
		return { ...m, person: person ?? null };
	});

	const motions = db
		.prepare('SELECT uuid, title, status, created_at FROM motion WHERE body_uuid = ? ORDER BY created_at DESC LIMIT 10')
		.all(association.uuid) as { uuid: string; title: string; status: string; created_at: string }[];

	const enactedMotions = canAssign ? listEnactedMotions() : [];

	return { 
		association, 
		members: memberDetails, 
		roles: enrichedRoles, 
		roleHierarchy: rootRoles,
		motions,
		canAssign,
		enactedMotions
	};
};

export const actions: Actions = {
	createRole: async ({ request, locals, params }) => {
		if (!locals.session) return fail(401, { message: 'Not authenticated' });
		const actingAs = locals.session.acting_as_uuid;
		const data = await request.formData();
		const name = String(data.get('name') ?? '').trim();

		if (!name) return fail(400, { message: 'Missing role name' });
		if (!hasPermission(actingAs, PERMISSIONS.ROLES_ASSIGN, params.uuid)) {
			return fail(403, { message: 'Forbidden' });
		}

		const role = createRole(params.uuid, name);
		addEntry(
			params.uuid,
			actingAs,
			'role_created',
			'role',
			role.uuid,
			`Role "${name}" created.`
		);
		audit(actingAs, 'role.create', 'role', role.uuid, `Role "${name}" created in service ${params.uuid}`);
		return { success: true };
	},

	assignRole: async ({ request, locals, params }) => {
		if (!locals.session) return fail(401, { message: 'Not authenticated' });
		const actingAs = locals.session.acting_as_uuid;
		const data = await request.formData();
		const motion_uuid = String(data.get('motion_uuid') ?? '').trim();
		const person_uuid = String(data.get('person_uuid') ?? '').trim();
		const role_uuid = String(data.get('role_uuid') ?? '').trim();

		if (!motion_uuid) return fail(400, { message: 'A passed motion must be selected.' });
		const motion = getMotionByUuid(motion_uuid);
		if (!motion || motion.status !== 'enacted') return fail(400, { message: 'Selected motion is not enacted.' });
		if (!person_uuid || !role_uuid) return fail(400, { message: 'Missing fields' });
		if (!hasPermission(actingAs, PERMISSIONS.ROLES_ASSIGN, params.uuid)) {
			return fail(403, { message: 'Forbidden' });
		}

		assignRoleToMember(person_uuid, role_uuid, params.uuid);

		const person = db
			.prepare('SELECT handle FROM person WHERE uuid = ?')
			.get(person_uuid) as { handle: string } | undefined;
		const role = db
			.prepare('SELECT name FROM role WHERE uuid = ?')
			.get(role_uuid) as { name: string } | undefined;

		addEntry(
			params.uuid,
			actingAs,
			'role_assigned',
			'role',
			role_uuid,
			`@${person?.handle ?? person_uuid} assigned role "${role?.name ?? role_uuid}".`
		);
		audit(actingAs, 'role.assign', 'person', person_uuid,
			`@${person?.handle ?? person_uuid} assigned role "${role?.name ?? role_uuid}"`, motion_uuid);
		return { success: true };
	},

	revokeRole: async ({ request, locals, params }) => {
		if (!locals.session) return fail(401, { message: 'Not authenticated' });
		const actingAs = locals.session.acting_as_uuid;
		const data = await request.formData();
		const motion_uuid = String(data.get('motion_uuid') ?? '').trim();
		const person_uuid = String(data.get('person_uuid') ?? '').trim();
		const role_uuid = String(data.get('role_uuid') ?? '').trim();

		if (!motion_uuid) return fail(400, { message: 'A passed motion must be selected.' });
		const revokeMotion = getMotionByUuid(motion_uuid);
		if (!revokeMotion || revokeMotion.status !== 'enacted') return fail(400, { message: 'Selected motion is not enacted.' });
		if (!person_uuid || !role_uuid) return fail(400, { message: 'Missing fields' });
		if (!hasPermission(actingAs, PERMISSIONS.ROLES_ASSIGN, params.uuid)) {
			return fail(403, { message: 'Forbidden' });
		}

		removeRole(person_uuid, role_uuid);

		const person = db
			.prepare('SELECT handle FROM person WHERE uuid = ?')
			.get(person_uuid) as { handle: string } | undefined;
		const role = db
			.prepare('SELECT name FROM role WHERE uuid = ?')
			.get(role_uuid) as { name: string } | undefined;

		addEntry(
			params.uuid,
			actingAs,
			'role_revoked',
			'role',
			role_uuid,
			`@${person?.handle ?? person_uuid} removed from role "${role?.name ?? role_uuid}".`
		);
		audit(actingAs, 'role.revoke', 'person', person_uuid,
			`@${person?.handle ?? person_uuid} removed from role "${role?.name ?? role_uuid}"`, motion_uuid);
		return { success: true };
	},
};
