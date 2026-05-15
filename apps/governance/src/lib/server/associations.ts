import { randomUUID } from 'node:crypto';
import { db } from './db.js';

// --- Types ---

export interface Association {
	uuid: string;
	handle: string;
	name: string;
	abbreviation: string | null;
     type: 'society' | 'association' | 'service' | 'college' | 'committee' | 'general_assembly' | 'central_bank' | 'social_insurance_fund' | 'community_bank';
	status: 'active' | 'dissolved';
	governing_document_slug: string | null;
	established_by_motion_uuid: string | null;
	created_at: string;
	dissolved_at: string | null;
}

export interface AssociationMember {
	association_uuid: string;
	person_uuid: string;
	joined_at: string;
	removed_at: string | null;
}

export interface Role {
	uuid: string;
	association_uuid: string;
	section_uuid: string | null;
	template_uuid: string | null;
	title: string;
	description: string | null;
	compensation_franks: number;
	reports_to_role_uuid: string | null;
	created_at: string;
}

export interface OrgSection {
	uuid: string;
	association_uuid: string;
	parent_section_uuid: string | null;
	name: string;
	description: string | null;
	created_at: string;
}

export interface RoleTemplate {
	uuid: string;
	association_uuid: string;
	template_key: string;
	title: string;
	description: string | null;
	compensation_franks: number;
	created_at: string;
}

export interface RoleTemplatePermission {
	template_uuid: string;
	app: string;
	permission: string;
}

export interface RolePermission {
	role_uuid: string;
	app: string;
	permission: string;
}

export interface RoleAssignment {
	uuid: string;
	role_uuid: string;
	person_uuid: string;
	assigned_at: string;
	removed_at: string | null;
}

// --- Helpers ---

function now(): string {
	return new Date().toISOString();
}

// --- Association queries ---

export function getAssociationByUuid(uuid: string): Association | null {
	return (
		(db
			.prepare('SELECT * FROM association WHERE uuid = ?')
			.get(uuid) as Association | undefined) ?? null
	);
}

export function getAssociationByHandle(handle: string): Association | null {
	return (
		(db
			.prepare('SELECT * FROM association WHERE handle = ?')
			.get(handle) as Association | undefined) ?? null
	);
}

export function listAssociations(opts: {
	type?: Association['type'];
	status?: Association['status'];
} = {}): Association[] {
	let query = 'SELECT * FROM association WHERE 1=1';
	const params: string[] = [];
	if (opts.type) { query += ' AND type = ?'; params.push(opts.type); }
	if (opts.status) { query += ' AND status = ?'; params.push(opts.status); }
	query += ' ORDER BY name';
	return db.prepare(query).all(...params) as Association[];
}

// --- Association writes ---

export function createAssociation(input: {
	handle: string;
	name: string;
	abbreviation?: string;
	type: Association['type'];
	established_by_motion_uuid?: string;
	governing_document_slug?: string;
}): Association {
	const handleTaken =
		db.prepare('SELECT 1 FROM person WHERE handle = ?').get(input.handle) ??
		db.prepare('SELECT 1 FROM association WHERE handle = ?').get(input.handle);
	if (handleTaken) throw new Error(`Handle already taken: ${input.handle}`);

	const uuid = randomUUID();
	const createdAt = now();

	db.prepare(
		`INSERT INTO association (uuid, handle, name, abbreviation, type, status, governing_document_slug, established_by_motion_uuid, created_at)
		 VALUES (?, ?, ?, ?, ?, 'active', ?, ?, ?)`
	).run(uuid, input.handle, input.name, input.abbreviation ?? null, input.type, input.governing_document_slug ?? null, input.established_by_motion_uuid ?? null, createdAt);

	return getAssociationByUuid(uuid)!;
}

export function dissolveAssociation(uuid: string): void {
	db.prepare(
		"UPDATE association SET status = 'dissolved', dissolved_at = ? WHERE uuid = ?"
	).run(now(), uuid);
}

export function updateAssociation(uuid: string, input: {
	name?: string;
	governing_document_slug?: string | null;
	status?: 'active' | 'inactive' | 'dissolved';
}): void {
	const updates: string[] = [];
	const params: any[] = [];

	if (input.name !== undefined) {
		updates.push('name = ?');
		params.push(input.name);
	}
	if (input.governing_document_slug !== undefined) {
		updates.push('governing_document_slug = ?');
		params.push(input.governing_document_slug);
	}
	if (input.status !== undefined) {
		updates.push('status = ?');
		params.push(input.status);
		if (input.status === 'dissolved') {
			updates.push('dissolved_at = ?');
			params.push(now());
		}
	}

	if (updates.length === 0) return;

	params.push(uuid);
	db.prepare(`UPDATE association SET ${updates.join(', ')} WHERE uuid = ?`).run(...params);
}

// --- Membership ---

export function getCurrentMembers(associationUuid: string): AssociationMember[] {
	return db
		.prepare(
			'SELECT * FROM association_member WHERE association_uuid = ? AND removed_at IS NULL ORDER BY joined_at'
		)
		.all(associationUuid) as AssociationMember[];
}

export function isMember(associationUuid: string, personUuid: string): boolean {
	return !!db
		.prepare(
			'SELECT 1 FROM association_member WHERE association_uuid = ? AND person_uuid = ? AND removed_at IS NULL'
		)
		.get(associationUuid, personUuid);
}

export function addMember(associationUuid: string, personUuid: string): void {
	// If a prior membership row exists (removed), set removed_at = NULL to reinstate.
	// Otherwise insert a new row.
	const existing = db
		.prepare(
			'SELECT removed_at FROM association_member WHERE association_uuid = ? AND person_uuid = ?'
		)
		.get(associationUuid, personUuid) as { removed_at: string | null } | undefined;

	if (existing) {
		if (existing.removed_at === null) return; // already a member
		db.prepare(
			'UPDATE association_member SET joined_at = ?, removed_at = NULL WHERE association_uuid = ? AND person_uuid = ?'
		).run(now(), associationUuid, personUuid);
	} else {
		db.prepare(
			'INSERT INTO association_member (association_uuid, person_uuid, joined_at) VALUES (?, ?, ?)'
		).run(associationUuid, personUuid, now());
	}
}

export function removeMember(associationUuid: string, personUuid: string): void {
	db.prepare(
		'UPDATE association_member SET removed_at = ? WHERE association_uuid = ? AND person_uuid = ? AND removed_at IS NULL'
	).run(now(), associationUuid, personUuid);
	// Also remove all role assignments the person held in this association
	const roleUuids = db.prepare(
		`SELECT r.uuid FROM role r
		 JOIN role_assignment ra ON ra.role_uuid = r.uuid
		 WHERE r.association_uuid = ? AND ra.person_uuid = ? AND ra.removed_at IS NULL`
	).all(associationUuid, personUuid) as { uuid: string }[];
	
	for (const { uuid } of roleUuids) {
		unassignRole(uuid, personUuid);
	}
}

// --- Roles ---

export function getRolesByAssociation(associationUuid: string): Role[] {
	return db
		.prepare('SELECT * FROM role WHERE association_uuid = ? ORDER BY title')
		.all(associationUuid) as Role[];
}

export function getSectionsByAssociation(associationUuid: string): OrgSection[] {
	return db
		.prepare('SELECT * FROM org_section WHERE association_uuid = ? ORDER BY name')
		.all(associationUuid) as OrgSection[];
}

export function getSectionByUuid(uuid: string): OrgSection | null {
	return (
		(db
			.prepare('SELECT * FROM org_section WHERE uuid = ?')
			.get(uuid) as OrgSection | undefined) ?? null
	);
}

export function createOrgSection(input: {
	association_uuid: string;
	name: string;
	description?: string | null;
	parent_section_uuid?: string | null;
}): OrgSection {
	const uuid = randomUUID();
	db.prepare(
		`INSERT INTO org_section (uuid, association_uuid, parent_section_uuid, name, description, created_at)
		 VALUES (?, ?, ?, ?, ?, ?)`
	).run(
		uuid,
		input.association_uuid,
		input.parent_section_uuid ?? null,
		input.name,
		input.description ?? null,
		now()
	);
	return getSectionByUuid(uuid)!;
}

export function createRole(input: {
	association_uuid: string;
	title: string;
	section_uuid?: string | null;
	template_uuid?: string | null;
	description?: string | null;
	compensation_franks?: number;
	reports_to_role_uuid?: string | null;
}): Role {
	const uuid = randomUUID();
	
	// If template is provided, inherit its values (can be overridden by explicit input)
	let title = input.title;
	let description = input.description ?? null;
	let compensation_franks = input.compensation_franks ?? 0;
	
	if (input.template_uuid) {
		const template = getRoleTemplateByUuid(input.template_uuid);
		if (template) {
			// Use template values as defaults
			if (!input.title || input.title === template.title) title = template.title;
			if (input.description === undefined) description = template.description;
			if (input.compensation_franks === undefined) compensation_franks = template.compensation_franks;
			
			// Copy template permissions if no explicit permissions provided
			const templatePermissions = getRoleTemplatePermissions(input.template_uuid);
			if (templatePermissions.length > 0) {
				// Will be set after role creation
			}
		}
	}
	
	db.prepare(
		`INSERT INTO role (uuid, association_uuid, section_uuid, template_uuid, title, description, compensation_franks, reports_to_role_uuid, created_at)
		 VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
	).run(
		uuid,
		input.association_uuid,
		input.section_uuid ?? null,
		input.template_uuid ?? null,
		title,
		description,
		compensation_franks,
		input.reports_to_role_uuid ?? null,
		now()
	);
	
	// Copy template permissions if template was used
	if (input.template_uuid) {
		const templatePermissions = getRoleTemplatePermissions(input.template_uuid);
		if (templatePermissions.length > 0) {
			const insert = db.prepare('INSERT INTO role_permission (role_uuid, app, permission) VALUES (?, ?, ?)');
			for (const p of templatePermissions) {
				insert.run(uuid, p.app, p.permission);
			}
		}
	}
	
	return db.prepare('SELECT * FROM role WHERE uuid = ?').get(uuid) as Role;
}

export function getRoleByUuid(uuid: string): Role | null {
	return (
		(db
			.prepare('SELECT * FROM role WHERE uuid = ?')
			.get(uuid) as Role | undefined) ?? null
	);
}

export function updateRole(uuid: string, input: {
	title?: string;
	section_uuid?: string | null;
	reports_to_role_uuid?: string | null;
	description?: string | null;
	compensation_franks?: number;
}): void {
	const updates: string[] = [];
	const params: any[] = [];

	if (input.title !== undefined) {
		updates.push('title = ?');
		params.push(input.title);
	}
	if (input.section_uuid !== undefined) {
		updates.push('section_uuid = ?');
		params.push(input.section_uuid);
	}
	if (input.reports_to_role_uuid !== undefined) {
		updates.push('reports_to_role_uuid = ?');
		params.push(input.reports_to_role_uuid);
	}
	if (input.description !== undefined) {
		updates.push('description = ?');
		params.push(input.description);
	}
	if (input.compensation_franks !== undefined) {
		updates.push('compensation_franks = ?');
		params.push(input.compensation_franks);
	}

	if (updates.length === 0) return;

	params.push(uuid);
	db.prepare(`UPDATE role SET ${updates.join(', ')} WHERE uuid = ?`).run(...params);
}

export function deleteRole(uuid: string): void {
	// Role assignments and permissions will cascade delete
	db.prepare('DELETE FROM role WHERE uuid = ?').run(uuid);
}

// --- Sections ---

export function createSection(input: {
	association_uuid: string;
	name: string;
	parent_section_uuid?: string | null;
	description?: string | null;
}): OrgSection {
	const uuid = randomUUID();
	db.prepare(
		`INSERT INTO org_section (uuid, association_uuid, parent_section_uuid, name, description, created_at)
		 VALUES (?, ?, ?, ?, ?, ?)`
	).run(
		uuid,
		input.association_uuid,
		input.parent_section_uuid ?? null,
		input.name,
		input.description ?? null,
		now()
	);
	return getSectionByUuid(uuid)!;
}

export function updateSection(uuid: string, input: {
	name?: string;
	parent_section_uuid?: string | null;
	description?: string | null;
}): void {
	const updates: string[] = [];
	const params: any[] = [];

	if (input.name !== undefined) {
		updates.push('name = ?');
		params.push(input.name);
	}
	if (input.parent_section_uuid !== undefined) {
		updates.push('parent_section_uuid = ?');
		params.push(input.parent_section_uuid);
	}
	if (input.description !== undefined) {
		updates.push('description = ?');
		params.push(input.description);
	}

	if (updates.length === 0) return;

	params.push(uuid);
	db.prepare(`UPDATE org_section SET ${updates.join(', ')} WHERE uuid = ?`).run(...params);
}

export function deleteSection(uuid: string): void {
	// Hard delete section - ensure no roles reference it first
	db.prepare('UPDATE role SET section_uuid = NULL WHERE section_uuid = ?').run(uuid);
	// Delete child sections recursively
	const children = db.prepare('SELECT uuid FROM org_section WHERE parent_section_uuid = ?').all(uuid) as { uuid: string }[];
	for (const child of children) {
		deleteSection(child.uuid);
	}
	// Delete this section
	db.prepare('DELETE FROM org_section WHERE uuid = ?').run(uuid);
}

// --- Role permissions ---

export function getPermissionsForRole(roleUuid: string): RolePermission[] {
	return db
		.prepare('SELECT * FROM role_permission WHERE role_uuid = ?')
		.all(roleUuid) as RolePermission[];
}

export function setRolePermissions(roleUuid: string, permissions: Omit<RolePermission, 'role_uuid'>[]): void {
	db.transaction(() => {
		db.prepare('DELETE FROM role_permission WHERE role_uuid = ?').run(roleUuid);
		const insert = db.prepare(
			'INSERT INTO role_permission (role_uuid, app, permission) VALUES (?, ?, ?)'
		);
		for (const p of permissions) {
			insert.run(roleUuid, p.app, p.permission);
		}
	})();
}

// --- Role Templates ---

export function createRoleTemplate(input: {
	association_uuid: string;
	template_key: string;
	title: string;
	description?: string | null;
	compensation_franks?: number;
}): RoleTemplate {
	const uuid = randomUUID();
	db.prepare(
		`INSERT INTO role_template (uuid, association_uuid, template_key, title, description, compensation_franks, created_at)
		 VALUES (?, ?, ?, ?, ?, ?, ?)`
	).run(
		uuid,
		input.association_uuid,
		input.template_key,
		input.title,
		input.description ?? null,
		input.compensation_franks ?? 0,
		now()
	);
	return getRoleTemplateByUuid(uuid)!;
}

export function getRoleTemplateByUuid(uuid: string): RoleTemplate | null {
	return (
		(db.prepare('SELECT * FROM role_template WHERE uuid = ?').get(uuid) as RoleTemplate | undefined) ?? null
	);
}

export function getRoleTemplatesByAssociation(associationUuid: string): RoleTemplate[] {
	return db
		.prepare('SELECT * FROM role_template WHERE association_uuid = ? ORDER BY title')
		.all(associationUuid) as RoleTemplate[];
}

export function getRoleTemplatePermissions(templateUuid: string): RoleTemplatePermission[] {
	return db
		.prepare('SELECT * FROM role_template_permission WHERE template_uuid = ?')
		.all(templateUuid) as RoleTemplatePermission[];
}

export function setRoleTemplatePermissions(
	templateUuid: string,
	permissions: Omit<RoleTemplatePermission, 'template_uuid'>[]
): void {
	db.transaction(() => {
		db.prepare('DELETE FROM role_template_permission WHERE template_uuid = ?').run(templateUuid);
		const insert = db.prepare(
			'INSERT INTO role_template_permission (template_uuid, app, permission) VALUES (?, ?, ?)'
		);
		for (const p of permissions) {
			insert.run(templateUuid, p.app, p.permission);
		}
	})();
}

export function deleteRoleTemplate(uuid: string): void {
	// Permissions will cascade delete
	db.prepare('DELETE FROM role_template WHERE uuid = ?').run(uuid);
}

// --- Role Assignments ---

export function getCurrentRolesForPerson(personUuid: string, associationUuid: string): Role[] {
	return db
		.prepare(
			`SELECT r.* FROM role r
			 JOIN role_assignment ra ON ra.role_uuid = r.uuid
			 WHERE ra.person_uuid = ? AND r.association_uuid = ? AND ra.removed_at IS NULL`
		)
		.all(personUuid, associationUuid) as Role[];
}

export function getRoleAssignment(roleUuid: string): RoleAssignment | null {
	return (
		(db
			.prepare('SELECT * FROM role_assignment WHERE role_uuid = ? AND removed_at IS NULL')
			.get(roleUuid) as RoleAssignment | undefined) ?? null
	);
}

export function getVacantRoles(associationUuid: string): Role[] {
	return db
		.prepare(
			`SELECT r.* FROM role r
			 LEFT JOIN role_assignment ra ON ra.role_uuid = r.uuid AND ra.removed_at IS NULL
			 WHERE r.association_uuid = ? AND ra.uuid IS NULL
			 ORDER BY r.title`
		)
		.all(associationUuid) as Role[];
}

export function assignRole(roleUuid: string, personUuid: string): void {
	// Check if role is already assigned to someone
	const currentAssignment = getRoleAssignment(roleUuid);
	if (currentAssignment) {
		if (currentAssignment.person_uuid === personUuid) return; // already assigned to this person
		throw new Error('Role is already assigned to another person');
	}

	// Check if there was a previous assignment for this person/role
	const existing = db
		.prepare('SELECT uuid, removed_at FROM role_assignment WHERE person_uuid = ? AND role_uuid = ?')
		.get(personUuid, roleUuid) as { uuid: string; removed_at: string | null } | undefined;

	if (existing) {
		if (existing.removed_at === null) return; // already assigned
		db.prepare(
			'UPDATE role_assignment SET assigned_at = ?, removed_at = NULL WHERE uuid = ?'
		).run(now(), existing.uuid);
	} else {
		const uuid = randomUUID();
		db.prepare(
			'INSERT INTO role_assignment (uuid, role_uuid, person_uuid, assigned_at) VALUES (?, ?, ?, ?)'
		).run(uuid, roleUuid, personUuid, now());
	}
}

export function unassignRole(roleUuid: string, personUuid: string): void {
	db.prepare(
		'UPDATE role_assignment SET removed_at = ? WHERE person_uuid = ? AND role_uuid = ? AND removed_at IS NULL'
	).run(now(), personUuid, roleUuid);
}

// --- Budget Calculation ---

export function calculateBudget(associationUuid: string): number {
	const result = db
		.prepare(
			`SELECT SUM(compensation_franks) as total
			 FROM role
			 WHERE association_uuid = ?`
		)
		.get(associationUuid) as { total: number | null };
	return result.total ?? 0;
}

// --- Permission resolution ---
// Used at session time to build the permissions claim for the OIDC token.

export function resolvePermissions(
	personUuid: string,
	associationUuid: string
): RolePermission[] {
	return db
		.prepare(
			`SELECT DISTINCT rp.app, rp.permission, rp.role_uuid
			 FROM role_permission rp
			 JOIN role r ON r.uuid = rp.role_uuid
			 JOIN role_assignment ra ON ra.role_uuid = r.uuid
			 WHERE ra.person_uuid = ? AND r.association_uuid = ? AND ra.removed_at IS NULL`
		)
		.all(personUuid, associationUuid) as RolePermission[];
}

// --- Sortition body config ---

export interface SortitionBodyConfig {
	association_uuid: string;
	seat_count: number;
	term_days: number;
	is_permanent: 0 | 1;
	source_college_uuid: string | null;
}

export function getSortitionConfig(associationUuid: string): SortitionBodyConfig | null {
	return (
		(db
			.prepare('SELECT * FROM sortition_body_config WHERE association_uuid = ?')
			.get(associationUuid) as SortitionBodyConfig | undefined) ?? null
	);
}

export function setSortitionConfig(input: {
	association_uuid: string;
	seat_count: number;
	term_days: number;
	is_permanent?: 0 | 1;
	source_college_uuid?: string | null;
}): SortitionBodyConfig {
	const { association_uuid, seat_count, term_days, is_permanent = 1, source_college_uuid = null } = input;
	db.prepare(
		`INSERT INTO sortition_body_config (association_uuid, seat_count, term_days, is_permanent, source_college_uuid)
		 VALUES (?, ?, ?, ?, ?)
		 ON CONFLICT(association_uuid) DO UPDATE SET
		   seat_count = excluded.seat_count,
		   term_days = excluded.term_days,
		   is_permanent = excluded.is_permanent,
		   source_college_uuid = excluded.source_college_uuid`
	).run(association_uuid, seat_count, term_days, is_permanent, source_college_uuid);
	return getSortitionConfig(association_uuid)!;
}
