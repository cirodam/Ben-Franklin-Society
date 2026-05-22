/**
 * Mutation functions for service listings (create, update, delete)
 */

import { randomUUID } from 'node:crypto';
import { db } from '../db.js';
import { isSellerSuspended } from '../suspension.js';
import type { ServiceListing, CreateServiceOpts, UpdateServiceOpts } from './types.js';
import { getService } from './queries.js';

/**
 * Create a new service listing
 */
export function createService(opts: CreateServiceOpts): string {
	if (isSellerSuspended(opts.provider_uuid)) {
		throw new Error('suspended');
	}
	const uuid = randomUUID();
	db.prepare(
		`INSERT INTO service_listing
       (uuid, provider_uuid, provider_handle_cache, provider_society_handle,
        title, description, category, rate, rate_unit, service_area, scope,
        status, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'active', ?)`
	).run(
		uuid,
		opts.provider_uuid,
		opts.provider_handle_cache,
		opts.provider_society_handle,
		opts.title,
		opts.description,
		opts.category,
		opts.rate,
		opts.rate_unit,
		opts.service_area,
		opts.scope,
		new Date().toISOString()
	);
	return uuid;
}

/**
 * Update an existing service listing
 */
export function updateService(uuid: string, provider_uuid: string, opts: UpdateServiceOpts): void {
	const listing = getService(uuid);
	if (!listing || listing.provider_uuid !== provider_uuid) throw new Error('not_found');
	if (listing.status === 'removed') throw new Error('removed');
	db.prepare(
		`UPDATE service_listing
     SET title = ?, description = ?, category = ?, rate = ?,
         rate_unit = ?, service_area = ?, scope = ?
     WHERE uuid = ? AND provider_uuid = ?`
	).run(
		opts.title,
		opts.description,
		opts.category,
		opts.rate,
		opts.rate_unit,
		opts.service_area,
		opts.scope,
		uuid,
		provider_uuid
	);
}

/**
 * Withdraw a service listing (provider action)
 */
export function withdrawService(uuid: string, provider_uuid: string): void {
	const listing = getService(uuid);
	if (!listing || listing.provider_uuid !== provider_uuid) throw new Error('not_found');
	if (listing.status === 'removed') throw new Error('removed');
	db.prepare(
		`UPDATE service_listing SET status = 'withdrawn' WHERE uuid = ? AND provider_uuid = ?`
	).run(uuid, provider_uuid);
}
