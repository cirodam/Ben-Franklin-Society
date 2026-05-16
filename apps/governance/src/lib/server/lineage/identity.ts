import { generateKeyPairSync, sign, verify } from 'crypto';
import { db } from '../db.js';
import { randomUUID } from 'crypto';

export interface SocietyIdentity {
	handle: string;
	uuid: string;
	public_key: string;
	parent_handle: string | null;
	founding_record_json: string | null;
	founded_at: number | null;
	created_at: number;
}

export interface FoundingRecord {
	type: 'society_founding';
	parent: {
		handle: string;
		uuid: string;
		public_key: string;
	};
	child: {
		handle: string;
		uuid: string;
		public_key: string;
	};
	founded_at: string;
	parent_attestation: string;
	signature: string; // Parent's signature over the record
}

/**
 * Generate a new ED25519 keypair for society identity
 * Returns public and private keys in PEM format
 */
export function generateIdentityKeypair(): { publicKey: string; privateKey: string } {
	const { publicKey, privateKey } = generateKeyPairSync('ed25519', {
		publicKeyEncoding: { type: 'spki', format: 'pem' },
		privateKeyEncoding: { type: 'pkcs8', format: 'pem' }
	});

	return { publicKey, privateKey };
}

/**
 * Initialize this society's identity (run once at founding)
 * For root society (Philadelphia), parent_handle is null
 */
export function initializeIdentity(params: {
	handle: string;
	privateKeyEncrypted: string; // Already encrypted by caller
	publicKey: string;
	parentHandle?: string;
	foundingRecord?: FoundingRecord;
}): void {
	const uuid = randomUUID();
	const now = Math.floor(Date.now() / 1000);

	const stmt = db.prepare(/* sql */ `
		INSERT INTO society_identity (
			handle,
			uuid,
			public_key,
			private_key_encrypted,
			parent_handle,
			founding_record_json,
			founded_at,
			created_at
		) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
	`);

	stmt.run(
		params.handle,
		uuid,
		params.publicKey,
		params.privateKeyEncrypted,
		params.parentHandle || null,
		params.foundingRecord ? JSON.stringify(params.foundingRecord) : null,
		params.foundingRecord?.founded_at ? new Date(params.foundingRecord.founded_at).getTime() / 1000 : null,
		now
	);
}

/**
 * Get this society's identity
 */
export function getIdentity(): SocietyIdentity | null {
	const stmt = db.prepare(/* sql */ `
		SELECT 
			handle,
			uuid,
			public_key,
			parent_handle,
			founding_record_json,
			founded_at,
			created_at
		FROM society_identity
		LIMIT 1
	`);

	return stmt.get() as SocietyIdentity | null;
}

/**
 * Get this society's lineage by walking up the parent chain
 * Returns array of handles from this society to root: ["us", "parent", "grandparent", "philadelphia"]
 */
export function getOurLineage(): string[] {
	const identity = getIdentity();
	if (!identity) {
		return [];
	}

	const lineage: string[] = [identity.handle];

	if (identity.parent_handle) {
		// TODO: Walk up the parent chain by querying parent endpoints
		// For now, just include parent if we have one
		lineage.push(identity.parent_handle);
	}

	return lineage;
}

/**
 * Get children societies we have founded
 */
export function getChildren(): Array<{
	handle: string;
	uuid: string;
	public_key: string;
	founded_at: number;
}> {
	const stmt = db.prepare(/* sql */ `
		SELECT handle, uuid, public_key, founded_at
		FROM children_societies
		ORDER BY founded_at ASC
	`);

	return stmt.all() as Array<{
		handle: string;
		uuid: string;
		public_key: string;
		founded_at: number;
	}>;
}

/**
 * Record a child society we have founded
 */
export function recordChild(params: {
	handle: string;
	uuid: string;
	publicKey: string;
	foundingRecord: FoundingRecord;
}): void {
	const stmt = db.prepare(/* sql */ `
		INSERT INTO children_societies (
			handle,
			uuid,
			public_key,
			founding_record_json,
			founded_at
		) VALUES (?, ?, ?, ?, ?)
	`);

	const foundedAt = new Date(params.foundingRecord.founded_at).getTime() / 1000;

	stmt.run(
		params.handle,
		params.uuid,
		params.publicKey,
		JSON.stringify(params.foundingRecord),
		foundedAt
	);
}

/**
 * Sign a message with this society's private key
 * Note: In production, private key should be decrypted first
 */
export function signMessage(message: string, privateKeyPem: string): string {
	return sign(null, Buffer.from(message), privateKeyPem).toString('base64');
}

/**
 * Verify a signature using a public key
 */
export function verifySignature(message: string, signature: string, publicKeyPem: string): boolean {
	try {
		return verify(null, Buffer.from(message), publicKeyPem, Buffer.from(signature, 'base64'));
	} catch {
		return false;
	}
}
