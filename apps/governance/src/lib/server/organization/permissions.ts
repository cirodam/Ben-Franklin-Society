// ============================================================================
// Permission Resolution
// ============================================================================
// Functions for resolving permissions at session time (for OIDC tokens)

import { db } from '../db.js';
import type { RolePermission } from './types.js';

/**
 * Resolve all permissions for a person in an association
 * Used at session time to build the permissions claim for OIDC tokens
 * 
 * @param personUuid - The person's UUID
 * @param associationUuid - The association's UUID
 * @returns Array of permissions from all active role assignments
 */
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
