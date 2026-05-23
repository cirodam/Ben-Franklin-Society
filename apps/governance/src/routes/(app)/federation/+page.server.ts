import type { PageServerLoad } from './$types.js';
import { getIdentity, getChildren } from '$lib/server/federation/lineage/identity.js';

export const load: PageServerLoad = async () => {
	const identity = getIdentity();
	const children = getChildren();

	if (!identity) {
		return {
			initialized: false,
			identity: null,
			children: [],
			capacity: {
				current: 0,
				maximum: 5,
				available: true
			}
		};
	}

	// Parse founding record if it exists
	let foundingRecord = null;
	if (identity.founding_record_json) {
		try {
			foundingRecord = JSON.parse(identity.founding_record_json);
		} catch (error) {
			console.error('Failed to parse founding record:', error);
		}
	}

	const MAX_CHILDREN = 5;

	return {
		initialized: true,
		identity: {
			handle: identity.handle,
			uuid: identity.uuid,
			public_key: identity.public_key,
			parent_uuid: identity.parent_uuid,
			founded_at: identity.founded_at,
			is_root: !identity.parent_uuid
		},
		foundingRecord,
		children: children.map(c => ({
			handle: c.handle,
			uuid: c.uuid,
			founded_at: c.founded_at
		})),
		capacity: {
			current: children.length,
			maximum: MAX_CHILDREN,
			available: children.length < MAX_CHILDREN
		}
	};
};
