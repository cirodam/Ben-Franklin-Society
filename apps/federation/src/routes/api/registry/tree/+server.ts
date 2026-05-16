import { json } from '@sveltejs/kit';
import { exportFullTree } from '$lib/server/registry.js';
import type { RequestHandler } from './$types.js';

/**
 * GET /api/registry/tree
 * Export full society tree
 * 
 * Returns all societies with their founding records and metadata.
 * This allows governance nodes to bootstrap their local cache with
 * the complete BFS network structure.
 * 
 * Response includes:
 * - Society handles and UUIDs
 * - Parent-child relationships
 * - Public keys and founding records
 * - Current endpoints
 * - Registration timestamps
 * - Status information
 * 
 * For large networks, this endpoint returns all data at once.
 * For incremental updates, use /api/registry/tree/since/:timestamp instead.
 */
export const GET: RequestHandler = async () => {
	const tree = exportFullTree();

	return json({
		societies: tree,
		count: tree.length,
		exported_at: new Date().toISOString()
	});
};
