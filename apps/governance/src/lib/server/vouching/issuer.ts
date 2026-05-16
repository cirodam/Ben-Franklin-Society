import { db } from '../db.js';
import { randomUUID } from 'crypto';
import { getIdentity, signMessage } from '../lineage/identity.js';

export type VouchType = 'general' | 'banking' | 'governance' | 'technical';
export type Confidence = 'strong' | 'moderate' | 'weak';

export interface VouchCredential {
	type: 'society_vouch';
	vouch_id: string;
	voucher: {
		handle: string;
		public_key: string;
	};
	vouched_for: string;
	vouch_type: VouchType;
	confidence: Confidence;
	statement: string;
	issued_at: string;
	signature: string;
}

/**
 * Issue a vouch credential for another society
 * This creates a signed credential that the vouched society can present
 */
export function issueVouch(params: {
	vouchedFor: string;
	vouchType: VouchType;
	confidence: Confidence;
	statement: string;
}): VouchCredential {
	const { vouchedFor, vouchType, confidence, statement } = params;

	// Get our identity
	const identity = getIdentity();
	if (!identity) {
		throw new Error('Society identity not initialized');
	}

	const vouchId = randomUUID();
	const issuedAt = new Date().toISOString();

	// Create the credential (without signature first)
	const credential: Omit<VouchCredential, 'signature'> = {
		type: 'society_vouch',
		vouch_id: vouchId,
		voucher: {
			handle: identity.handle,
			public_key: identity.public_key
		},
		vouched_for: vouchedFor,
		vouch_type: vouchType,
		confidence,
		statement,
		issued_at: issuedAt
	};

	// Sign the credential
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

	const signature = signMessage(message);

	const fullCredential: VouchCredential = {
		...credential,
		signature
	};

	// Store in our database
	const stmt = db.prepare(/* sql */ `
		INSERT INTO vouches_issued (
			vouch_id,
			vouched_for_handle,
			vouch_type,
			confidence,
			statement,
			issued_at,
			currently_valid,
			signature
		) VALUES (?, ?, ?, ?, ?, ?, 1, ?)
	`);

	const timestamp = Math.floor(new Date(issuedAt).getTime() / 1000);

	stmt.run(
		vouchId,
		vouchedFor,
		vouchType,
		confidence,
		statement,
		timestamp,
		signature
	);

	return fullCredential;
}

/**
 * Invalidate a vouch we previously issued
 */
export function invalidateVouch(vouchId: string, reason: string): boolean {
	const stmt = db.prepare(/* sql */ `
		UPDATE vouches_issued
		SET currently_valid = 0,
		    invalidated_at = ?,
		    invalidation_reason = ?
		WHERE vouch_id = ? AND currently_valid = 1
	`);

	const now = Math.floor(Date.now() / 1000);
	const result = stmt.run(now, reason, vouchId);

	return result.changes > 0;
}

/**
 * Get all vouches we've issued
 */
export function getIssuedVouches(params?: {
	vouchedFor?: string;
	currentlyValid?: boolean;
}): Array<{
	vouch_id: string;
	vouched_for_handle: string;
	vouch_type: VouchType;
	confidence: Confidence;
	statement: string | null;
	issued_at: number;
	currently_valid: boolean;
	invalidated_at: number | null;
	invalidation_reason: string | null;
}> {
	let sql = 'SELECT * FROM vouches_issued WHERE 1=1';
	const sqlParams: unknown[] = [];

	if (params?.vouchedFor) {
		sql += ' AND vouched_for_handle = ?';
		sqlParams.push(params.vouchedFor);
	}

	if (params?.currentlyValid !== undefined) {
		sql += ' AND currently_valid = ?';
		sqlParams.push(params.currentlyValid ? 1 : 0);
	}

	sql += ' ORDER BY issued_at DESC';

	const stmt = db.prepare(sql);
	const rows = stmt.all(...sqlParams) as Array<{
		vouch_id: string;
		vouched_for_handle: string;
		vouch_type: VouchType;
		confidence: Confidence;
		statement: string | null;
		issued_at: number;
		currently_valid: number;
		invalidated_at: number | null;
		invalidation_reason: string | null;
	}>;

	return rows.map((row) => ({
		...row,
		currently_valid: Boolean(row.currently_valid)
	}));
}

/**
 * Get a specific vouch by ID
 */
export function getVouchById(vouchId: string): {
	vouch_id: string;
	vouched_for_handle: string;
	vouch_type: VouchType;
	confidence: Confidence;
	statement: string | null;
	issued_at: number;
	currently_valid: boolean;
	invalidated_at: number | null;
	invalidation_reason: string | null;
	signature: string;
} | null {
	const stmt = db.prepare('SELECT * FROM vouches_issued WHERE vouch_id = ?');
	const row = stmt.get(vouchId) as
		| {
				vouch_id: string;
				vouched_for_handle: string;
				vouch_type: VouchType;
				confidence: Confidence;
				statement: string | null;
				issued_at: number;
				currently_valid: number;
				invalidated_at: number | null;
				invalidation_reason: string | null;
				signature: string;
		  }
		| undefined;

	if (!row) return null;

	return {
		...row,
		currently_valid: Boolean(row.currently_valid)
	};
}
