// ============================================================================
// Permission Resolution
// ============================================================================
// Functions for resolving permissions at session time (for OIDC tokens)

import { db } from '../db.js';
import type { RolePermission } from './types.js';

/**
 * Resolve all permissions for a person based on their acting context
 * Used at session time to build the permissions claim for OIDC tokens
 * 
 * @param personUuid - The person's UUID
 * @param actingAsUuid - The UUID they're currently acting as (person or association)
 * @returns Array of permissions from active role assignments
 * 
 * When acting as self: returns all permissions from all associations
 * When acting as association: returns only permissions from roles in that association
 */
export function resolvePermissions(
	personUuid: string,
	actingAsUuid: string
): RolePermission[] {
	// If acting as self, return all personal permissions from all associations
	if (actingAsUuid === personUuid) {
		return db
			.prepare(
				`SELECT DISTINCT rp.app, rp.permission, r.association_uuid, rp.role_uuid
				 FROM role_permission rp
				 JOIN role r ON r.uuid = rp.role_uuid
				 JOIN role_assignment ra ON ra.role_uuid = r.uuid
				 WHERE ra.person_uuid = ? AND ra.removed_at IS NULL`
			)
			.all(personUuid) as RolePermission[];
	}
	
	// If acting as association, return only permissions from roles in that association
	return db
		.prepare(
			`SELECT DISTINCT rp.app, rp.permission, r.association_uuid, rp.role_uuid
			 FROM role_permission rp
			 JOIN role r ON r.uuid = rp.role_uuid
			 JOIN role_assignment ra ON ra.role_uuid = r.uuid
			 WHERE ra.person_uuid = ? 
			   AND r.association_uuid = ? 
			   AND ra.removed_at IS NULL`
		)
		.all(personUuid, actingAsUuid) as RolePermission[];
}
