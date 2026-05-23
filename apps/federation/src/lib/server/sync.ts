import { db } from './db.js';

/**
 * Export full society tree
 * Returns all societies with their founding records and metadata
 * Used by governance nodes to bootstrap their local cache
 */
export function exportFullTree() {
	const stmt = db.prepare(/* sql */ `
		SELECT 
			uuid,
			handle,
			parent_uuid,
			public_key,
			bfs_url,
			url,
			ip_address,
			port,
			founding_record_json,
			founded_at,
			registered_at,
			status,
			people_count,
			person_years,
			issued_florens
		FROM societies
		ORDER BY registered_at ASC
	`);

	const societies = stmt.all() as any[];

	return societies.map(s => ({
		uuid: s.uuid,
		handle: s.handle,
		parent_uuid: s.parent_uuid,
		public_key: s.public_key,
		bfs_url: s.bfs_url,
		url: s.url,
		ip_address: s.ip_address,
		port: s.port,
		founding_record: JSON.parse(s.founding_record_json),
		founded_at: s.founded_at,
		registered_at: s.registered_at,
		status: s.status,
		people_count: s.people_count,
		person_years: s.person_years,
		issued_florens: s.issued_florens
	}));
}

/**
 * Export societies updated/registered since a given timestamp
 * Used for incremental sync by governance nodes
 */
export function exportTreeSince(timestamp: number) {
	const stmt = db.prepare(/* sql */ `
		SELECT 
			uuid,
			handle,
			parent_uuid,
			public_key,
			bfs_url,
			url,
			ip_address,
			port,
			founding_record_json,
			founded_at,
			registered_at,
			status,
			people_count,
			person_years,
			issued_florens
		FROM societies
		WHERE registered_at >= ?
		ORDER BY registered_at ASC
	`);

	const societies = stmt.all(timestamp) as any[];

	return societies.map(s => ({
		uuid: s.uuid,
		handle: s.handle,
		parent_uuid: s.parent_uuid,
		public_key: s.public_key,
		bfs_url: s.bfs_url,
		url: s.url,
		ip_address: s.ip_address,
		port: s.port,
		founding_record: JSON.parse(s.founding_record_json),
		founded_at: s.founded_at,
		registered_at: s.registered_at,
		status: s.status,
		people_count: s.people_count,
		person_years: s.person_years,
		issued_florens: s.issued_florens
	}));
}

/**
 * Get network statistics
 * Returns counts and metrics about the BFS network
 */
export function getNetworkStats() {
	// Total societies
	const totalStmt = db.prepare('SELECT COUNT(*) as count FROM societies');
	const total = (totalStmt.get() as { count: number }).count;

	// By status
	const statusStmt = db.prepare(/* sql */ `
		SELECT status, COUNT(*) as count
		FROM societies
		GROUP BY status
	`);
	const byStatus = statusStmt.all() as Array<{ status: string; count: number }>;

	// Root societies (no parent)
	const rootStmt = db.prepare(/* sql */ `
		SELECT COUNT(*) as count
		FROM societies
		WHERE parent_uuid IS NULL
	`);
	const roots = (rootStmt.get() as { count: number }).count;

	// Recent registrations (last 24 hours)
	const oneDayAgo = Math.floor(Date.now() / 1000) - 86400;
	const recentStmt = db.prepare(/* sql */ `
		SELECT COUNT(*) as count
		FROM societies
		WHERE registered_at >= ?
	`);
	const recent24h = (recentStmt.get(oneDayAgo) as { count: number }).count;

	// Oldest society
	const oldestStmt = db.prepare(/* sql */ `
		SELECT handle, founded_at
		FROM societies
		ORDER BY founded_at ASC
		LIMIT 1
	`);
	const oldest = oldestStmt.get() as { handle: string; founded_at: number } | undefined;

	// Newest society
	const newestStmt = db.prepare(/* sql */ `
		SELECT handle, registered_at
		FROM societies
		ORDER BY registered_at DESC
		LIMIT 1
	`);
	const newest = newestStmt.get() as { handle: string; registered_at: number } | undefined;

	return {
		total_societies: total,
		by_status: byStatus.reduce((acc, s) => ({ ...acc, [s.status]: s.count }), {}),
		root_societies: roots,
		recent_registrations_24h: recent24h,
		oldest_society: oldest ? {
			handle: oldest.handle,
			founded_at: new Date(oldest.founded_at * 1000).toISOString()
		} : null,
		newest_society: newest ? {
			handle: newest.handle,
			registered_at: new Date(newest.registered_at * 1000).toISOString()
		} : null,
		timestamp: new Date().toISOString()
	};
}
