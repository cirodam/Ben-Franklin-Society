import { error, redirect, fail } from '@sveltejs/kit';
import type { PageServerLoad, Actions } from './$types.js';
import {
	getAssociationByUuid,
	getCurrentMembers,
	getRolesByAssociation,
	getSectionsByAssociation,
	createRole,
	assignRole as assignRoleToMember,
	unassignRole,
	getPermissionsForRole,
	getRoleTemplatesByAssociation,
	createRoleTemplate,
	deleteRoleTemplate,
	getRoleTemplatePermissions,
	setRoleTemplatePermissions,
	getVacantRoles,
	calculateBudget,
} from '$lib/server/associations.js';
import { hasPermission, PERMISSIONS } from '$lib/server/permissions.js';
import { addEntry } from '$lib/server/record.js';
import { audit } from '$lib/server/audit.js';
import { listEnactedMotions, getMotionByUuid } from '$lib/server/motions.js';
import { db } from '$lib/server/db.js';

export const load: PageServerLoad = async ({ params, locals }) => {
	const association = getAssociationByUuid(params.uuid);
	if (!association) error(404, 'Association not found');

	// Redirect to canonical routes for typed pages
	const canonicalRoutes: Record<string, string> = {
		general_assembly:      '/general-assembly',
		central_bank:          '/central-bank',
		social_insurance_fund: '/social-insurance',
		community_bank:        '/community-bank',
		service:               `/services/${params.uuid}`,
		committee:             `/committees/${params.uuid}`,
		college:               `/colleges/${params.uuid}`,
	};
	if (canonicalRoutes[association.type]) {
		redirect(302, canonicalRoutes[association.type]);
	}

	const actingAs = locals.session?.acting_as_uuid ?? null;
	const canAssign = actingAs
		? hasPermission(actingAs, PERMISSIONS.ROLES_ASSIGN, association.uuid)
		: false;

	const members = getCurrentMembers(association.uuid);
	const roles = getRolesByAssociation(association.uuid);
	const sections = getSectionsByAssociation(association.uuid);

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
		holders: Array<{ uuid: string; handle: string; given_name: string; family_name: string }>;
		children: RoleWithChildren[];
	}

	const roleMap = new Map<string, RoleWithChildren>();
	const rootRoles: RoleWithChildren[] = [];

	// First pass: create all role objects
	for (const role of enrichedRoles) {
		roleMap.set(role.uuid, {
			uuid: role.uuid,
			title: role.title,
			section_name: role.section_name,
			compensation_franks: role.compensation_franks,
			holders: role.holders,
			children: []
		});
	}

	// Second pass: build hierarchy
	for (const role of enrichedRoles) {
		const roleNode = roleMap.get(role.uuid)!;
		const parentUuid = role.reports_to_role_uuid;
		
		if (parentUuid && roleMap.has(parentUuid)) {
			roleMap.get(parentUuid)!.children.push(roleNode);
		} else {
			rootRoles.push(roleNode);
		}
	}

	// Sort children by title
	const sortRoles = (roles: RoleWithChildren[]) => {
		roles.sort((a, b) => a.title.localeCompare(b.title));
		roles.forEach(r => sortRoles(r.children));
	};
	sortRoles(rootRoles);

	// Pull person details for current members
	const memberDetails = members.map((m) => {
		const person = db
			.prepare('SELECT uuid, handle, given_name, family_name FROM person WHERE uuid = ?')
			.get(m.person_uuid) as { uuid: string; handle: string; given_name: string; family_name: string } | undefined;
		return { ...m, person: person ?? null };
	});

	// Motions where this association is the body
	const motions = db
		.prepare(`SELECT uuid, title, status, created_at FROM motion WHERE body_uuid = ? ORDER BY created_at DESC LIMIT 10`)
		.all(association.uuid) as { uuid: string; title: string; status: string; created_at: string }[];

	const enactedMotions = canAssign ? listEnactedMotions() : [];
	
	const templates = getRoleTemplatesByAssociation(params.uuid);
	const vacantRoles = getVacantRoles(params.uuid);
	const budgetTotal = calculateBudget(params.uuid);

	return {
		association,
		members: memberDetails,
		roles: enrichedRoles,
		roleHierarchy: rootRoles,
		sections,
		motions,
		canAssign,
		enactedMotions,
		templates,
		vacantRoles,
		budgetTotal
	};
};

export const actions: Actions = {
	createRole: async ({ request, locals, params }) => {
		if (!locals.session) return fail(401, { message: 'Not authenticated' });
		const actingAs = locals.session.acting_as_uuid;
		const data = await request.formData();
		const title = String(data.get('title') ?? '').trim();

		if (!title) return fail(400, { message: 'Missing role title' });
		if (!hasPermission(actingAs, PERMISSIONS.ROLES_ASSIGN, params.uuid)) {
			return fail(403, { message: 'Forbidden' });
		}

		const role = createRole({
			association_uuid: params.uuid,
			title,
			compensation_franks: 0
		});
		addEntry(
			params.uuid,
			actingAs,
			'role_created',
			'role',
			role.uuid,
			`Role "${title}" created.`
		);
		audit(actingAs, 'role.create', 'role', role.uuid, `Role "${title}" created in association ${params.uuid}`);
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

assignRoleToMember(role_uuid, person_uuid);

		const person = db
			.prepare('SELECT handle FROM person WHERE uuid = ?')
			.get(person_uuid) as { handle: string } | undefined;
		const role = db
			.prepare('SELECT title FROM role WHERE uuid = ?')
			.get(role_uuid) as { title: string } | undefined;

		addEntry(
			params.uuid,
			actingAs,
			'role_assigned',
			'role',
			role_uuid,
			`@${person?.handle ?? person_uuid} assigned role "${role?.title ?? role_uuid}".`
		);
		audit(actingAs, 'role.assign', 'person', person_uuid,
			`@${person?.handle ?? person_uuid} assigned role "${role?.title ?? role_uuid}"`, motion_uuid);
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

unassignRole(role_uuid, person_uuid);

		const person = db
			.prepare('SELECT handle FROM person WHERE uuid = ?')
			.get(person_uuid) as { handle: string } | undefined;
		const role = db
			.prepare('SELECT title FROM role WHERE uuid = ?')
			.get(role_uuid) as { title: string } | undefined;

		addEntry(
			params.uuid,
			actingAs,
			'role_revoked',
			'role',
			role_uuid,
			`@${person?.handle ?? person_uuid} removed from role "${role?.title ?? role_uuid}".`
		);
		audit(actingAs, 'role.revoke', 'person', person_uuid,
			`@${person?.handle ?? person_uuid} removed from role "${role?.title ?? role_uuid}"`, motion_uuid);
		return { success: true };
	},

	createTemplate: async ({ request, locals, params }) => {
		if (!locals.session) return fail(401, { message: 'Not authenticated' });
		const actingAs = locals.session.acting_as_uuid;
		const data = await request.formData();
		
		if (!hasPermission(actingAs, PERMISSIONS.ROLES_ASSIGN, params.uuid)) {
			return fail(403, { message: 'Forbidden' });
		}

		const template_key = String(data.get('template_key') ?? '').trim();
		const title = String(data.get('title') ?? '').trim();
		const description = String(data.get('description') ?? '').trim() || null;
		const compensation_franks = parseInt(String(data.get('compensation_franks') ?? '0'));

		if (!template_key || !title) {
			return fail(400, { message: 'Missing required fields' });
		}

		const template = createRoleTemplate({
			association_uuid: params.uuid,
			template_key,
			title,
			description,
			compensation_franks
		});

		addEntry(
			params.uuid,
			actingAs,
			'template_created',
			'role_template',
			template.uuid,
			`Role template "${title}" (${template_key}) created.`
		);
		audit(actingAs, 'template.create', 'role_template', template.uuid, `Template "${title}" created`);
		return { success: true };
	},

	updateTemplate: async ({ request, locals, params }) => {
		if (!locals.session) return fail(401, { message: 'Not authenticated' });
		const actingAs = locals.session.acting_as_uuid;
		const data = await request.formData();
		
		if (!hasPermission(actingAs, PERMISSIONS.ROLES_ASSIGN, params.uuid)) {
			return fail(403, { message: 'Forbidden' });
		}

		const uuid = String(data.get('uuid') ?? '').trim();
		const title = String(data.get('title') ?? '').trim();
		const description = String(data.get('description') ?? '').trim() || null;
		const compensation_franks = parseInt(String(data.get('compensation_franks') ?? '0'));

		if (!uuid || !title) {
			return fail(400, { message: 'Missing required fields' });
		}

		db.prepare(
			'UPDATE role_template SET title = ?, description = ?, compensation_franks = ? WHERE uuid = ?'
		).run(title, description, compensation_franks, uuid);

		addEntry(
			params.uuid,
			actingAs,
			'template_updated',
			'role_template',
			uuid,
			`Role template "${title}" updated.`
		);
		audit(actingAs, 'template.update', 'role_template', uuid, `Template "${title}" updated`);
		return { success: true };
	},

	deleteTemplate: async ({ request, locals, params }) => {
		if (!locals.session) return fail(401, { message: 'Not authenticated' });
		const actingAs = locals.session.acting_as_uuid;
		const data = await request.formData();
		
		if (!hasPermission(actingAs, PERMISSIONS.ROLES_ASSIGN, params.uuid)) {
			return fail(403, { message: 'Forbidden' });
		}

		const uuid = String(data.get('uuid') ?? '').trim();
		if (!uuid) {
			return fail(400, { message: 'Missing template UUID' });
		}

		deleteRoleTemplate(uuid);

		addEntry(
			params.uuid,
			actingAs,
			'template_deleted',
			'role_template',
			uuid,
			'Role template deleted.'
		);
		audit(actingAs, 'template.delete', 'role_template', uuid, 'Template deleted');
		return { success: true };
	},

	setTemplatePermissions: async ({ request, locals, params }) => {
		if (!locals.session) return fail(401, { message: 'Not authenticated' });
		const actingAs = locals.session.acting_as_uuid;
		const data = await request.formData();
		
		if (!hasPermission(actingAs, PERMISSIONS.ROLES_ASSIGN, params.uuid)) {
			return fail(403, { message: 'Forbidden' });
		}

		const template_uuid = String(data.get('template_uuid') ?? '').trim();
		const app = String(data.get('app') ?? '').trim();
		const permission = String(data.get('permission') ?? '').trim();

		if (!template_uuid || !app || !permission) {
			return fail(400, { message: 'Missing required fields' });
		}

		// Get existing permissions
		const existingPermissions = getRoleTemplatePermissions(template_uuid);
		
		// Add the new permission
		const updatedPermissions = [...existingPermissions, { app, permission }];
		
		setRoleTemplatePermissions(template_uuid, updatedPermissions);

		addEntry(
			params.uuid,
			actingAs,
			'template_permission_added',
			'role_template',
			template_uuid,
			`Permission ${app}:${permission} added to template.`
		);
		audit(actingAs, 'template.permission.add', 'role_template', template_uuid, `Permission ${app}:${permission} added`);
		return { success: true };
	},
};
