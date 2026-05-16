import { json } from '@sveltejs/kit';
import { listCachedSocieties } from '$lib/server/federation/client.js';
import type { RequestHandler } from './$types.js';

/**
 * GET /api/societies
 * List known societies sorted by distance or interaction
 * Query params: ?sort=distance|interaction&lat=39.9&lon=-82.9&limit=50
 */
export const GET: RequestHandler = async ({ url }) => {
	const sort = (url.searchParams.get('sort') || 'interaction') as 'distance' | 'interaction';
	const lat = url.searchParams.get('lat');
	const lon = url.searchParams.get('lon');
	const limit = parseInt(url.searchParams.get('limit') || '50');

	const societies = listCachedSocieties({
		sort,
		latitude: lat ? parseFloat(lat) : undefined,
		longitude: lon ? parseFloat(lon) : undefined,
		limit: Math.min(limit, 100)
	});

	return json({
		societies: societies.map((s) => ({
			handle: s.handle,
			endpoint: s.endpoint,
			latitude: s.latitude,
			longitude: s.longitude,
			last_interaction: s.last_interaction,
			interaction_count: s.interaction_count,
			lineage: s.lineage_json ? JSON.parse(s.lineage_json) : []
		}))
	});
};
