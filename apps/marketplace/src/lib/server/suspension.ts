/**
 * Seller suspension checks
 */

import { db } from './db.js';

/**
 * Check if a seller is currently suspended
 */
export function isSellerSuspended(owner_uuid: string): boolean {
	const row = db
		.prepare(`SELECT 1 FROM seller_suspension WHERE owner_uuid = ? AND lifted_at IS NULL`)
		.get(owner_uuid);
	return row !== undefined;
}
