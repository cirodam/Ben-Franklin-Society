import { openDatabase, type BfsDb } from '@bfs/db';

// Connect to governance database to query associations
const governancePath = process.env.GOVERNANCE_DATABASE_PATH ?? '../governance/db.sqlite';
export const governanceDb: BfsDb = openDatabase(governancePath);

export interface Association {
	uuid: string;
	handle: string;
	name: string;
	description: string | null;
	type: string;
	status: string;
}

/**
 * Get associations that a user is a member of
 */
export function getUserAssociations(userUuid: string): Association[] {
	const associations = governanceDb.prepare(`
		SELECT a.*
		FROM association a
		INNER JOIN association_member am ON am.association_uuid = a.uuid
		WHERE am.person_uuid = ?
		  AND am.removed_at IS NULL
		  AND a.status = 'active'
		ORDER BY a.name ASC
	`).all(userUuid) as Association[];

	return associations;
}

/**
 * Check if a user is a member of an association
 */
export function isAssociationMember(userUuid: string, associationHandle: string): boolean {
	const result = governanceDb.prepare(`
		SELECT 1
		FROM association a
		INNER JOIN association_member am ON am.association_uuid = a.uuid
		WHERE a.handle = ?
		  AND am.person_uuid = ?
		  AND am.removed_at IS NULL
		  AND a.status = 'active'
		LIMIT 1
	`).get(associationHandle, userUuid);

	return result !== undefined;
}

/**
 * Get association by handle
 */
export function getAssociationByHandle(handle: string): Association | null {
	const association = governanceDb.prepare(`
		SELECT *
		FROM association
		WHERE handle = ?
		  AND status = 'active'
	`).get(handle) as Association | undefined;

	return association ?? null;
}
