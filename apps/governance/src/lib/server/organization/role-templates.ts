// ============================================================================
// Role Templates
// ============================================================================
// Functions for managing reusable role definitions with permissions

import { randomUUID } from 'node:crypto';
import { db } from '../db.js';
import type { RoleTemplate, RoleTemplatePermission } from './types.js';

function now(): string {
	return new Date().toISOString();
}

/**
 * Get a role template by UUID
 */
export function getRoleTemplateByUuid(uuid: string): RoleTemplate | null {
	return (
		(db.prepare('SELECT * FROM role_template WHERE uuid = ?').get(uuid) as RoleTemplate | undefined) ?? null
	);
}

/**
 * Get all role templates for an association
 */
export function getRoleTemplatesByAssociation(associationUuid: string): RoleTemplate[] {
	return db
		.prepare('SELECT * FROM role_template WHERE association_uuid = ? ORDER BY title')
		.all(associationUuid) as RoleTemplate[];
}

/**
 * Create a new role template
 */
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

/**
 * Delete a role template (permissions cascade delete)
 */
export function deleteRoleTemplate(uuid: string): void {
	// Permissions will cascade delete
	db.prepare('DELETE FROM role_template WHERE uuid = ?').run(uuid);
}

/**
 * Get permissions for a role template
 */
export function getRoleTemplatePermissions(templateUuid: string): RoleTemplatePermission[] {
	return db
		.prepare('SELECT * FROM role_template_permission WHERE template_uuid = ?')
		.all(templateUuid) as RoleTemplatePermission[];
}

/**
 * Set permissions for a role template (replaces existing)
 */
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
