import { json } from '@sveltejs/kit';
import { getFoundedChildren } from '$lib/server/federation/lineage/founding.js';
import type { RequestHandler } from './$types.js';

/**
 * GET /api/children
 * Returns societies that this society has founded
 */
export const GET: RequestHandler = async () => {
	const children = getFoundedChildren();

	return json({
		children: children.map((child) => ({
			handle: child.handle,
			uuid: child.uuid,
			public_key: child.public_key,
			founded_at: child.founded_at
		})),
		total: children.length
	});
};
