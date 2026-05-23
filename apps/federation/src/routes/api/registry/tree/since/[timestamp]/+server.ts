import { json } from '@sveltejs/kit';
import { exportTreeSince } from '$lib/server/sync.js';
import type { RequestHandler } from './$types.js';

/**
 * GET /api/registry/tree/since/:timestamp
 * Export incremental society tree updates
 * 
 * Returns societies that were registered or updated since the given timestamp.
 * This allows governance nodes to efficiently sync only new changes instead
 * of downloading the entire tree.
 * 
 * Timestamp should be a Unix timestamp (seconds since epoch).
 * 
 * Use this after an initial full tree download to stay up-to-date:
 * 1. Download full tree with GET /api/registry/tree
 * 2. Store the exported_at timestamp
 * 3. Periodically call this endpoint with that timestamp
 * 4. Merge the returned societies into your local cache
 * 
 * Response includes only societies with:
 * - registered_at >= timestamp OR
 * - last_updated >= timestamp
 */
export const GET: RequestHandler = async ({ params }) => {
	const timestampStr = params.timestamp;

	// Parse timestamp
	let timestamp: number;
	try {
		timestamp = parseInt(timestampStr, 10);
		if (isNaN(timestamp) || timestamp < 0) {
			return json(
				{ error: 'Invalid timestamp. Must be a positive Unix timestamp (seconds).' },
				{ status: 400 }
			);
		}
	} catch {
		return json(
			{ error: 'Invalid timestamp format.' },
			{ status: 400 }
		);
	}

	const tree = exportTreeSince(timestamp);

	return json({
		societies: tree,
		count: tree.length,
		since: new Date(timestamp * 1000).toISOString(),
		exported_at: new Date().toISOString()
	});
};
