import { json } from '@sveltejs/kit';
import { getIdentity, getOurLineage } from '$lib/server/lineage/identity.js';
import type { RequestHandler } from './$types.js';

/**
 * GET /api/lineage
 * Returns this society's identity and lineage information
 */
export const GET: RequestHandler = async () => {
	const identity = getIdentity();

	if (!identity) {
		return json(
			{ error: 'Society identity not initialized' },
			{ status: 404 }
		);
	}

	const lineage = getOurLineage();

	return json({
		handle: identity.handle,
		uuid: identity.uuid,
		public_key: identity.public_key,
		parent_handle: identity.parent_handle,
		founded_at: identity.founded_at,
		lineage: lineage,
		founding_record: identity.founding_record_json ? JSON.parse(identity.founding_record_json) : null
	});
};
