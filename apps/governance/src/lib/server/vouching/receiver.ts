import { db } from '../db.js';
import { verifySignature } from '../lineage/identity.js';
import type { VouchCredential, VouchType } from './issuer.js';

/**
 * Store a vouch credential that another society has issued to us
 */
export function storeCredential(credential: VouchCredential): void {
	// Verify the signature before storing
	const message = JSON.stringify({
		type: credential.type,
		vouch_id: credential.vouch_id,
		voucher: credential.voucher,
		vouched_for: credential.vouched_for,
		vouch_type: credential.vouch_type,
		confidence: credential.confidence,
		statement: credential.statement,
		issued_at: credential.issued_at
	});

	const isValid = verifySignature(message, credential.signature, credential.voucher.public_key);

	if (!isValid) {
		throw new Error('Invalid credential signature');
	}

	const stmt = db.prepare(/* sql */ `
		INSERT INTO vouch_credentials (
			credential_id,
			voucher_handle,
			voucher_public_key,
			vouch_type,
			statement,
			issued_at,
			signature,
			verified
		) VALUES (?, ?, ?, ?, ?, ?, ?, 1)
		ON CONFLICT(credential_id) DO UPDATE SET
			voucher_handle = excluded.voucher_handle,
			voucher_public_key = excluded.voucher_public_key,
			vouch_type = excluded.vouch_type,
			statement = excluded.statement,
			issued_at = excluded.issued_at,
			signature = excluded.signature,
			verified = excluded.verified
	`);

	const timestamp = Math.floor(new Date(credential.issued_at).getTime() / 1000);

	stmt.run(
		credential.vouch_id,
		credential.voucher.handle,
		credential.voucher.public_key,
		credential.vouch_type,
		credential.statement,
		timestamp,
		credential.signature
	);
}

/**
 * Get all vouch credentials we hold (vouches others have given us)
 */
export function getCredentials(params?: {
	voucher?: string;
	vouchType?: VouchType;
	verified?: boolean;
}): Array<{
	credential_id: string;
	voucher_handle: string;
	voucher_public_key: string;
	vouch_type: VouchType;
	statement: string | null;
	issued_at: number;
	signature: string;
	verified: boolean;
	created_at: number;
}> {
	let sql = 'SELECT * FROM vouch_credentials WHERE 1=1';
	const sqlParams: unknown[] = [];

	if (params?.voucher) {
		sql += ' AND voucher_handle = ?';
		sqlParams.push(params.voucher);
	}

	if (params?.vouchType) {
		sql += ' AND vouch_type = ?';
		sqlParams.push(params.vouchType);
	}

	if (params?.verified !== undefined) {
		sql += ' AND verified = ?';
		sqlParams.push(params.verified ? 1 : 0);
	}

	sql += ' ORDER BY issued_at DESC';

	const stmt = db.prepare(sql);
	const rows = stmt.all(...sqlParams) as Array<{
		credential_id: string;
		voucher_handle: string;
		voucher_public_key: string;
		vouch_type: VouchType;
		statement: string | null;
		issued_at: number;
		signature: string;
		verified: number;
		created_at: number;
	}>;

	return rows.map((row) => ({
		...row,
		verified: Boolean(row.verified)
	}));
}

/**
 * Get a specific credential by ID
 */
export function getCredentialById(credentialId: string): {
	credential_id: string;
	voucher_handle: string;
	voucher_public_key: string;
	vouch_type: VouchType;
	statement: string | null;
	issued_at: number;
	signature: string;
	verified: boolean;
	created_at: number;
} | null {
	const stmt = db.prepare('SELECT * FROM vouch_credentials WHERE credential_id = ?');
	const row = stmt.get(credentialId) as
		| {
				credential_id: string;
				voucher_handle: string;
				voucher_public_key: string;
				vouch_type: VouchType;
				statement: string | null;
				issued_at: number;
				signature: string;
				verified: number;
				created_at: number;
		  }
		| undefined;

	if (!row) return null;

	return {
		...row,
		verified: Boolean(row.verified)
	};
}

/**
 * Count credentials by voucher
 */
export function countCredentialsByVoucher(): Array<{
	voucher_handle: string;
	count: number;
}> {
	const stmt = db.prepare(/* sql */ `
		SELECT voucher_handle, COUNT(*) as count
		FROM vouch_credentials
		WHERE verified = 1
		GROUP BY voucher_handle
		ORDER BY count DESC
	`);

	return stmt.all() as Array<{
		voucher_handle: string;
		count: number;
	}>;
}

/**
 * Verify all credentials (re-check signatures)
 * Returns number of credentials that failed verification
 */
export function verifyAllCredentials(): number {
	const credentials = getCredentials();
	let failedCount = 0;

	for (const cred of credentials) {
		// Reconstruct the message for signature verification
		const message = JSON.stringify({
			type: 'society_vouch',
			vouch_id: cred.credential_id,
			voucher: {
				handle: cred.voucher_handle,
				public_key: cred.voucher_public_key
			},
			vouched_for: 'us', // We don't store our handle in the credential
			vouch_type: cred.vouch_type,
			confidence: 'strong', // We don't store confidence
			statement: cred.statement,
			issued_at: new Date(cred.issued_at * 1000).toISOString()
		});

		const isValid = verifySignature(message, cred.signature, cred.voucher_public_key);

		if (!isValid) {
			// Mark as unverified
			const stmt = db.prepare('UPDATE vouch_credentials SET verified = 0 WHERE credential_id = ?');
			stmt.run(cred.credential_id);
			failedCount++;
		}
	}

	return failedCount;
}
