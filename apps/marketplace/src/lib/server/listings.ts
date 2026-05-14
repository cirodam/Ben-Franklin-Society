import { randomUUID } from 'node:crypto';
import { db } from './db.js';
import { PAGE_SIZE } from '$lib/constants.js';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface ClassifiedListing {
	uuid: string;
	seller_uuid: string;
	seller_handle_cache: string;
	seller_society_handle: string;
	title: string;
	description: string;
	category: string;
	price: number;
	price_negotiable: number; // 0 | 1
	scope: 'local' | 'federated';
	status: 'active' | 'withdrawn' | 'removed';
	expires_at: string | null;
	created_at: string;
}

export interface ServiceListing {
	uuid: string;
	provider_uuid: string;
	provider_handle_cache: string;
	provider_society_handle: string;
	title: string;
	description: string;
	category: string;
	rate: number;
	rate_unit: 'per_hour' | 'per_job' | 'negotiable';
	service_area: string | null;
	scope: 'local' | 'federated';
	status: 'active' | 'withdrawn' | 'removed';
	created_at: string;
}

// ---------------------------------------------------------------------------
// Classifieds — browse
// ---------------------------------------------------------------------------

export interface ClassifiedOpts {
	category?:   string;
	keyword?:    string;
	minPrice?:   number;
	maxPrice?:   number;
	negotiable?: boolean;
	scope?:      'local' | 'federated';
	page?:       number;
}

export function getClassifieds(opts: ClassifiedOpts = {}): { listings: ClassifiedListing[]; total: number } {
	const conditions: string[] = [`status = 'active'`, `(expires_at IS NULL OR expires_at > ?)`];
	const params: unknown[]    = [new Date().toISOString()];

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

	const where  = conditions.join(' AND ');
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

export function getClassified(uuid: string): ClassifiedListing | null {
	return (
		db.prepare('SELECT * FROM classified_listing WHERE uuid = ?').get(uuid) as
			| ClassifiedListing
			| undefined
	) ?? null;
}

export function getMyClassifieds(seller_uuid: string): ClassifiedListing[] {
	return db
		.prepare(
			`SELECT * FROM classified_listing
       WHERE seller_uuid = ?
       ORDER BY created_at DESC`
		)
		.all(seller_uuid) as ClassifiedListing[];
}

// ---------------------------------------------------------------------------
// Services — browse
// ---------------------------------------------------------------------------

export interface ServiceOpts {
	category?: string;
	keyword?:  string;
	scope?:    'local' | 'federated';
	page?:     number;
}

export function getServices(opts: ServiceOpts = {}): { listings: ServiceListing[]; total: number } {
	const conditions: string[] = [`status = 'active'`];
	const params: unknown[]    = [];

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

	const where  = conditions.join(' AND ');
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

export function getService(uuid: string): ServiceListing | null {
	return (
		db.prepare('SELECT * FROM service_listing WHERE uuid = ?').get(uuid) as
			| ServiceListing
			| undefined
	) ?? null;
}

export function getMyServices(provider_uuid: string): ServiceListing[] {
	return db
		.prepare(
			`SELECT * FROM service_listing
       WHERE provider_uuid = ?
       ORDER BY created_at DESC`
		)
		.all(provider_uuid) as ServiceListing[];
}

// ---------------------------------------------------------------------------
// Public profile — all active listings by a principal
// ---------------------------------------------------------------------------

export function getListingsByPrincipal(principal_uuid: string): {
	classifieds: ClassifiedListing[];
	services: ServiceListing[];
} {
	const now = new Date().toISOString();
	const classifieds = db
		.prepare(
			`SELECT * FROM classified_listing
       WHERE seller_uuid = ? AND status = 'active'
         AND (expires_at IS NULL OR expires_at > ?)
       ORDER BY created_at DESC`
		)
		.all(principal_uuid, now) as ClassifiedListing[];

	const services = db
		.prepare(
			`SELECT * FROM service_listing
       WHERE provider_uuid = ? AND status = 'active'
       ORDER BY created_at DESC`
		)
		.all(principal_uuid) as ServiceListing[];

	return { classifieds, services };
}

// ---------------------------------------------------------------------------
// Recent listings (for landing page)
// ---------------------------------------------------------------------------

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

// ---------------------------------------------------------------------------
// Seller suspension
// ---------------------------------------------------------------------------

export function isSellerSuspended(principal_uuid: string): boolean {
	const row = db
		.prepare(`SELECT 1 FROM seller_suspension WHERE principal_uuid = ? AND lifted_at IS NULL`)
		.get(principal_uuid);
	return row !== undefined;
}

// ---------------------------------------------------------------------------
// Classifieds — mutations
// ---------------------------------------------------------------------------

export interface CreateClassifiedOpts {
	seller_uuid:            string;
	seller_handle_cache:    string;
	seller_society_handle:  string;
	title:                  string;
	description:            string;
	category:               string;
	price:                  number;
	price_negotiable:       boolean;
	scope:                  'local' | 'federated';
	expires_at:             string | null;
}

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

export interface UpdateClassifiedOpts {
	title:            string;
	description:      string;
	category:         string;
	price:            number;
	price_negotiable: boolean;
	scope:            'local' | 'federated';
	expires_at:       string | null;
}

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

export function withdrawClassified(uuid: string, seller_uuid: string): void {
	const listing = getClassified(uuid);
	if (!listing || listing.seller_uuid !== seller_uuid) throw new Error('not_found');
	if (listing.status === 'removed') throw new Error('removed');
	db.prepare(
		`UPDATE classified_listing SET status = 'withdrawn' WHERE uuid = ? AND seller_uuid = ?`
	).run(uuid, seller_uuid);
}

// ---------------------------------------------------------------------------
// Services — mutations
// ---------------------------------------------------------------------------

export interface CreateServiceOpts {
	provider_uuid:           string;
	provider_handle_cache:   string;
	provider_society_handle: string;
	title:                   string;
	description:             string;
	category:                string;
	rate:                    number;
	rate_unit:               'per_hour' | 'per_job' | 'negotiable';
	service_area:            string | null;
	scope:                   'local' | 'federated';
}

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

export interface UpdateServiceOpts {
	title:        string;
	description:  string;
	category:     string;
	rate:         number;
	rate_unit:    'per_hour' | 'per_job' | 'negotiable';
	service_area: string | null;
	scope:        'local' | 'federated';
}

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

export function withdrawService(uuid: string, provider_uuid: string): void {
	const listing = getService(uuid);
	if (!listing || listing.provider_uuid !== provider_uuid) throw new Error('not_found');
	if (listing.status === 'removed') throw new Error('removed');
	db.prepare(
		`UPDATE service_listing SET status = 'withdrawn' WHERE uuid = ? AND provider_uuid = ?`
	).run(uuid, provider_uuid);
}
