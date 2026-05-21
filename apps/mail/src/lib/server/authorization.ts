/**
 * Authorization Helpers for Mail App
 * 
 * Uses session-based context model:
 * - session.person_uuid: Who you actually are (immutable)
 * - session.acting_as_uuid: Whose authority you're using (can switch)
 * - session.permissions: Resolved permissions based on acting_as context
 */

import type { Session } from './oidc.js';
import { PERMISSIONS } from './permissions.js';
import type { Mailbox } from './mailboxes.js';

/**
 * Check if session has app-wide moderator access
 */
export function hasAppWideModerator(session: Session): boolean {
	return session.permissions.some(
		p => p.app === 'mail' && p.permission === PERMISSIONS.MODERATOR
	);
}

/**
 * Check if session has a specific permission
 */
export function hasPermission(
	session: Session,
	permission: string
): boolean {
	return session.permissions.some(
		p => p.app === 'mail' && p.permission === permission
	);
}

/**
 * Check if session can access a mailbox
 * - Moderators can access any mailbox
 * - Otherwise, acting_as_uuid must match mailbox owner_uuid
 */
export function canAccessMailbox(
	session: Session,
	mailbox: Mailbox
): boolean {
	if (hasAppWideModerator(session)) {
		return true;
	}
	return session.acting_as_uuid === mailbox.owner_uuid;
}

/**
 * Check if session can send a message from a mailbox
 * - Must be able to access the mailbox
 */
export function canSendFrom(
	session: Session,
	mailbox: Mailbox
): boolean {
	return canAccessMailbox(session, mailbox);
}

/**
 * Check if session can moderate/delete any message
 * - Requires app-wide moderator permission
 */
export function canModerate(session: Session): boolean {
	return hasAppWideModerator(session);
}
