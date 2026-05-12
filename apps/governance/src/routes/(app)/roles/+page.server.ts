import { fail } from '@sveltejs/kit';
import type { PageServerLoad, Actions } from './$types.js';
import {
	listAssociations,
	getRolesByAssociation,
	getCurrentMembers,
	createRole,
	assignRole,
	removeRole,
	getPermissionsForRole,
} from '$lib/server/associations.js';
import { listPeople } from '$lib/server/people.js';
import { hasPermission, PERMISSIONS } from '$lib/server/permissions.js';
import { addEntry } from '$lib/server/record.js';
import { audit } from '$lib/server/audit.js';
import { listEnactedMotions, getMotionByUuid } from '$lib/server/motions.js';
import { db } from '$lib/server/db.js';

export const load: PageServerLoad = async ({ locals }) => {
	const actingAs = locals.session?.acting_as_uuid ?? null;
	const canAssign = actingAs
		? hasPermission(actingAs, PERMISSIONS.ROLES_ASSIGN)
		: false;

	const associations = listAssociations({ status: 'active' });

	const bodies = associations.map((assoc) => {
		const roles = getRolesByAssociation(assoc.uuid);
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
		const members = getCurrentMembers(assoc.uuid);
		const canAssignHere = actingAs
			? hasPermission(actingAs, PERMISSIONS.ROLES_ASSIGN, assoc.uuid)
			: false;
		return { association: assoc, roles: enrichedRoles, members, canAssign: canAssignHere };
	});

	const people = listPeople({ status: 'active' });

	const enactedMotions = canAssign ? listEnactedMotions() : [];

	return { bodies, people, canAssign, enactedMotions };
};

export const actions: Actions = {
	createRole: async ({ request, locals }) => {
		if (!locals.session) return fail(401, { message: 'Not authenticated' });
		const actingAs = locals.session.acting_as_uuid;
		const data = await request.formData();
		const association_uuid = String(data.get('association_uuid') ?? '').trim();
		const name = String(data.get('name') ?? '').trim();

		if (!association_uuid || !name) return fail(400, { message: 'Missing fields' });
		if (!hasPermission(actingAs, PERMISSIONS.ROLES_ASSIGN, association_uuid)) {
			return fail(403, { message: 'Forbidden' });
		}

		const role = createRole(association_uuid, name);
		addEntry(
			association_uuid,
			actingAs,
			'role_created',
			'role',
			role.uuid,
			`Role "${name}" created.`
		);
		audit(actingAs, 'role.create', 'role', role.uuid, `Role "${name}" created in association ${association_uuid}`);
		return { success: true };
	},

	assignRole: async ({ request, locals }) => {
		if (!locals.session) return fail(401, { message: 'Not authenticated' });
		const actingAs = locals.session.acting_as_uuid;
		const data = await request.formData();
		const motion_uuid = String(data.get('motion_uuid') ?? '').trim();
		const person_uuid = String(data.get('person_uuid') ?? '').trim();
		const role_uuid = String(data.get('role_uuid') ?? '').trim();
		const association_uuid = String(data.get('association_uuid') ?? '').trim();

		if (!motion_uuid) return fail(400, { message: 'A passed motion must be selected.' });
		const motion = getMotionByUuid(motion_uuid);
		if (!motion || motion.status !== 'enacted') return fail(400, { message: 'Selected motion is not enacted.' });
		if (!person_uuid || !role_uuid || !association_uuid) return fail(400, { message: 'Missing fields' });
		if (!hasPermission(actingAs, PERMISSIONS.ROLES_ASSIGN, association_uuid)) {
			return fail(403, { message: 'Forbidden' });
		}

		assignRole(person_uuid, role_uuid, association_uuid);

		const person = db
			.prepare('SELECT handle FROM person WHERE uuid = ?')
			.get(person_uuid) as { handle: string } | undefined;
		const role = db
			.prepare('SELECT name FROM role WHERE uuid = ?')
			.get(role_uuid) as { name: string } | undefined;

		addEntry(
			association_uuid,
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

	revokeRole: async ({ request, locals }) => {
		if (!locals.session) return fail(401, { message: 'Not authenticated' });
		const actingAs = locals.session.acting_as_uuid;
		const data = await request.formData();
		const motion_uuid = String(data.get('motion_uuid') ?? '').trim();
		const person_uuid = String(data.get('person_uuid') ?? '').trim();
		const role_uuid = String(data.get('role_uuid') ?? '').trim();
		const association_uuid = String(data.get('association_uuid') ?? '').trim();

		if (!motion_uuid) return fail(400, { message: 'A passed motion must be selected.' });
		const revokeMotion = getMotionByUuid(motion_uuid);
		if (!revokeMotion || revokeMotion.status !== 'enacted') return fail(400, { message: 'Selected motion is not enacted.' });
		if (!person_uuid || !role_uuid || !association_uuid) return fail(400, { message: 'Missing fields' });
		if (!hasPermission(actingAs, PERMISSIONS.ROLES_ASSIGN, association_uuid)) {
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
			association_uuid,
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
