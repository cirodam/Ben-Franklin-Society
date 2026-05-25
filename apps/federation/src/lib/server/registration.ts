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
 * Register a new society in the Federation index (simplified - no verification yet)
 */
export function registerSociety(params: {
	foundingRecord: FoundingRecord;
	bfsUrl?: string;
	url?: string;
	ipAddress?: string;
	port?: number;
}): { success: boolean; error?: string } {
	const { foundingRecord, bfsUrl, url, ipAddress, port = 5173 } = params;

	// TODO: Verify the parent's signature (skipped for now to simplify bootstrapping)
	// if (!verifyFoundingRecord(foundingRecord)) {
	//   return { success: false, error: 'Invalid founding record signature' };
	// }

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

	// Register the society (skip parent verification for now)
	const foundedAt = Math.floor(new Date(foundingRecord.founded_at).getTime() / 1000);
	
	// Detect self-founded societies (parent === child)
	const isSelfFounded = foundingRecord.parent.uuid === foundingRecord.child.uuid;
	const parentUuid = isSelfFounded ? null : foundingRecord.parent.uuid;

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
		parentUuid,
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
