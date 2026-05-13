import { error, fail, redirect } from '@sveltejs/kit';
import type { PageServerLoad, Actions } from './$types.js';
import {
	getAssociationByUuid,
	getCurrentMembers,
	getRolesByAssociation,
	getSectionsByAssociation,
	getSortitionConfig,
	assignRoleToMember,
	removeRole,
	getPermissionsForRole,
} from '$lib/server/associations.js';
import { getCurrentTermHolders, listSortitions, vacateSeatTerm } from '$lib/server/sortition.js';
import { hasPermission, PERMISSIONS } from '$lib/server/permissions.js';
import { addEntry, getBodyRecord } from '$lib/server/record.js';
import { audit } from '$lib/server/audit.js';
import { listEnactedMotions, getMotionByUuid } from '$lib/server/motions.js';
import { db } from '$lib/server/db.js';

export const load: PageServerLoad = async ({ params, locals }) => {
	const association = getAssociationByUuid(params.uuid);
	if (!association) error(404, 'Committee not found');
	if (association.type !== 'committee' && association.type !== 'general_assembly') {
		redirect(302, `/associations/${params.uuid}`);
	}

	const config = getSortitionConfig(association.uuid);
	const members = getCurrentMembers(association.uuid);
	const roles = getRolesByAssociation(association.uuid);
	const sections = getSectionsByAssociation(association.uuid);

	const actingAs = locals.session?.acting_as_uuid ?? null;
	const canAssign = actingAs
		? hasPermission(actingAs, PERMISSIONS.ROLES_ASSIGN, association.uuid)
		: false;

	// Create section lookup map
	const sectionMap = new Map<string, { name: string }>();
	for (const section of sections) {
		sectionMap.set(section.uuid, { name: section.name });
	}

	// Enrich roles with holders, permissions, and section names
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
		const section = role.section_uuid ? sectionMap.get(role.section_uuid) : null;
		return { ...role, holders, permissions, section_name: section?.name ?? null };
	});

	// Build role hierarchy for org chart
	interface RoleWithChildren {
		uuid: string;
		name: string;
		level: number | null;
		section_name: string | null;
		salary_monthly: number | null;
		daily_rate: number | null;
		term_days: number | null;
		children: RoleWithChildren[];
	}

	const roleMap = new Map<string, RoleWithChildren>();
	for (const r of enrichedRoles) {
		roleMap.set(r.uuid, { ...r, children: [] });
	}

	const roots: RoleWithChildren[] = [];
	for (const r of enrichedRoles) {
		const node = roleMap.get(r.uuid)!;
		if (r.parent_role_uuid && roleMap.has(r.parent_role_uuid)) {
			roleMap.get(r.parent_role_uuid)!.children.push(node);
		} else {
			roots.push(node);
		}
	}

	const termHolders = getCurrentTermHolders(association.uuid).map((t) => {
		const person = db
			.prepare('SELECT uuid, handle, given_name, family_name FROM person WHERE uuid = ?')
			.get(t.person_uuid) as { uuid: string; handle: string; given_name: string; family_name: string } | undefined;
		return { ...t, person: person ?? null };
	});

	const draws = listSortitions(association.uuid);

	// Resolve source college name if set
	const sourceCollege = config?.source_college_uuid
		? (db.prepare('SELECT name FROM association WHERE uuid = ?').get(config.source_college_uuid) as { name: string } | undefined)
		: null;

	const motions = db
		.prepare('SELECT uuid, title, status, created_at FROM motion WHERE body_uuid = ? ORDER BY created_at DESC LIMIT 10')
		.all(association.uuid) as { uuid: string; title: string; status: string; created_at: string }[];

	const canVacate = locals.session
		? hasPermission(locals.session.acting_as_uuid, PERMISSIONS.SEAT_TERMS_VACATE, association.uuid)
		: false;

	const enactedMotions = (canAssign) ? listEnactedMotions() : [];

	const record = getBodyRecord(association.uuid, { limit: 20 }).map((e) => {
		const recorder = db
			.prepare('SELECT handle FROM person WHERE uuid = ?')
			.get(e.recorded_by) as { handle: string } | undefined;
		return { ...e, recorder_handle: recorder?.handle ?? null };
	});

	return {
		association,
		config,
		sourceCollege: sourceCollege ?? null,
		termHolders,
		draws,
		roles: enrichedRoles,
		roleHierarchy: roots,
		sections,
		members,
		canAssign,
		enactedMotions,
		motions,
		canVacate,
		record
	};
};

export const actions: Actions = {
	vacateTerm: async ({ params, locals, request }) => {
		if (!locals.session) error(401, 'Not authenticated');
		const actingAs = locals.session.acting_as_uuid;

		const association = getAssociationByUuid(params.uuid);
		if (!association) error(404, 'Committee not found');

		if (!hasPermission(actingAs, PERMISSIONS.SEAT_TERMS_VACATE, association.uuid)) {
			return fail(403, { error: 'Insufficient permissions' });
		}

		const data = await request.formData();
		const termUuid = data.get('term_uuid') as string | null;
		if (!termUuid) return fail(400, { error: 'Missing term_uuid' });

		vacateSeatTerm(termUuid);
		addEntry(association.uuid, actingAs, 'seat_term_vacated', 'seat_term', termUuid,
			'A seat term was vacated early');
		audit(actingAs, 'seat_term.vacate', 'seat_term', termUuid, 'Seat term vacated early');

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
