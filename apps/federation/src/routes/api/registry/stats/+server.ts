import { json } from '@sveltejs/kit';
import { getNetworkStats } from '$lib/server/registry.js';
import type { RequestHandler } from './$types.js';

/**
 * GET /api/registry/stats
 * Get BFS network statistics
 * 
 * Returns comprehensive metrics about the BFS network including:
 * - Total societies and breakdown by status
 * - Root societies (no parent)
 * - Recent activity (24h registrations and updates)
 * - DNS record counts
 * - Oldest and newest societies
 * - Most active society (by update count)
 * 
 * This endpoint is useful for:
 * - Network health monitoring
 * - Dashboard displays
 * - Analytics and reporting
 * - Understanding network growth
 */
export const GET: RequestHandler = async () => {
	const stats = getNetworkStats();

	return json(stats);
};
