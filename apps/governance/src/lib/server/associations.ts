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
	name: string;
	level: number | null;
	parent_role_uuid: string | null;
	term_days: number | null;
	description: string | null;
	salary_monthly: number | null;
	daily_rate: number | null;
	created_at: string;
}

export interface OrgSection {
	uuid: string;
	association_uuid: string;
	parent_section_uuid: string | null;
	name: string;
	mandate: string | null;
	created_at: string;
	removed_at: string | null;
}

export interface RolePermission {
	role_uuid: string;
	app: string;
	permission: string;
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
	// Also remove all roles the person held in this association
	db.prepare(
		'UPDATE person_role SET removed_at = ? WHERE association_uuid = ? AND person_uuid = ? AND removed_at IS NULL'
	).run(now(), associationUuid, personUuid);
}

// --- Roles ---

export function getRolesByAssociation(associationUuid: string): Role[] {
	return db
		.prepare('SELECT * FROM role WHERE association_uuid = ? ORDER BY name')
		.all(associationUuid) as Role[];
}

export function getSectionsByAssociation(associationUuid: string): OrgSection[] {
	return db
		.prepare('SELECT * FROM org_section WHERE association_uuid = ? AND removed_at IS NULL ORDER BY name')
		.all(associationUuid) as OrgSection[];
}

export function getSectionByUuid(uuid: string): OrgSection | null {
	return (
		(db
			.prepare('SELECT * FROM org_section WHERE uuid = ?')
			.get(uuid) as OrgSection | undefined) ?? null
	);
}

export function createRole(associationUuid: string, name: string): Role {
	const uuid = randomUUID();
	db.prepare(
		'INSERT INTO role (uuid, association_uuid, name, created_at) VALUES (?, ?, ?, ?)'
	).run(uuid, associationUuid, name, now());
	return db.prepare('SELECT * FROM role WHERE uuid = ?').get(uuid) as Role;
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

// --- Person roles ---

export function getCurrentRolesForPerson(personUuid: string, associationUuid: string): Role[] {
	return db
		.prepare(
			`SELECT r.* FROM role r
			 JOIN person_role pr ON pr.role_uuid = r.uuid
			 WHERE pr.person_uuid = ? AND pr.association_uuid = ? AND pr.removed_at IS NULL`
		)
		.all(personUuid, associationUuid) as Role[];
}

export function assignRole(personUuid: string, roleUuid: string, associationUuid: string): void {
	const existing = db
		.prepare('SELECT removed_at FROM person_role WHERE person_uuid = ? AND role_uuid = ?')
		.get(personUuid, roleUuid) as { removed_at: string | null } | undefined;

	if (existing) {
		if (existing.removed_at === null) return; // already assigned
		db.prepare(
			'UPDATE person_role SET assigned_at = ?, removed_at = NULL WHERE person_uuid = ? AND role_uuid = ?'
		).run(now(), personUuid, roleUuid);
	} else {
		db.prepare(
			'INSERT INTO person_role (person_uuid, role_uuid, association_uuid, assigned_at) VALUES (?, ?, ?, ?)'
		).run(personUuid, roleUuid, associationUuid, now());
	}
}

export function removeRole(personUuid: string, roleUuid: string): void {
	db.prepare(
		'UPDATE person_role SET removed_at = ? WHERE person_uuid = ? AND role_uuid = ? AND removed_at IS NULL'
	).run(now(), personUuid, roleUuid);
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
			 JOIN person_role pr ON pr.role_uuid = rp.role_uuid
			 WHERE pr.person_uuid = ? AND pr.association_uuid = ? AND pr.removed_at IS NULL`
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
