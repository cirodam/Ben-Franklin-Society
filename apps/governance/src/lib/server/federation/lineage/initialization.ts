import { db } from '../../db.js';
import { verifyFoundingRecord } from './verification.js';
import { type FoundingRecord } from './identity.js';
import { registerWithFederation } from '../client.js';
import { cacheSociety } from '../societies.js';

/**
 * Initialize this society as a child with a founding record from parent
 * This is called once when a new society is founded
 */
export async function initializeAsChild(params: {
	handle: string;
	uuid: string;
	publicKey: string;
	privateKeyEncrypted: string;
	foundingRecord: FoundingRecord;
	endpoint: string;
	registerWithFed?: boolean;
}): Promise<{
	success: boolean;
	verified: boolean;
	registered_with_federation: boolean;
}> {
	const { handle, uuid, publicKey, privateKeyEncrypted, foundingRecord, endpoint, registerWithFed = true } = params;

	// Verify the founding record signature
	const verified = verifyFoundingRecord(foundingRecord);
	if (!verified) {
		throw new Error('Invalid founding record signature');
	}

	// Verify that the founding record matches our details
	if (foundingRecord.child.handle !== handle) {
		throw new Error('Founding record handle does not match');
	}

	if (foundingRecord.child.uuid !== uuid) {
		throw new Error('Founding record UUID does not match');
	}

	if (foundingRecord.child.public_key !== publicKey) {
		throw new Error('Founding record public key does not match');
	}

	// Store in society_identity table
	const stmt = db.prepare(/* sql */ `
		INSERT INTO society_identity (
			handle,
			uuid,
			public_key,
			private_key_encrypted,
			parent_uuid,
			founding_record_json,
			founded_at
		) VALUES (?, ?, ?, ?, ?, ?, ?)
	`);

	const foundedAt = Math.floor(new Date(foundingRecord.founded_at).getTime() / 1000);

	stmt.run(
		handle,
		uuid,
		publicKey,
		privateKeyEncrypted,
		foundingRecord.parent.uuid,
		JSON.stringify(foundingRecord),
		foundedAt
	);

	// Cache parent society
	cacheSociety({
		uuid: foundingRecord.parent.uuid,
		handle: foundingRecord.parent.handle,
		publicKey: foundingRecord.parent.public_key,
		parentUuid: null, // Parent is likely root or we don't know their parent yet
		lineageJson: JSON.stringify([foundingRecord.parent.handle])
	});

	// Register with Federation
	let registeredWithFederation = false;
	if (registerWithFed) {
		try {
			await registerWithFederation({
				foundingRecord,
				endpoint
			});
			registeredWithFederation = true;
		} catch (error) {
			console.error('Failed to register with Federation:', error);
			// Continue anyway - Federation is optional
		}
	}

	return {
		success: true,
		verified,
		registered_with_federation: registeredWithFederation
	};
}

/**
 * Initialize as root society (no parent)
 * Only used for the founding society (Philadelphia)
 */
export function initializeAsRoot(params: {
	handle: string;
	uuid: string;
	publicKey: string;
	privateKeyEncrypted: string;
}): void {
	const { handle, uuid, publicKey, privateKeyEncrypted } = params;

	// Check if already initialized
	const checkStmt = db.prepare('SELECT COUNT(*) as count FROM society_identity');
	const check = checkStmt.get() as { count: number };

	if (check.count > 0) {
		throw new Error('Society identity already initialized');
	}

	const stmt = db.prepare(/* sql */ `
		INSERT INTO society_identity (
			handle,
			uuid,
			public_key,
			private_key_encrypted,
			parent_uuid,
			founding_record_json,
			founded_at
		) VALUES (?, ?, ?, ?, NULL, NULL, ?)
	`);

	const now = Math.floor(Date.now() / 1000);

	stmt.run(handle, uuid, publicKey, privateKeyEncrypted, now);
}

/**
 * Check if society is already initialized
 */
export function isInitialized(): boolean {
	const stmt = db.prepare('SELECT COUNT(*) as count FROM society_identity');
	const row = stmt.get() as { count: number };
	return row.count > 0;
}

/**
 * Get initialization status
 */
export function getInitializationStatus(): {
	initialized: boolean;
	handle?: string;
	is_root?: boolean;
	parent_uuid?: string;
	founded_at?: number;
} {
	const stmt = db.prepare(/* sql */ `
		SELECT handle, parent_uuid, founded_at
		FROM society_identity
		LIMIT 1
	`);

	const row = stmt.get() as
		| { handle: string; parent_uuid: string | null; founded_at: number }
		| undefined;

	if (!row) {
		return { initialized: false };
	}

	return {
		initialized: true,
		handle: row.handle,
		is_root: row.parent_uuid === null,
		parent_uuid: row.parent_uuid || undefined,
		founded_at: row.founded_at
	};
}
