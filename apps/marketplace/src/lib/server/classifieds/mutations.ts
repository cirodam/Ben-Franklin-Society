/**
 * Mutation functions for classified listings (create, update, delete)
 */

import { randomUUID } from 'node:crypto';
import { db } from '../db.js';
import { isSellerSuspended } from '../suspension.js';
import type { ClassifiedListing, CreateClassifiedOpts, UpdateClassifiedOpts } from './types.js';
import { getClassified } from './queries.js';

/**
 * Create a new classified listing
 */
export function createClassified(opts: CreateClassifiedOpts): string {
	if (isSellerSuspended(opts.seller_uuid)) {
		throw new Error('suspended');
	}
	const uuid = randomUUID();
	db.prepare(
		`INSERT INTO classified_listing
       (uuid, seller_uuid, seller_handle_cache, seller_society_handle,
        title, description, category, price, price_negotiable, scope,
        status, expires_at, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'active', ?, ?)`
	).run(
		uuid,
		opts.seller_uuid,
		opts.seller_handle_cache,
		opts.seller_society_handle,
		opts.title,
		opts.description,
		opts.category,
		opts.price,
		opts.price_negotiable ? 1 : 0,
		opts.scope,
		opts.expires_at,
		new Date().toISOString()
	);
	return uuid;
}

/**
 * Update an existing classified listing
 */
export function updateClassified(uuid: string, seller_uuid: string, opts: UpdateClassifiedOpts): void {
	const listing = getClassified(uuid);
	if (!listing || listing.seller_uuid !== seller_uuid) throw new Error('not_found');
	if (listing.status === 'removed') throw new Error('removed');
	db.prepare(
		`UPDATE classified_listing
     SET title = ?, description = ?, category = ?, price = ?,
         price_negotiable = ?, scope = ?, expires_at = ?
     WHERE uuid = ? AND seller_uuid = ?`
	).run(
		opts.title,
		opts.description,
		opts.category,
		opts.price,
		opts.price_negotiable ? 1 : 0,
		opts.scope,
		opts.expires_at,
		uuid,
		seller_uuid
	);
}

/**
 * Withdraw a classified listing (seller action)
 */
export function withdrawClassified(uuid: string, seller_uuid: string): void {
	const listing = getClassified(uuid);
	if (!listing || listing.seller_uuid !== seller_uuid) throw new Error('not_found');
	if (listing.status === 'removed') throw new Error('removed');
	db.prepare(
		`UPDATE classified_listing SET status = 'withdrawn' WHERE uuid = ? AND seller_uuid = ?`
	).run(uuid, seller_uuid);
}
