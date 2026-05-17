import { db } from './db.js';

// ---------------------------------------------------------------------------
// Permission constants
// ---------------------------------------------------------------------------

export const PERMISSIONS = {
	MOTIONS_CREATE:    'motions:create',
	MOTIONS_ADVANCE:   'motions:advance',
	VOTES_OPEN:        'votes:open',
	VOTES_CLOSE:       'votes:close',
	SORTITION_RECORD:  'sortition:record',
	SEAT_TERMS_VACATE: 'seat_terms:vacate',
	MEMBERS_ADD:       'members:add',
	MEMBERS_REMOVE:    'members:remove',
	LIBRARY_CREATE:    'library:create',
	LIBRARY_EDIT:      'library:edit',
	LIBRARY_ADOPT:     'library:adopt',
	LIBRARY_REPEAL:    'library:repeal',
	ROLES_ASSIGN:      'roles:assign',
	RECORD_WRITE:      'record:write',
	PEOPLE_ADD:        'people:add',
	PEOPLE_EDIT:       'people:edit',
	PEOPLE_REMOVE:     'people:remove',
	CALENDAR_WRITE:    'calendar:write',
	CONTRACTS_CREATE:  'contracts:create',
	CONTRACTS_VIEW:    'contracts:view',
	GOVERNANCE_ADMIN:  'governance:admin',
} as const;

export type Permission = (typeof PERMISSIONS)[keyof typeof PERMISSIONS];

export const ALL_PERMISSIONS: Permission[] = Object.values(PERMISSIONS);

// The app identifier used in role_permission rows for this application.
const APP = 'governance';

// ---------------------------------------------------------------------------
// Queries
// ---------------------------------------------------------------------------

/**
 * Returns true if the person holds the given permission in the given
 * association (or in any association if associationUuid is omitted).
 */
export function hasPermission(
	personUuid: string,
	permission: Permission,
	associationUuid?: string
): boolean {
	if (associationUuid) {
		const row = db
			.prepare(
				`SELECT 1
				 FROM role_assignment ra
				 JOIN role r ON r.uuid = ra.role_uuid
				 JOIN role_permission rp ON rp.role_uuid = ra.role_uuid
				 WHERE ra.person_uuid = ?
				   AND r.association_uuid = ?
				   AND ra.removed_at IS NULL
				   AND rp.app = ?
				   AND rp.permission = ?
				 LIMIT 1`
			)
			.get(personUuid, associationUuid, APP, permission);
		return row !== undefined;
	} else {
		const row = db
			.prepare(
				`SELECT 1
				 FROM role_assignment ra
				 JOIN role_permission rp ON rp.role_uuid = ra.role_uuid
				 WHERE ra.person_uuid = ?
				   AND ra.removed_at IS NULL
				   AND rp.app = ?
				   AND rp.permission = ?
				 LIMIT 1`
			)
			.get(personUuid, APP, permission);
		return row !== undefined;
	}
}

/**
 * Returns all permissions held by a person, optionally scoped to one association.
 */
export function getPersonPermissions(
	personUuid: string,
	associationUuid?: string
): Permission[] {
	if (associationUuid) {
		const rows = db
			.prepare(
				`SELECT DISTINCT rp.permission
				 FROM role_assignment ra
				 JOIN role r ON r.uuid = ra.role_uuid
				 JOIN role_permission rp ON rp.role_uuid = ra.role_uuid
				 WHERE ra.person_uuid = ?
				   AND r.association_uuid = ?
				   AND ra.removed_at IS NULL
				   AND rp.app = ?`
			)
			.all(personUuid, associationUuid, APP) as { permission: string }[];
		return rows.map((r) => r.permission as Permission);
	} else {
		const rows = db
			.prepare(
				`SELECT DISTINCT rp.permission
				 FROM role_assignment ra
				 JOIN role_permission rp ON rp.role_uuid = ra.role_uuid
				 WHERE ra.person_uuid = ?
				   AND ra.removed_at IS NULL
				   AND rp.app = ?`
			)
			.all(personUuid, APP) as { permission: string }[];
		return rows.map((r) => r.permission as Permission);
	}
}
