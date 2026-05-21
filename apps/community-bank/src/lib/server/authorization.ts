import type { Session } from '@bfs/oidc-client';
import { PERMISSIONS } from './permissions.js';
import type { Account } from './accounts.js';

/**
 * Check if a session has app-wide admin permission for banking
 */
export function hasAppWideAdmin(session: Session): boolean {
	return session.permissions.some(
		(p) => p.app === 'bank' && p.permission === PERMISSIONS.ADMIN
	);
}

/**
 * Check if a session has a specific permission in the banking app
 */
export function hasPermission(session: Session, permission: string): boolean {
	return session.permissions.some(
		(p) => p.app === 'bank' && p.permission === permission
	);
}

/**
 * Check if the session can access an account
 * - App-wide admins can access all accounts
 * - Otherwise, must be acting as the account owner
 */
export function canAccessAccount(session: Session, account: Account): boolean {
	// App-wide admin can access everything
	if (hasAppWideAdmin(session)) {
		return true;
	}
	
	// Must be acting as the account owner
	return account.owner_uuid === session.acting_as_uuid;
}

/**
 * Check if the session can make transfers from an account
 * - App-wide admins can transfer from any account
 * - Personal accounts: anyone acting as themselves
 * - Association accounts: must be acting as the association AND have teller permission
 */
export function canTransferFrom(session: Session, account: Account): boolean {
	// App-wide admin can do anything
	if (hasAppWideAdmin(session)) {
		return true;
	}
	
	// Must be acting as the account owner
	if (account.owner_uuid !== session.acting_as_uuid) {
		return false;
	}
	
	// Personal account - always allowed when acting as yourself
	if (session.acting_as_uuid === session.person_uuid) {
		return true;
	}
	
	// Association account - need teller permission
	return hasPermission(session, PERMISSIONS.TELLER);
}

/**
 * Check if the session has teller permission
 * Useful for showing/hiding UI elements
 */
export function isTeller(session: Session): boolean {
	return hasPermission(session, PERMISSIONS.TELLER) || hasAppWideAdmin(session);
}

/**
 * Check if the session can manage monetary policy
 * Required for minting, burning, and configuring monetary policy
 */
export function canManageMonetary(session: Session): boolean {
	return hasPermission(session, PERMISSIONS.MANAGE_MONETARY) || hasAppWideAdmin(session);
}

/**
 * Check if the session can collect demurrage
 * Required for running demurrage collection operations
 */
export function canCollectDemurrage(session: Session): boolean {
	return hasPermission(session, PERMISSIONS.COLLECT_DEMURRAGE) || hasAppWideAdmin(session);
}
