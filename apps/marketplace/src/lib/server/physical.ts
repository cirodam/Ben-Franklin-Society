import { randomUUID } from 'node:crypto';
import { db }        from './db.js';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface PhysicalMarketplace {
	uuid:             string;
	name:             string;
	description:      string | null;
	location:         string;
	default_schedule: string | null;
	status:           'active' | 'closed';
	created_at:       string;
}

export interface MarketSession {
	uuid:             string;
	marketplace_uuid: string;
	starts_at:        string;
	ends_at:          string;
	notes:            string | null;
	status:           'scheduled' | 'cancelled';
	created_at:       string;
}

export interface Stall {
	uuid:             string;
	marketplace_uuid: string;
	name:             string;
	description:      string | null;
	status:           'active' | 'retired';
	created_at:       string;
}

export interface StallAssignment {
	uuid:                  string;
	stall_uuid:            string;
	session_uuid:          string;
	assignee_uuid:         string;
	assignee_handle_cache: string;
	notes:                 string | null;
	created_at:            string;
}

export interface StallWithAssignment extends Stall {
	assignment: StallAssignment | null;
}

// ---------------------------------------------------------------------------
// Marketplaces
// ---------------------------------------------------------------------------

export function getAllMarketplaces(): PhysicalMarketplace[] {
	return db
		.prepare(`SELECT * FROM physical_marketplace WHERE status = 'active' ORDER BY name ASC`)
		.all() as PhysicalMarketplace[];
}

export function getMarketplace(uuid: string): PhysicalMarketplace | null {
	return (
		db.prepare(`SELECT * FROM physical_marketplace WHERE uuid = ?`).get(uuid) as
			| PhysicalMarketplace
			| undefined
	) ?? null;
}

export interface CreateMarketplaceOpts {
	name:             string;
	description:      string | null;
	location:         string;
	default_schedule: string | null;
}

export function createMarketplace(opts: CreateMarketplaceOpts): string {
	const uuid = randomUUID();
	db.prepare(
		`INSERT INTO physical_marketplace (uuid, name, description, location, default_schedule, status, created_at)
     VALUES (?, ?, ?, ?, ?, 'active', ?)`
	).run(uuid, opts.name, opts.description, opts.location, opts.default_schedule, new Date().toISOString());
	return uuid;
}

export interface UpdateMarketplaceOpts {
	name:             string;
	description:      string | null;
	location:         string;
	default_schedule: string | null;
}

export function updateMarketplace(uuid: string, opts: UpdateMarketplaceOpts): void {
	db.prepare(
		`UPDATE physical_marketplace SET name = ?, description = ?, location = ?, default_schedule = ? WHERE uuid = ?`
	).run(opts.name, opts.description, opts.location, opts.default_schedule, uuid);
}

export function closeMarketplace(uuid: string): void {
	db.prepare(`UPDATE physical_marketplace SET status = 'closed' WHERE uuid = ?`).run(uuid);
}

// ---------------------------------------------------------------------------
// Sessions
// ---------------------------------------------------------------------------

export function getUpcomingSessions(marketplace_uuid: string): MarketSession[] {
	const now = new Date().toISOString();
	return db
		.prepare(
			`SELECT * FROM market_session
       WHERE marketplace_uuid = ? AND starts_at > ? AND status != 'cancelled'
       ORDER BY starts_at ASC`
		)
		.all(marketplace_uuid, now) as MarketSession[];
}

export function getAllSessions(marketplace_uuid: string): MarketSession[] {
	return db
		.prepare(
			`SELECT * FROM market_session WHERE marketplace_uuid = ? ORDER BY starts_at DESC`
		)
		.all(marketplace_uuid) as MarketSession[];
}

export function getSession(uuid: string): MarketSession | null {
	return (
		db.prepare(`SELECT * FROM market_session WHERE uuid = ?`).get(uuid) as
			| MarketSession
			| undefined
	) ?? null;
}

export interface CreateSessionOpts {
	marketplace_uuid: string;
	starts_at:        string;
	ends_at:          string;
	notes:            string | null;
}

export function createSession(opts: CreateSessionOpts): string {
	const uuid = randomUUID();
	db.prepare(
		`INSERT INTO market_session (uuid, marketplace_uuid, starts_at, ends_at, notes, status, created_at)
     VALUES (?, ?, ?, ?, ?, 'scheduled', ?)`
	).run(uuid, opts.marketplace_uuid, opts.starts_at, opts.ends_at, opts.notes, new Date().toISOString());
	return uuid;
}

export interface UpdateSessionOpts {
	starts_at: string;
	ends_at:   string;
	notes:     string | null;
}

export function updateSession(uuid: string, opts: UpdateSessionOpts): void {
	db.prepare(
		`UPDATE market_session SET starts_at = ?, ends_at = ?, notes = ? WHERE uuid = ?`
	).run(opts.starts_at, opts.ends_at, opts.notes, uuid);
}

export function cancelSession(uuid: string): void {
	db.prepare(`UPDATE market_session SET status = 'cancelled' WHERE uuid = ?`).run(uuid);
}

// ---------------------------------------------------------------------------
// Stalls
// ---------------------------------------------------------------------------

export function getStalls(marketplace_uuid: string): Stall[] {
	return db
		.prepare(`SELECT * FROM stall WHERE marketplace_uuid = ? ORDER BY name ASC`)
		.all(marketplace_uuid) as Stall[];
}

export interface CreateStallOpts {
	marketplace_uuid: string;
	name:             string;
	description:      string | null;
}

export function createStall(opts: CreateStallOpts): string {
	const uuid = randomUUID();
	db.prepare(
		`INSERT INTO stall (uuid, marketplace_uuid, name, description, status, created_at)
     VALUES (?, ?, ?, ?, 'active', ?)`
	).run(uuid, opts.marketplace_uuid, opts.name, opts.description, new Date().toISOString());
	return uuid;
}

export function retireStall(uuid: string): void {
	db.prepare(`UPDATE stall SET status = 'retired' WHERE uuid = ?`).run(uuid);
}

// ---------------------------------------------------------------------------
// Stall assignments
// ---------------------------------------------------------------------------

export function getAssignmentsForSession(session_uuid: string): StallAssignment[] {
	return db
		.prepare(`SELECT * FROM stall_assignment WHERE session_uuid = ?`)
		.all(session_uuid) as StallAssignment[];
}

export function getStallsWithAssignments(marketplace_uuid: string, session_uuid: string): StallWithAssignment[] {
	const stalls      = getStalls(marketplace_uuid);
	const assignments = getAssignmentsForSession(session_uuid);
	const byStall     = new Map(assignments.map((a) => [a.stall_uuid, a]));
	return stalls
		.filter((s) => s.status === 'active')
		.map((s) => ({ ...s, assignment: byStall.get(s.uuid) ?? null }));
}

export function assignStall(
	stall_uuid:            string,
	session_uuid:          string,
	assignee_uuid:         string,
	assignee_handle_cache: string,
	notes:                 string | null = null
): void {
	const uuid = randomUUID();
	db.prepare(
		`INSERT INTO stall_assignment
       (uuid, stall_uuid, session_uuid, assignee_uuid, assignee_handle_cache, notes, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?)
     ON CONFLICT(stall_uuid, session_uuid) DO UPDATE SET
       assignee_uuid         = excluded.assignee_uuid,
       assignee_handle_cache = excluded.assignee_handle_cache,
       notes                 = excluded.notes`
	).run(uuid, stall_uuid, session_uuid, assignee_uuid, assignee_handle_cache, notes, new Date().toISOString());
}

export function removeAssignment(uuid: string): void {
	db.prepare(`DELETE FROM stall_assignment WHERE uuid = ?`).run(uuid);
}
