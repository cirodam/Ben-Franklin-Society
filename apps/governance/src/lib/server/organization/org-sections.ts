// ============================================================================
// Organizational Sections
// ============================================================================
// Functions for managing org chart sections (divisions within associations)

import { randomUUID } from 'node:crypto';
import { db } from '../db.js';
import type { OrgSection } from './types.js';

function now(): string {
	return new Date().toISOString();
}

/**
 * Get all sections for an association
 */
export function getSectionsByAssociation(associationUuid: string): OrgSection[] {
	return db
		.prepare('SELECT * FROM org_section WHERE association_uuid = ? ORDER BY name')
		.all(associationUuid) as OrgSection[];
}

/**
 * Get a section by UUID
 */
export function getSectionByUuid(uuid: string): OrgSection | null {
	return (
		(db
			.prepare('SELECT * FROM org_section WHERE uuid = ?')
			.get(uuid) as OrgSection | undefined) ?? null
	);
}

/**
 * Create a new organizational section
 */
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

/**
 * Update an existing section
 */
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

/**
 * Delete a section (cascades to children)
 * Clears section references from roles before deletion
 */
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
