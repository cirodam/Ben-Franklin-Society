// ============================================================================
// Association Management
// ============================================================================
// Core association CRUD operations and centralized re-exports

import { randomUUID } from 'node:crypto';
import { db } from '../db.js';
import type { Association, SortitionBodyConfig } from './types.js';

// Re-export all types
export type {
	Association,
	AssociationMember,
	Role,
	RoleAssignment,
	RolePermission,
	RoleTemplate,
	RoleTemplatePermission,
	OrgSection,
	SortitionBodyConfig
} from './types.js';

// Re-export all submodule functions
export {
	getCurrentMembers,
	isMember,
	addMember,
	removeMember
} from './membership.js';

export {
	getSectionsByAssociation,
	getSectionByUuid,
	createOrgSection,
	createOrgSection as createSection, // Backward compatibility alias
	updateSection,
	deleteSection
} from './org-sections.js';

export {
	getRoleTemplateByUuid,
	getRoleTemplatesByAssociation,
	createRoleTemplate,
	deleteRoleTemplate,
	getRoleTemplatePermissions,
	setRoleTemplatePermissions
} from './role-templates.js';

export {
	getRoleByUuid,
	getRolesByAssociation,
	createRole,
	updateRole,
	deleteRole,
	getPermissionsForRole,
	setRolePermissions,
	getRoleAssignment,
	getCurrentRolesForPerson,
	getVacantRoles,
	assignRole,
	unassignRole,
	calculateBudget
} from './roles.js';

export {
	applyOrgChartTemplate
} from './org-charts.js';

export {
	resolvePermissions
} from './permissions.js';

function now(): string {
	return new Date().toISOString();
}

// ============================================================================
// Association CRUD
// ============================================================================

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

export function createAssociation(input: {
	handle: string;
	name: string;
	description?: string;
	abbreviation?: string;
	type: Association['type'];
	established_by_motion_uuid?: string;
	governing_document_slug?: string;
	governs_app?: string;
}): Association {
	const handleTaken =
		db.prepare('SELECT 1 FROM person WHERE handle = ?').get(input.handle) ??
		db.prepare('SELECT 1 FROM association WHERE handle = ?').get(input.handle);
	if (handleTaken) throw new Error(`Handle already taken: ${input.handle}`);

	const uuid = randomUUID();
	const createdAt = now();

	db.prepare(
		`INSERT INTO association (uuid, handle, name, description, abbreviation, type, status, governing_document_slug, established_by_motion_uuid, governs_app, created_at)
		 VALUES (?, ?, ?, ?, ?, ?, 'active', ?, ?, ?, ?)`
	).run(uuid, input.handle, input.name, input.description ?? null, input.abbreviation ?? null, input.type, input.governing_document_slug ?? null, input.established_by_motion_uuid ?? null, input.governs_app ?? null, createdAt);

	return getAssociationByUuid(uuid)!;
}

export function dissolveAssociation(uuid: string): void {
	db.prepare(
		"UPDATE association SET status = 'dissolved', dissolved_at = ? WHERE uuid = ?"
	).run(now(), uuid);
}

export function updateAssociation(uuid: string, input: {
	name?: string;
	description?: string | null;
	governing_document_slug?: string | null;
	org_chart_slug?: string | null;
	status?: 'active' | 'inactive' | 'dissolved';
}): void {
	const updates: string[] = [];
	const params: any[] = [];

	if (input.name !== undefined) {
		updates.push('name = ?');
		params.push(input.name);
	}
	if (input.description !== undefined) {
		updates.push('description = ?');
		params.push(input.description);
	}
	if (input.governing_document_slug !== undefined) {
		updates.push('governing_document_slug = ?');
		params.push(input.governing_document_slug);
	}
	if (input.org_chart_slug !== undefined) {
		updates.push('org_chart_slug = ?');
		params.push(input.org_chart_slug);
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

// ============================================================================
// Sortition Body Configuration
// ============================================================================
// These live here because sortition.ts imports from this file

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
