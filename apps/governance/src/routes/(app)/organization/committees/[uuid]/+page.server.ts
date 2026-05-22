import { error, fail, redirect } from '@sveltejs/kit';
import type { PageServerLoad, Actions } from './$types.js';
import {
	getAssociationByUuid,
	getCurrentMembers,
	getRolesByAssociation,
	getSectionsByAssociation,
	getSortitionConfig,
	assignRole,
	unassignRole,
	getPermissionsForRole,
	applyOrgChartTemplate,
	createSection,
	updateSection,
	deleteSection,
	createRole,
	updateRole,
	deleteRole,
} from '$lib/server/organization/associations.js';
import * as bulletin from '$lib/server/communications/bulletin.js';
import { getCurrentTermHolders, listSortitions, vacateSeatTerm } from '$lib/server/organization/sortition.js';
import { hasPermission, PERMISSIONS } from '$lib/server/infrastructure/permissions.js';
import { addEntry, getBodyRecord } from '$lib/server/communications/record.js';
import { audit } from '$lib/server/documents/audit.js';
import { listEnactedMotions, getMotionByUuid, listMotions, getComments, createMotion } from '$lib/server/governance/motions.js';
import { listDeliberationRules, getDeliberationRuleByUuid } from '$lib/server/governance/deliberation-rules.js';
import { getVoteRuleByUuid } from '$lib/server/governance/vote-rules.js';
import { getDocumentBySlug, listOrgChartDocuments } from '$lib/server/documents/society-docs.js';
import { listVoteSessions, getSessionTally } from '$lib/server/governance/vote-sessions.js';
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

	// Resolve source college name if set
	const sourceCollege = config?.source_college_uuid
		? (db.prepare('SELECT name FROM association WHERE uuid = ?').get(config.source_college_uuid) as { name: string } | undefined)
		: null;

	// Get all motions for this body (docket)
	const allMotions = listMotions({ bodyUuid: association.uuid });

	// Get all vote sessions for motions in this body
	const motionUuids = allMotions.map(m => m.uuid);
	const allVoteSessions = motionUuids.length > 0
		? db.prepare(`
			SELECT 
				vs.*,
				li.title as motion_title,
				li.slug as motion_slug
			FROM vote_session vs
			JOIN library_item li ON li.uuid = vs.motion_uuid
			WHERE vs.motion_uuid IN (${motionUuids.map(() => '?').join(',')})
			ORDER BY vs.opens_at DESC
		`).all(...motionUuids) as any[]
		: [];

	// Enrich vote sessions with tally data
	const voteSessions = allVoteSessions.map(vs => {
		const tally = getSessionTally(vs.uuid);
		return { ...vs, tally };
	});

	const canCreateMotion = actingAs
		? hasPermission(actingAs, PERMISSIONS.MOTIONS_CREATE, association.uuid)
		: false;

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

	// Load governing document if slug is set
	const governingDocument = association.governing_document_slug
		? getDocumentBySlug(association.governing_document_slug)
		: null;

	// Load available org chart templates
	const orgChartTemplates = listOrgChartDocuments();

	// Load bulletin posts
	const actorUuid = locals.session?.person_uuid ?? null;
	const bulletinPosts = actorUuid ? bulletin.getAssociationPosts(association.uuid, actorUuid) : [];

	return {
		association,
		config,
		sourceCollege: sourceCollege ?? null,
		termHolders,
		draws,
		allMotions,
		voteSessions,
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
		governingDocument,
		orgChartTemplates,
		bulletinPosts
	};
};

export const actions: Actions = {
	create: async ({ request, locals, params }) => {
		if (!locals.session) return fail(401, { message: 'Not authenticated' });
		const actingAs = locals.session.acting_as_uuid;

		const association = getAssociationByUuid(params.uuid);
		if (!association) return fail(404, { message: 'Committee not found' });

		// Check permissions
		if (!hasPermission(actingAs, PERMISSIONS.MOTIONS_CREATE, association.uuid)) {
			return fail(403, { message: 'Not authorized to create motions' });
		}

		const data = await request.formData();
		const title = String(data.get('title') ?? '').trim();
		const body = String(data.get('body') ?? '').trim();
		const reasoning = String(data.get('reasoning') ?? '').trim() || null;
		const deliberation_rule_uuid = String(data.get('deliberation_rule_uuid') ?? '').trim() || null;
		const vote_rule_uuid = String(data.get('vote_rule_uuid') ?? '').trim() || null;

		if (!title) return fail(400, { message: 'Title is required' });
		if (!body) return fail(400, { message: 'Motion text is required' });

		// Fetch rule names if UUIDs provided
		const deliberation_rule_name = deliberation_rule_uuid
			? getDeliberationRuleByUuid(deliberation_rule_uuid)?.name
			: undefined;
		const vote_rule_name = vote_rule_uuid
			? getVoteRuleByUuid(vote_rule_uuid)?.name
			: undefined;

		const motion = createMotion({
			title,
			body,
			reasoning,
			introduced_by_uuid: actingAs,
			body_uuid: association.uuid,
			body_name: association.name,
			deliberation_rule_uuid,
			deliberation_rule_name,
			vote_rule_uuid,
			vote_rule_name,
		});

		return { created: motion.uuid };
	},

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

assignRole(role_uuid, person_uuid);

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

unassignRole(role_uuid, person_uuid);

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

	applyTemplate: async ({ request, locals, params }) => {
		if (!locals.session) return fail(401, { message: 'Not authenticated' });
		const actingAs = locals.session.acting_as_uuid;

		const association = getAssociationByUuid(params.uuid);
		if (!association) return fail(404, { message: 'Committee not found' });

		// Check permissions - need to be able to create/manage roles
		if (!hasPermission(actingAs, PERMISSIONS.ROLES_ASSIGN, association.uuid)) {
			return fail(403, { message: 'Not authorized to apply templates' });
		}

		const data = await request.formData();
		const templateSlug = String(data.get('template_slug') ?? '').trim();

		if (!templateSlug) return fail(400, { message: 'Template must be selected' });

		try {
			const result = applyOrgChartTemplate(association.uuid, templateSlug);
			
			if (!result) {
				return fail(400, { message: 'Failed to apply template - template not found' });
			}

			// Log to record
			addEntry(
				params.uuid,
				actingAs,
				'template_applied',
				'association',
				params.uuid,
				`Applied org chart template "${templateSlug}" - created ${result.sections.size} sections, ${result.templates.size} templates, and ${result.roles.size} roles.`
			);

			audit(actingAs, 'org_chart.apply_template', 'association', params.uuid,
				`Applied template ${templateSlug}`);

			return { success: true, message: 'Template applied successfully' };
		} catch (err) {
			console.error('Error applying template:', err);
			return fail(500, { message: 'Failed to apply template' });
		}
	},

	createSection: async ({ request, locals, params }) => {
		if (!locals.session) return fail(401, { message: 'Not authenticated' });
		const actingAs = locals.session.acting_as_uuid;

		const association = getAssociationByUuid(params.uuid);
		if (!association) return fail(404, { message: 'Association not found' });

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

	updateSection: async ({ request, locals, params }) => {
		if (!locals.session) return fail(401, { message: 'Not authenticated' });
		const actingAs = locals.session.acting_as_uuid;

		const association = getAssociationByUuid(params.uuid);
		if (!association) return fail(404, { message: 'Association not found' });

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

	deleteSection: async ({ request, locals, params }) => {
		if (!locals.session) return fail(401, { message: 'Not authenticated' });
		const actingAs = locals.session.acting_as_uuid;

		const association = getAssociationByUuid(params.uuid);
		if (!association) return fail(404, { message: 'Association not found' });

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

	createRole: async ({ request, locals, params }) => {
		if (!locals.session) return fail(401, { message: 'Not authenticated' });
		const actingAs = locals.session.acting_as_uuid;

		const association = getAssociationByUuid(params.uuid);
		if (!association) return fail(404, { message: 'Association not found' });

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

	updateRole: async ({ request, locals, params }) => {
		if (!locals.session) return fail(401, { message: 'Not authenticated' });
		const actingAs = locals.session.acting_as_uuid;

		const association = getAssociationByUuid(params.uuid);
		if (!association) return fail(404, { message: 'Association not found' });

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

	deleteRole: async ({ request, locals, params }) => {
		if (!locals.session) return fail(401, { message: 'Not authenticated' });
		const actingAs = locals.session.acting_as_uuid;

		const association = getAssociationByUuid(params.uuid);
		if (!association) return fail(404, { message: 'Association not found' });

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
	},

	createBulletinPost: async ({ request, locals, params }) => {
		const session = locals.session;
		if (!session) return fail(401, { error: 'Not authenticated' });

		const data = await request.formData();
		const title = data.get('title');
		const body = data.get('body');
		const visibility = data.get('visibility') as 'public' | 'members_only' | 'officers_only' | null;
		const category = data.get('category') as 'announcement' | 'discussion' | 'question' | 'event' | 'policy' | null;

		if (!title || typeof title !== 'string' || title.trim().length === 0) {
			return fail(400, { error: 'Title is required' });
		}

		if (!body || typeof body !== 'string' || body.trim().length === 0) {
			return fail(400, { error: 'Body is required' });
		}

		try {
			bulletin.createPost({
				author_uuid: session.person_uuid,
				association_uuid: params.uuid,
				title: title,
				body: body,
				visibility: visibility ?? 'members_only',
				category: category ?? 'discussion',
			});
			return { success: true };
		} catch (err) {
			return fail(500, { error: 'Failed to create post' });
		}
	},
};
