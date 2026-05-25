import { db } from './db.js';

export interface NetworkStats {
	total_societies: number;
	root_societies: number;
	total_people: number;
	total_person_years: number;
	total_florens_issued: number;
	recent_registrations_24h: number;
	recent_registrations_7d: number;
	recent_registrations_30d: number;
	max_lineage_depth: number;
	avg_lineage_depth: number;
}

/**
 * Get network-wide statistics
 */
export function getNetworkStats(): NetworkStats {
	// Total societies
	const totalResult = db.prepare('SELECT COUNT(*) as count FROM societies WHERE status = ?').get('active') as { count: number };
	const total_societies = totalResult.count;

	// Root societies (no parent)
	const rootResult = db.prepare('SELECT COUNT(*) as count FROM societies WHERE parent_uuid IS NULL AND status = ?').get('active') as { count: number };
	const root_societies = rootResult.count;

	// Aggregate metrics
	const metricsResult = db.prepare(/* sql */ `
		SELECT 
			COALESCE(SUM(people_count), 0) as total_people,
			COALESCE(SUM(person_years), 0) as total_person_years,
			COALESCE(SUM(issued_florens), 0) as total_florens_issued
		FROM societies
		WHERE status = 'active'
	`).get() as { total_people: number; total_person_years: number; total_florens_issued: number };

	// Recent registrations
	const now = Math.floor(Date.now() / 1000);
	const day_ago = now - (24 * 60 * 60);
	const week_ago = now - (7 * 24 * 60 * 60);
	const month_ago = now - (30 * 24 * 60 * 60);

	const recent24h = db.prepare('SELECT COUNT(*) as count FROM societies WHERE registered_at >= ?').get(day_ago) as { count: number };
	const recent7d = db.prepare('SELECT COUNT(*) as count FROM societies WHERE registered_at >= ?').get(week_ago) as { count: number };
	const recent30d = db.prepare('SELECT COUNT(*) as count FROM societies WHERE registered_at >= ?').get(month_ago) as { count: number };

	// Lineage depth statistics (simplified - just count levels)
	// TODO: Implement proper recursive lineage depth calculation
	const max_lineage_depth = 10; // Placeholder
	const avg_lineage_depth = 2.5; // Placeholder

	return {
		total_societies,
		root_societies,
		total_people: metricsResult.total_people,
		total_person_years: metricsResult.total_person_years,
		total_florens_issued: metricsResult.total_florens_issued,
		recent_registrations_24h: recent24h.count,
		recent_registrations_7d: recent7d.count,
		recent_registrations_30d: recent30d.count,
		max_lineage_depth,
		avg_lineage_depth
	};
}

/**
 * Get recent society registrations
 */
export function getRecentRegistrations(limit: number = 10) {
	const stmt = db.prepare(/* sql */ `
		SELECT uuid, handle, parent_uuid, founded_at, registered_at
		FROM societies
		ORDER BY registered_at DESC
		LIMIT ?
	`);
	return stmt.all(limit);
}
