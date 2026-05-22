/**
 * Query functions for service listings
 */

import { db } from '../db.js';
import { PAGE_SIZE } from '$lib/constants.js';
import type { ServiceListing, ServiceOpts } from './types.js';

/**
 * Get service listings with optional filtering and pagination
 */
export function getServices(opts: ServiceOpts = {}): { listings: ServiceListing[]; total: number } {
	const conditions: string[] = [`status = 'active'`];
	const params: unknown[] = [];

	if (opts.category) {
		conditions.push('category = ?');
		params.push(opts.category);
	}
	if (opts.keyword) {
		conditions.push('(title LIKE ? OR description LIKE ?)');
		const like = `%${opts.keyword}%`;
		params.push(like, like);
	}
	if (opts.scope) {
		conditions.push('scope = ?');
		params.push(opts.scope);
	}

	const where = conditions.join(' AND ');
	const offset = ((opts.page ?? 1) - 1) * PAGE_SIZE;

	const total = (
		db.prepare(`SELECT COUNT(*) AS n FROM service_listing WHERE ${where}`).get(...params) as { n: number }
	).n;

	const listings = db
		.prepare(
			`SELECT * FROM service_listing
       WHERE ${where}
       ORDER BY created_at DESC
       LIMIT ? OFFSET ?`
		)
		.all(...params, PAGE_SIZE, offset) as ServiceListing[];

	return { listings, total };
}

/**
 * Get a single service listing by UUID
 */
export function getService(uuid: string): ServiceListing | null {
	return (
		(db.prepare('SELECT * FROM service_listing WHERE uuid = ?').get(uuid) as
			| ServiceListing
			| undefined) ?? null
	);
}

/**
 * Get all service listings by a provider
 */
export function getMyServices(provider_uuid: string): ServiceListing[] {
	return db
		.prepare(
			`SELECT * FROM service_listing
       WHERE provider_uuid = ?
       ORDER BY created_at DESC`
		)
		.all(provider_uuid) as ServiceListing[];
}

/**
 * Get recent active service listings for the landing page
 */
export function getRecentServices(limit = 6): ServiceListing[] {
	return db
		.prepare(
			`SELECT * FROM service_listing
       WHERE status = 'active'
       ORDER BY created_at DESC
       LIMIT ?`
		)
		.all(limit) as ServiceListing[];
}

/**
 * Get active service listings by a provider for public profile
 */
export function getActiveServicesByProvider(provider_uuid: string): ServiceListing[] {
	return db
		.prepare(
			`SELECT * FROM service_listing
       WHERE provider_uuid = ? AND status = 'active'
       ORDER BY created_at DESC`
		)
		.all(provider_uuid) as ServiceListing[];
}
