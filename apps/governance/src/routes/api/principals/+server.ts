import { json } from '@sveltejs/kit';
import { db } from '$lib/server/db.js';
import type { RequestHandler } from './$types.js';

interface Principal {
	uuid: string;
	handle: string;
	name: string;
	type: 'person' | 'association';
	status: string;
}

/**
 * Search for principals (persons and associations) by handle, name, or UUID.
 * 
 * GET /api/principals?query=alice&type=person
 * 
 * Query params:
 *   - query: Search string (searches handle, name, UUID)
 *   - type: Optional filter - 'person' or 'association'
 * 
 * Returns: Array of principals with basic info
 * Example: [{ uuid, handle, name, type, status }]
 * 
 * Max 50 results per query.
 */
export const GET: RequestHandler = async ({ url }) => {
	const query = url.searchParams.get('query')?.trim() || '';
	const typeFilter = url.searchParams.get('type') as 'person' | 'association' | null;

	if (!query) {
		return json({ principals: [] });
	}

	const searchPattern = `%${query}%`;
	const results: Principal[] = [];

	// Search persons if no type filter or type=person
	if (!typeFilter || typeFilter === 'person') {
		const persons = db
			.prepare(
				`SELECT 
					uuid,
					handle,
					given_name || ' ' || family_name as name,
					'person' as type,
					status
				FROM person
				WHERE handle LIKE ? 
					OR given_name LIKE ?
					OR family_name LIKE ?
					OR uuid LIKE ?
				ORDER BY status = 'active' DESC, handle ASC
				LIMIT 50`
			)
			.all(searchPattern, searchPattern, searchPattern, searchPattern) as Principal[];
		
		results.push(...persons);
	}

	// Search associations if no type filter or type=association
	if (!typeFilter || typeFilter === 'association') {
		const associations = db
			.prepare(
				`SELECT 
					uuid,
					handle,
					name,
					'association' as type,
					status
				FROM association
				WHERE handle LIKE ? 
					OR name LIKE ?
					OR uuid LIKE ?
				ORDER BY status = 'active' DESC, handle ASC
				LIMIT 50`
			)
			.all(searchPattern, searchPattern, searchPattern) as Principal[];
		
		results.push(...associations);
	}

	// Limit total results to 50
	const limitedResults = results.slice(0, 50);

	return json({ principals: limitedResults });
};
