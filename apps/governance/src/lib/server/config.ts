import { db } from './db.js';

/**
 * Get a community configuration value from the database
 */
export function getCommunityConfig(key: string): string | null {
	const row = db.prepare('SELECT value FROM community_config WHERE key = ?').get(key) as { value: string } | undefined;
	return row?.value ?? null;
}

/**
 * Set a community configuration value during initial setup (no motion required)
 * This should only be used during setup before any motions exist.
 */
export function setInitialCommunityConfig(key: string, value: string, description: string): void {
	const now = new Date().toISOString();
	
	db.prepare(
		`INSERT INTO community_config (key, value, description, updated_by_motion_uuid, updated_at) 
		 VALUES (?, ?, ?, NULL, ?)`
	).run(key, value, description, now);
}
