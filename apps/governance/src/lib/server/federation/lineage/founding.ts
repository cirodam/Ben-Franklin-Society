import { db } from '../../db.js';
import { randomUUID } from 'crypto';
import { getIdentity, signMessageWithOurKey, type FoundingRecord } from './identity.js';
import { registerWithFederation } from '../client.js';

export interface ChildSocietyProposal {
	handle: string;
	public_key: string;
	endpoint: string;
	latitude?: number;
	longitude?: number;
}

/**
 * Create a founding record for a child society
 * Parent signs the record to attest to the child's legitimacy
 */
export function createFoundingRecord(params: {
	childHandle: string;
	childUuid: string;
	childPublicKey: string;
}): FoundingRecord {
	const { childHandle, childUuid, childPublicKey } = params;

	// Get our identity
	const identity = getIdentity();
	if (!identity) {
		throw new Error('Society identity not initialized');
	}

	const foundedAt = new Date().toISOString();

	// Create the record (without signature first)
	const record: Omit<FoundingRecord, 'signature'> = {
		type: 'society_founding',
		parent: {
			handle: identity.handle,
			uuid: identity.uuid,
			public_key: identity.public_key
		},
		child: {
			handle: childHandle,
			uuid: childUuid,
			public_key: childPublicKey
		},
		founded_at: foundedAt,
		parent_attestation: `The ${identity.handle} society hereby attests to the founding of ${childHandle} society on ${foundedAt}.`
	};

	// Sign the record
	const message = JSON.stringify({
		type: record.type,
		parent: record.parent,
		child: record.child,
		founded_at: record.founded_at,
		parent_attestation: record.parent_attestation
	});

	const signature = signMessageWithOurKey(message);

	const fullRecord: FoundingRecord = {
		...record,
		signature
	};

	return fullRecord;
}

/**
 * Found a child society
 * Creates founding record, stores it locally, and optionally registers with Federation
 */
export async function foundChildSociety(params: {
	proposal: ChildSocietyProposal;
	registerWithFed?: boolean;
}): Promise<{
	founding_record: FoundingRecord;
	child_uuid: string;
	registered_with_federation: boolean;
}> {
	const { proposal, registerWithFed = true } = params;

	// Generate UUID for child
	const childUuid = randomUUID();

	// Create founding record
	const foundingRecord = createFoundingRecord({
		childHandle: proposal.handle,
		childUuid,
		childPublicKey: proposal.public_key
	});

	// Get our identity for parent_uuid
	const identity = getIdentity();
	if (!identity) throw new Error('Society identity not initialized');

	// Store child in societies table
	const stmt = db.prepare(/* sql */ `
		INSERT INTO societies (
			uuid,
			handle,
			public_key,
			parent_uuid,
			url,
			founding_record_json,
			founded_at,
			lineage_json,
			latitude,
			longitude,
			last_interaction
		) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
	`);

	const foundedAt = Math.floor(new Date(foundingRecord.founded_at).getTime() / 1000);

	// Child's lineage is our lineage + them
	const ourLineage = identity?.lineage || [identity?.handle || ''];
	const childLineage = [proposal.handle, ...ourLineage];

	const now = Math.floor(Date.now() / 1000);

	stmt.run(
		childUuid,
		proposal.handle,
		proposal.public_key,
		identity.uuid, // parent_uuid (we are their parent)
		proposal.endpoint, // store as url
		JSON.stringify(foundingRecord),
		foundedAt,
		JSON.stringify(childLineage),
		proposal.latitude || null,
		proposal.longitude || null,
		now
	);

	// Register with Federation
	let registeredWithFederation = false;
	if (registerWithFed) {
		try {
			await registerWithFederation({
				foundingRecord,
				endpoint: proposal.endpoint
			});
			registeredWithFederation = true;
		} catch (error) {
			console.error('Failed to register with Federation:', error);
			// Continue anyway - Federation is optional for discovery
		}
	}

	return {
		founding_record: foundingRecord,
		child_uuid: childUuid,
		registered_with_federation: registeredWithFederation
	};
}

/**
 * Get all children societies we've founded
 */
export function getFoundedChildren(): Array<{
	handle: string;
	uuid: string;
	public_key: string;
	founded_at: number;
	founding_record: FoundingRecord;
}> {
	const identity = getIdentity();
	if (!identity) return [];

	const stmt = db.prepare(/* sql */ `
		SELECT handle, uuid, public_key, founded_at, founding_record_json
		FROM societies
		WHERE parent_uuid = ?
		ORDER BY founded_at DESC
	`);

	const rows = stmt.all(identity.uuid) as Array<{
		handle: string;
		uuid: string;
		public_key: string;
		founded_at: number;
		founding_record_json: string;
	}>;

	return rows.map((row) => ({
		handle: row.handle,
		uuid: row.uuid,
		public_key: row.public_key,
		founded_at: row.founded_at,
		founding_record: JSON.parse(row.founding_record_json) as FoundingRecord
	}));
}

/**
 * Get a specific child by handle
 */
export function getChildByHandle(handle: string): {
	handle: string;
	uuid: string;
	public_key: string;
	founded_at: number;
	founding_record: FoundingRecord;
} | null {
	const identity = getIdentity();
	if (!identity) return null;

	const stmt = db.prepare(/* sql */ `
		SELECT handle, uuid, public_key, founded_at, founding_record_json
		FROM societies
		WHERE parent_uuid = ? AND handle = ?
	`);

	const row = stmt.get(identity.uuid, handle) as
		| {
				handle: string;
				uuid: string;
				public_key: string;
				founded_at: number;
				founding_record_json: string;
		  }
		| undefined;

	if (!row) return null;

	return {
		handle: row.handle,
		uuid: row.uuid,
		public_key: row.public_key,
		founded_at: row.founded_at,
		founding_record: JSON.parse(row.founding_record_json) as FoundingRecord
	};
}

/**
 * Check if a handle is available (not already used by one of our children)
 */
export function isHandleAvailable(handle: string): boolean {
	const identity = getIdentity();
	if (!identity) return true; // If no identity, any handle is "available"

	const stmt = db.prepare('SELECT COUNT(*) as count FROM societies WHERE parent_uuid = ? AND handle = ?');
	const row = stmt.get(identity.uuid, handle) as { count: number };
	return row.count === 0;
}
