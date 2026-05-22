import { error, fail } from '@sveltejs/kit';
import type { PageServerLoad, Actions } from './$types.js';
import {
	getAssociationByHandle,
	getCurrentMembers,
	getRolesByAssociation,
	getSectionsByAssociation,
	getSortitionConfig,
	assignRole,
	unassignRole,
	getPermissionsForRole,
	createSection,
	updateSection,
	deleteSection,
	createRole,
	getRoleByUuid,
	updateRole,
	deleteRole,
} from '$lib/server/organization/associations.js';
import { getCurrentTermHolders, listSortitions, vacateSeatTerm } from '$lib/server/organization/sortition.js';
import { hasPermission, PERMISSIONS } from '$lib/server/infrastructure/permissions.js';
import { addEntry, getBodyRecord } from '$lib/server/communications/record.js';
import { audit } from '$lib/server/documents/audit.js';
import { listEnactedMotions, getMotionByUuid, getMotionBySlug, listMotions, createMotion } from '$lib/server/governance/motions.js';
import { listDeliberationRules, getDeliberationRuleByUuid } from '$lib/server/governance/deliberation-rules.js';
import { getVoteRuleByUuid } from '$lib/server/governance/vote-rules.js';
import { getDocumentBySlug } from '$lib/server/documents/society-docs.js';
import { db } from '$lib/server/db.js';

export const load: PageServerLoad = async ({ locals }) => {
	const association = getAssociationByHandle('general-assembly');
	if (!association) error(404, 'General Assembly not found');

	const config = getSortitionConfig(association.uuid);
	const members = getCurrentMembers(association.uuid);
	const roles = getRolesByAssociation(association.uuid);
	const sections = getSectionsByAssociation(association.uuid);

	const actingAs = locals.session?.acting_as_uuid ?? null;
	// Anyone logged in can edit org chart structure; role assignments still require permission
	const canAssign = !!actingAs;

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
					 FROM role_assignment ra
					 JOIN person p ON p.uuid = ra.person_uuid
					 WHERE ra.role_uuid = ? AND ra.removed_at IS NULL`
				)
				.all(role.uuid) as { uuid: string; handle: string; given_name: string; family_name: string }[]
		);
		const rolePermissions = getPermissionsForRole(role.uuid);
		const permissions = rolePermissions.map(p => ({ name: `${p.app}:${p.permission}` }));
		const section = role.section_uuid ? sectionMap.get(role.section_uuid) : null;
		return { ...role, holders, permissions, section_name: section?.name ?? null };
	});

	// Build role hierarchy for org chart
	interface RoleWithChildren {
		uuid: string;
		title: string;
		section_name: string | null;
		compensation_franks: number;
		children: RoleWithChildren[];
	}

	const roleMap = new Map<string, RoleWithChildren>();
	for (const r of enrichedRoles) {
		roleMap.set(r.uuid, { ...r, children: [] });
	}

	const roots: RoleWithChildren[] = [];
	for (const r of enrichedRoles) {
		const node = roleMap.get(r.uuid)!;
		if (r.reports_to_role_uuid && roleMap.has(r.reports_to_role_uuid)) {
			roleMap.get(r.reports_to_role_uuid)!.children.push(node);
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

	// Get all motions for this body (docket)
	const allMotions = listMotions({ bodyUuid: association.uuid });

	const canCreateMotion = !!actingAs; // Anyone logged in can create motions

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

	const deliberationRules = listDeliberationRules(association.uuid);
	const assemblyRules = getDocumentBySlug('assembly-rules');

	// Get user's draft motions that can be introduced
	const draftMotions = actingAs ? listMotions({ owner_uuid: actingAs, status: 'draft' }) : [];

	return {
		association,
		config,
		termHolders,
		draws,
		allMotions,
		roles: enrichedRoles,
		roleHierarchy: roots,
		sections,
		members,
		canAssign,
		canCreateMotion,
		enactedMotions,
		canVacate,
		record,
		deliberationRules,
		assemblyRules,
		draftMotions
	};
};

export const actions: Actions = {
	introduceMotion: async ({ request, locals }) => {
		if (!locals.session) return fail(401, { message: 'Not authenticated' });
		const actingAs = locals.session.acting_as_uuid;

		const association = getAssociationByHandle('general-assembly');
		if (!association) return fail(404, { message: 'General Assembly not found' });

		const data = await request.formData();
		const motion_slug = String(data.get('motion_slug') ?? '').trim();

		if (!motion_slug) return fail(400, { message: 'Motion must be selected' });

		// Load the motion and verify ownership
		const motion = getMotionBySlug(motion_slug);
		if (!motion) return fail(404, { message: 'Motion not found' });
		if (motion.owner_uuid !== actingAs) return fail(403, { message: 'You can only introduce your own motions' });
		if (motion.content.status !== 'draft') return fail(400, { message: 'Only draft motions can be introduced' });

		// Update motion with body info and transfer ownership to the General Assembly
		const library = await import('$lib/server/documents/society-motions.js');
		
		// Transfer ownership to the General Assembly
		library.updateMotionDocument(motion.slug, {
			owner_uuid: association.uuid
		});
		
		// Update content with body info
		library.updateMotion(motion.slug, {
			body_uuid: association.uuid,
			body_name: association.name,
			introducer_uuid: actingAs,
		});

		// Change status to introduced
		const introduced = library.updateMotionStatus(motion.slug, 'introduced', {
			introduced_at: new Date().toISOString(),
		});

		return { introduced: introduced.slug };
	},

	vacateTerm: async ({ locals, request }) => {
		if (!locals.session) error(401, 'Not authenticated');
		const actingAs = locals.session.acting_as_uuid;

		const association = getAssociationByHandle('general-assembly');
		if (!association) error(500, 'General Assembly not found');

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

	assignRole: async ({ request, locals }) => {
		if (!locals.session) return fail(401, { message: 'Not authenticated' });
		const actingAs = locals.session.acting_as_uuid;
		const association = getAssociationByHandle('general-assembly');
		if (!association) error(500, 'General Assembly not found');

		const data = await request.formData();
		const motion_uuid = String(data.get('motion_uuid') ?? '').trim();
		const person_uuid = String(data.get('person_uuid') ?? '').trim();
		const role_uuid = String(data.get('role_uuid') ?? '').trim();

		if (!motion_uuid) return fail(400, { message: 'A passed motion must be selected.' });
		const motion = getMotionByUuid(motion_uuid);
		if (!motion || motion.status !== 'enacted') return fail(400, { message: 'Selected motion is not enacted.' });
		if (!person_uuid || !role_uuid) return fail(400, { message: 'Missing fields' });
		if (!hasPermission(actingAs, PERMISSIONS.ROLES_ASSIGN, association.uuid)) {
			return fail(403, { message: 'Forbidden' });
		}

assignRole(role_uuid, person_uuid);

		const person = db
			.prepare('SELECT handle FROM person WHERE uuid = ?')
			.get(person_uuid) as { handle: string } | undefined;
		const role = db
			.prepare('SELECT name FROM role WHERE uuid = ?')
			.get(role_uuid) as { name: string } | undefined;

		addEntry(
			association.uuid,
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
		const association = getAssociationByHandle('general-assembly');
		if (!association) error(500, 'General Assembly not found');

		const data = await request.formData();
		const motion_uuid = String(data.get('motion_uuid') ?? '').trim();
		const person_uuid = String(data.get('person_uuid') ?? '').trim();
		const role_uuid = String(data.get('role_uuid') ?? '').trim();

		if (!motion_uuid) return fail(400, { message: 'A passed motion must be selected.' });
		const revokeMotion = getMotionByUuid(motion_uuid);
		if (!revokeMotion || revokeMotion.status !== 'enacted') return fail(400, { message: 'Selected motion is not enacted.' });
		if (!person_uuid || !role_uuid) return fail(400, { message: 'Missing fields' });
		if (!hasPermission(actingAs, PERMISSIONS.ROLES_ASSIGN, association.uuid)) {
			return fail(403, { message: 'Forbidden' });
		}

unassignRole(role_uuid, person_uuid);

		const person = db
			.prepare('SELECT handle FROM person WHERE uuid = ?')
			.get(person_uuid) as { handle: string } | undefined;
		const role = db
			.prepare('SELECT name FROM role WHERE uuid = ?')
			.get(role_uuid) as { name: string } | undefined;

		addEntry(
			association.uuid,
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

	// --- Section management ---
	createSection: async ({ request, locals }) => {
		if (!locals.session) return fail(401, { message: 'Not authenticated' });
		const actingAs = locals.session.acting_as_uuid;

		const association = getAssociationByHandle('general-assembly');
		if (!association) return fail(404, { message: 'General Assembly not found' });

		// TODO: Add permission check once we have section management permission
		// if (!hasPermission(actingAs, PERMISSIONS.SECTIONS_MANAGE, association.uuid)) {
		// 	return fail(403, { message: 'Not authorized to manage sections' });
		// }

		const data = await request.formData();
		const name = String(data.get('name') ?? '').trim();
		const parent_section_uuid = String(data.get('parent_section_uuid') ?? '').trim() || null;
		const description = String(data.get('description') ?? '').trim() || null;

		if (!name) return fail(400, { message: 'Section name is required' });

		const section = createSection({
			association_uuid: association.uuid,
			name,
			parent_section_uuid,
			description,
		});

		addEntry(
			association.uuid,
			actingAs,
			'section_created',
			'section',
			section.uuid,
			`Created section "${name}"`
		);

		return { success: true, section_uuid: section.uuid };
	},

	updateSection: async ({ request, locals }) => {
		if (!locals.session) return fail(401, { message: 'Not authenticated' });
		const actingAs = locals.session.acting_as_uuid;

		const association = getAssociationByHandle('general-assembly');
		if (!association) return fail(404, { message: 'General Assembly not found' });

		const data = await request.formData();
		const section_uuid = String(data.get('section_uuid') ?? '').trim();
		const name = String(data.get('name') ?? '').trim();
		const parent_section_uuid = String(data.get('parent_section_uuid') ?? '').trim() || null;
		const description = String(data.get('description') ?? '').trim() || null;

		if (!section_uuid) return fail(400, { message: 'Section UUID is required' });
		if (!name) return fail(400, { message: 'Section name is required' });

		updateSection(section_uuid, { name, parent_section_uuid, description });

		addEntry(
			association.uuid,
			actingAs,
			'section_updated',
			'section',
			section_uuid,
			`Updated section "${name}"`
		);

		return { success: true };
	},

	deleteSection: async ({ request, locals }) => {
		if (!locals.session) return fail(401, { message: 'Not authenticated' });
		const actingAs = locals.session.acting_as_uuid;

		const association = getAssociationByHandle('general-assembly');
		if (!association) return fail(404, { message: 'General Assembly not found' });

		const data = await request.formData();
		const section_uuid = String(data.get('section_uuid') ?? '').trim();

		if (!section_uuid) return fail(400, { message: 'Section UUID is required' });

		deleteSection(section_uuid);

		addEntry(
			association.uuid,
			actingAs,
			'section_deleted',
			'section',
			section_uuid,
			'Deleted section'
		);

		return { success: true };
	},

	// --- Role management ---
	createRole: async ({ request, locals }) => {
		if (!locals.session) return fail(401, { message: 'Not authenticated' });
		const actingAs = locals.session.acting_as_uuid;

		const association = getAssociationByHandle('general-assembly');
		if (!association) return fail(404, { message: 'General Assembly not found' });

		const data = await request.formData();
		const title = String(data.get('title') ?? '').trim();
		const section_uuid = String(data.get('section_uuid') ?? '').trim() || null;
		const reports_to_role_uuid = String(data.get('reports_to_role_uuid') ?? '').trim() || null;
		const description = String(data.get('description') ?? '').trim() || null;
		const compensation_franks = data.get('compensation_franks') ? Number(data.get('compensation_franks')) : 0;

		if (!title) return fail(400, { message: 'Role title is required' });

		const role = createRole({
			association_uuid: association.uuid,
			title,
			section_uuid,
			reports_to_role_uuid,
			description,
			compensation_franks,
		});

		addEntry(
			association.uuid,
			actingAs,
			'role_created',
			'role',
			role.uuid,
			`Created role "${title}"`
		);

		return { success: true, role_uuid: role.uuid };
	},

	updateRole: async ({ request, locals }) => {
		if (!locals.session) return fail(401, { message: 'Not authenticated' });
		const actingAs = locals.session.acting_as_uuid;

		const association = getAssociationByHandle('general-assembly');
		if (!association) return fail(404, { message: 'General Assembly not found' });

		const data = await request.formData();
		const role_uuid = String(data.get('role_uuid') ?? '').trim();
		const title = String(data.get('title') ?? '').trim();
		const section_uuid = String(data.get('section_uuid') ?? '').trim() || null;
		const reports_to_role_uuid = String(data.get('reports_to_role_uuid') ?? '').trim() || null;
		const description = String(data.get('description') ?? '').trim() || null;
		const compensation_franks = data.get('compensation_franks') ? Number(data.get('compensation_franks')) : undefined;

		if (!role_uuid) return fail(400, { message: 'Role UUID is required' });
		if (!title) return fail(400, { message: 'Role title is required' });

		updateRole(role_uuid, {
			title,
			section_uuid,
			reports_to_role_uuid,
			description,
			compensation_franks,
		});

		addEntry(
			association.uuid,
			actingAs,
			'role_updated',
			'role',
			role_uuid,
			`Updated role "${title}"`
		);

		return { success: true };
	},

	deleteRole: async ({ request, locals }) => {
		if (!locals.session) return fail(401, { message: 'Not authenticated' });
		const actingAs = locals.session.acting_as_uuid;

		const association = getAssociationByHandle('general-assembly');
		if (!association) return fail(404, { message: 'General Assembly not found' });

		const data = await request.formData();
		const role_uuid = String(data.get('role_uuid') ?? '').trim();

		if (!role_uuid) return fail(400, { message: 'Role UUID is required' });

		deleteRole(role_uuid);

		addEntry(
			association.uuid,
			actingAs,
			'role_deleted',
			'role',
			role_uuid,
			'Deleted role'
		);

		return { success: true };
	}
};
