import { db } from './db.js';
import { verify } from 'crypto';
import type { FoundingRecord } from './types.js';
import { lookupSocietyByUuid } from './queries.js';

/**
 * Verify a founding record's cryptographic signature
 */
function verifyFoundingRecord(record: FoundingRecord): boolean {
	const message = JSON.stringify({
		type: record.type,
		parent: record.parent,
		child: record.child,
		founded_at: record.founded_at,
		parent_attestation: record.parent_attestation
	});

	try {
		return verify(null, Buffer.from(message), record.parent.public_key, Buffer.from(record.signature, 'base64'));
	} catch {
		return false;
	}
}

/**
 * Register a new society in the Federation index
 * Verifies the parent's signature on the founding record
 */
export function registerSociety(params: {
	foundingRecord: FoundingRecord;
	bfsUrl?: string;
	url?: string;
	ipAddress?: string;
	port?: number;
}): { success: boolean; error?: string } {
	const { foundingRecord, bfsUrl, url, ipAddress, port = 5173 } = params;

	// Verify the parent's signature
	if (!verifyFoundingRecord(foundingRecord)) {
		return { success: false, error: 'Invalid founding record signature' };
	}

	// Check if uuid is already registered
	const existingByUuid = db.prepare('SELECT uuid FROM societies WHERE uuid = ?').get(foundingRecord.child.uuid);
	if (existingByUuid) {
		return { success: false, error: 'Society UUID already registered' };
	}

	// Check if handle is already registered
	const existingByHandle = db.prepare('SELECT uuid FROM societies WHERE handle = ?').get(foundingRecord.child.handle);
	if (existingByHandle) {
		return { success: false, error: 'Society handle already registered' };
	}

	// If child has a parent, verify parent exists in registry
	if (foundingRecord.parent.uuid) {
		const parent = lookupSocietyByUuid(foundingRecord.parent.uuid);
		if (parent && parent.public_key !== foundingRecord.parent.public_key) {
			return { success: false, error: 'Parent public key mismatch' };
		}
	}

	// Register the society
	const foundedAt = Math.floor(new Date(foundingRecord.founded_at).getTime() / 1000);

	const stmt = db.prepare(/* sql */ `
		INSERT INTO societies (
			uuid,
			handle,
			parent_uuid,
			public_key,
			bfs_url,
			url,
			ip_address,
			port,
			founding_record_json,
			founded_at,
			status
		) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'active')
	`);

	stmt.run(
		foundingRecord.child.uuid,
		foundingRecord.child.handle,
		foundingRecord.parent.uuid || null,
		foundingRecord.child.public_key,
		bfsUrl || null,
		url || null,
		ipAddress || null,
		port,
		JSON.stringify(foundingRecord),
		foundedAt
	);

	return { success: true };
}
