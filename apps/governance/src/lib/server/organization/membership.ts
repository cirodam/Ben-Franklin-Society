// ============================================================================
// Association Membership Management
// ============================================================================
// Functions for managing association membership

import { db } from '../db.js';
import type { AssociationMember } from './types.js';

function now(): string {
	return new Date().toISOString();
}

/**
 * Get all current members of an association
 */
export function getCurrentMembers(associationUuid: string): AssociationMember[] {
	return db
		.prepare(
			'SELECT * FROM association_member WHERE association_uuid = ? AND removed_at IS NULL ORDER BY joined_at'
		)
		.all(associationUuid) as AssociationMember[];
}

/**
 * Check if a person is a member of an association
 */
export function isMember(associationUuid: string, personUuid: string): boolean {
	return !!db
		.prepare(
			'SELECT 1 FROM association_member WHERE association_uuid = ? AND person_uuid = ? AND removed_at IS NULL'
		)
		.get(associationUuid, personUuid);
}

/**
 * Add a person to an association
 * If they were previously a member and removed, reinstates them
 */
export function addMember(associationUuid: string, personUuid: string): void {
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

/**
 * Remove a person from an association
 * Also unassigns all their roles in that association
 */
export function removeMember(associationUuid: string, personUuid: string): void {
	db.prepare(
		'UPDATE association_member SET removed_at = ? WHERE association_uuid = ? AND person_uuid = ? AND removed_at IS NULL'
	).run(now(), associationUuid, personUuid);
	
	// Also remove all role assignments the person held in this association
	// Import dynamically to avoid circular dependency
	const roleUuids = db.prepare(
		`SELECT r.uuid FROM role r
		 JOIN role_assignment ra ON ra.role_uuid = r.uuid
		 WHERE r.association_uuid = ? AND ra.person_uuid = ? AND ra.removed_at IS NULL`
	).all(associationUuid, personUuid) as { uuid: string }[];
	
	for (const { uuid } of roleUuids) {
		db.prepare(
			'UPDATE role_assignment SET removed_at = ? WHERE person_uuid = ? AND role_uuid = ? AND removed_at IS NULL'
		).run(now(), personUuid, uuid);
	}
}
