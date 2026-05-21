/**
 * Authorization Helpers for Marketplace App
 * 
 * Uses session-based context model:
 * - session.person_uuid: Who you actually are (immutable)
 * - session.acting_as_uuid: Whose authority you're using (can switch)
 * - session.permissions: Resolved permissions based on acting_as context
 */

import type { Session } from './oidc.js';
import { PERMISSIONS } from './permissions.js';

/**
 * Check if session has app-wide administrator access
 */
export function hasAppWideAdmin(session: Session): boolean {
	return session.permissions.some(
		p => p.app === 'marketplace' && p.permission === PERMISSIONS.ADMINISTRATOR
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
		p => p.app === 'marketplace' && p.permission === permission
	);
}

/**
 * Check if session can edit a listing (classified or service)
 * - Admins can edit any listing
 * - Otherwise, must be the seller/provider (seller_uuid/provider_uuid = acting_as_uuid)
 */
export function canEditListing(
	session: Session,
	listing: { seller_uuid?: string; provider_uuid?: string }
): boolean {
	if (hasAppWideAdmin(session)) {
		return true;
	}
	const ownerUuid = listing.seller_uuid || listing.provider_uuid;
	return ownerUuid === session.acting_as_uuid;
}

/**
 * Check if session can moderate listings
 * - Requires app-wide administrator permission
 */
export function canModerate(session: Session): boolean {
	return hasAppWideAdmin(session);
}

/**
 * Check if session is suspended from selling
 */
export function isSuspended(
	session: Session,
	suspensions: Map<string, { owner_uuid: string; suspended_at: string; lifted_at: string | null }>
): boolean {
	const suspension = suspensions.get(session.acting_as_uuid);
	return suspension !== undefined && suspension.lifted_at === null;
}
