import type { PageServerLoad } from './$types.js';
import { getIdentity } from '$lib/server/federation/lineage/identity.js';
import { isInitialized } from '$lib/server/federation/lineage/initialization.js';

export const load: PageServerLoad = async () => {
	const initialized = isInitialized();
	
	if (!initialized) {
		return {
			initialized: false,
			identity: null,
			lineage: [],
			foundingRecord: null
		};
	}

	const identity = getIdentity();
	
	if (!identity) {
		return {
			initialized: false,
			identity: null,
			lineage: [],
			foundingRecord: null
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

	// Build lineage chain from founding record
	const lineage = [];
	
	if (foundingRecord) {
		// We are a child society
		lineage.push({
			handle: identity.handle,
			uuid: identity.uuid,
			public_key: identity.public_key,
			founded_at: identity.founded_at,
			is_root: false
		});

		// Add parent from founding record
		lineage.push({
			handle: foundingRecord.parent.handle,
			uuid: foundingRecord.parent.uuid,
			public_key: foundingRecord.parent.public_key,
			founded_at: null, // Don't have parent's founding date
			is_root: false // May not be root, but we don't know
		});
	} else {
		// We are the root society
		lineage.push({
			handle: identity.handle,
			uuid: identity.uuid,
			public_key: identity.public_key,
			founded_at: identity.founded_at,
			is_root: true
		});
	}

	return {
		initialized: true,
		identity: {
			handle: identity.handle,
			uuid: identity.uuid,
			public_key: identity.public_key,
			parent_handle: identity.parent_handle,
			founded_at: identity.founded_at,
			is_root: !identity.parent_handle
		},
		lineage,
		foundingRecord
	};
};
