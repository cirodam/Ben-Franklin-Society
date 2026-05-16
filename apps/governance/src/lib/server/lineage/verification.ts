import { verifySignature } from './identity.js';
import type { FoundingRecord } from './identity.js';

/**
 * Verify a founding record's cryptographic signature
 * Returns true if the parent's signature is valid
 */
export function verifyFoundingRecord(record: FoundingRecord): boolean {
	// Reconstruct the message that was signed
	const message = JSON.stringify({
		type: record.type,
		parent: record.parent,
		child: record.child,
		founded_at: record.founded_at,
		parent_attestation: record.parent_attestation
	});

	// Verify using parent's public key
	return verifySignature(message, record.signature, record.parent.public_key);
}

/**
 * Verify a complete lineage chain
 * Each society in the chain should have a valid founding record signed by their parent
 * 
 * @param lineageRecords - Array of founding records from child to root
 * @returns true if the entire chain is cryptographically valid
 */
export function verifyLineageChain(lineageRecords: FoundingRecord[]): boolean {
	if (lineageRecords.length === 0) {
		return false;
	}

	// If only one record (root society), just verify its signature
	if (lineageRecords.length === 1) {
		return verifyFoundingRecord(lineageRecords[0]);
	}

	// Verify each record and ensure the chain is connected
	for (let i = 0; i < lineageRecords.length; i++) {
		const record = lineageRecords[i];

		// Verify the signature
		if (!verifyFoundingRecord(record)) {
			return false;
		}

		// If not the last record, verify the chain connection
		// The parent in this record should be the child in the next record
		if (i < lineageRecords.length - 1) {
			const nextRecord = lineageRecords[i + 1];
			if (record.parent.handle !== nextRecord.child.handle) {
				return false; // Chain is broken
			}
			if (record.parent.public_key !== nextRecord.child.public_key) {
				return false; // Public key mismatch
			}
		}
	}

	return true;
}

/**
 * Extract the lineage path (handles only) from a chain of founding records
 * Returns array like ["child", "parent", "grandparent", "root"]
 */
export function extractLineagePath(lineageRecords: FoundingRecord[]): string[] {
	if (lineageRecords.length === 0) {
		return [];
	}

	const path: string[] = [lineageRecords[0].child.handle];

	for (const record of lineageRecords) {
		if (!path.includes(record.parent.handle)) {
			path.push(record.parent.handle);
		}
	}

	return path;
}

/**
 * Verify a society's claimed lineage by checking signatures
 * This is the key function for establishing trust without a central authority
 * 
 * @param claimedLineage - Array of handles the society claims as their lineage
 * @param foundingRecords - The founding records to verify (should match the claimed lineage)
 * @returns true if the lineage is cryptographically valid
 */
export function verifySocietyLineage(
	claimedLineage: string[],
	foundingRecords: FoundingRecord[]
): boolean {
	// Verify the chain is cryptographically valid
	if (!verifyLineageChain(foundingRecords)) {
		return false;
	}

	// Extract the actual lineage from the records
	const actualLineage = extractLineagePath(foundingRecords);

	// Verify the claimed lineage matches the actual lineage
	if (claimedLineage.length !== actualLineage.length) {
		return false;
	}

	for (let i = 0; i < claimedLineage.length; i++) {
		if (claimedLineage[i] !== actualLineage[i]) {
			return false;
		}
	}

	return true;
}
