// ============================================================================
// Roles and Role Assignments
// ============================================================================
// Functions for managing roles (org chart positions) and assigning people to them

import { randomUUID } from 'node:crypto';
import { db } from '../db.js';
import type { Role, RolePermission, RoleAssignment } from './types.js';
import { getRoleTemplateByUuid, getRoleTemplatePermissions } from './role-templates.js';

function now(): string {
	return new Date().toISOString();
}

// ============================================================================
// Role CRUD
// ============================================================================

/**
 * Get a role by UUID
 */
export function getRoleByUuid(uuid: string): Role | null {
	return (
		(db
			.prepare('SELECT * FROM role WHERE uuid = ?')
			.get(uuid) as Role | undefined) ?? null
	);
}

/**
 * Get all roles for an association
 */
export function getRolesByAssociation(associationUuid: string): Role[] {
	return db
		.prepare('SELECT * FROM role WHERE association_uuid = ? ORDER BY title')
		.all(associationUuid) as Role[];
}

/**
 * Create a new role
 * If template_uuid is provided, inherits values from the template
 */
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

/**
 * Update an existing role
 */
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

/**
 * Delete a role (assignments and permissions cascade delete)
 */
export function deleteRole(uuid: string): void {
	// Role assignments and permissions will cascade delete
	db.prepare('DELETE FROM role WHERE uuid = ?').run(uuid);
}

// ============================================================================
// Role Permissions
// ============================================================================

/**
 * Get permissions for a specific role
 */
export function getPermissionsForRole(roleUuid: string): RolePermission[] {
	return db
		.prepare('SELECT * FROM role_permission WHERE role_uuid = ?')
		.all(roleUuid) as RolePermission[];
}

/**
 * Set permissions for a role (replaces existing)
 */
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

// ============================================================================
// Role Assignments
// ============================================================================

/**
 * Get the current assignment for a role (if any)
 */
export function getRoleAssignment(roleUuid: string): RoleAssignment | null {
	return (
		(db
			.prepare('SELECT * FROM role_assignment WHERE role_uuid = ? AND removed_at IS NULL')
			.get(roleUuid) as RoleAssignment | undefined) ?? null
	);
}

/**
 * Get all current roles held by a person in an association
 */
export function getCurrentRolesForPerson(personUuid: string, associationUuid: string): Role[] {
	return db
		.prepare(
			`SELECT r.* FROM role r
			 JOIN role_assignment ra ON ra.role_uuid = r.uuid
			 WHERE ra.person_uuid = ? AND r.association_uuid = ? AND ra.removed_at IS NULL`
		)
		.all(personUuid, associationUuid) as Role[];
}

/**
 * Get all vacant (unassigned) roles in an association
 */
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

/**
 * Assign a role to a person
 * Throws error if role is already assigned to someone else
 */
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

/**
 * Unassign a role from a person
 */
export function unassignRole(roleUuid: string, personUuid: string): void {
	db.prepare(
		'UPDATE role_assignment SET removed_at = ? WHERE person_uuid = ? AND role_uuid = ? AND removed_at IS NULL'
	).run(now(), personUuid, roleUuid);
}

// ============================================================================
// Budget Calculation
// ============================================================================

/**
 * Calculate total compensation budget for an association
 */
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
