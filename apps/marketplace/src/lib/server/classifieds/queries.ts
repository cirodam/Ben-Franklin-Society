/**
 * Query functions for classified listings
 */

import { db } from '../db.js';
import { PAGE_SIZE } from '$lib/constants.js';
import type { ClassifiedListing, ClassifiedOpts } from './types.js';

/**
 * Get classified listings with optional filtering and pagination
 */
export function getClassifieds(opts: ClassifiedOpts = {}): { listings: ClassifiedListing[]; total: number } {
	const conditions: string[] = [`status = 'active'`, `(expires_at IS NULL OR expires_at > ?)`];
	const params: unknown[] = [new Date().toISOString()];

	if (opts.category) {
		conditions.push('category = ?');
		params.push(opts.category);
	}
	if (opts.keyword) {
		conditions.push('(title LIKE ? OR description LIKE ?)');
		const like = `%${opts.keyword}%`;
		params.push(like, like);
	}
	if (opts.minPrice !== undefined) {
		conditions.push('price >= ?');
		params.push(opts.minPrice);
	}
	if (opts.maxPrice !== undefined) {
		conditions.push('price <= ?');
		params.push(opts.maxPrice);
	}
	if (opts.negotiable) {
		conditions.push('price_negotiable = 1');
	}
	if (opts.scope) {
		conditions.push('scope = ?');
		params.push(opts.scope);
	}

	const where = conditions.join(' AND ');
	const offset = ((opts.page ?? 1) - 1) * PAGE_SIZE;

	const total = (
		db.prepare(`SELECT COUNT(*) AS n FROM classified_listing WHERE ${where}`).get(...params) as { n: number }
	).n;

	const listings = db
		.prepare(
			`SELECT * FROM classified_listing
       WHERE ${where}
       ORDER BY created_at DESC
       LIMIT ? OFFSET ?`
		)
		.all(...params, PAGE_SIZE, offset) as ClassifiedListing[];

	return { listings, total };
}

/**
 * Get a single classified listing by UUID
 */
export function getClassified(uuid: string): ClassifiedListing | null {
	return (
		(db.prepare('SELECT * FROM classified_listing WHERE uuid = ?').get(uuid) as
			| ClassifiedListing
			| undefined) ?? null
	);
}

/**
 * Get all classified listings by a seller
 */
export function getMyClassifieds(seller_uuid: string): ClassifiedListing[] {
	return db
		.prepare(
			`SELECT * FROM classified_listing
       WHERE seller_uuid = ?
       ORDER BY created_at DESC`
		)
		.all(seller_uuid) as ClassifiedListing[];
}

/**
 * Get recent active classified listings for the landing page
 */
export function getRecentClassifieds(limit = 6): ClassifiedListing[] {
	const now = new Date().toISOString();
	return db
		.prepare(
			`SELECT * FROM classified_listing
       WHERE status = 'active' AND (expires_at IS NULL OR expires_at > ?)
       ORDER BY created_at DESC
       LIMIT ?`
		)
		.all(now, limit) as ClassifiedListing[];
}

/**
 * Get active classified listings by a seller for public profile
 */
export function getActiveClassifiedsBySeller(seller_uuid: string): ClassifiedListing[] {
	const now = new Date().toISOString();
	return db
		.prepare(
			`SELECT * FROM classified_listing
       WHERE seller_uuid = ? AND status = 'active'
         AND (expires_at IS NULL OR expires_at > ?)
       ORDER BY created_at DESC`
		)
		.all(seller_uuid, now) as ClassifiedListing[];
}
