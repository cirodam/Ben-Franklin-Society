import { randomUUID } from 'crypto';
import { db } from '../db.js';

export interface Petition {
	uuid: string;
	title: string;
	body: string;
	created_by_uuid: string;
	created_at: string;
	status: 'open' | 'responded' | 'withdrawn';
	responded_at: string | null;
	responded_by_uuid: string | null;
	response_body: string | null;
	related_motion_uuid: string | null;
}

export interface PetitionSignature {
	petition_uuid: string;
	person_uuid: string;
	signed_at: string;
	unsigned_at: string | null;
}

export interface PetitionWithSignatures extends Petition {
	signature_count: number;
	current_signatures: Array<{
		person_uuid: string;
		person_handle: string;
		signed_at: string;
	}>;
	is_signed_by?: string | null; // person_uuid if provided
}

/**
 * Get a petition by UUID
 */
export function getPetitionByUuid(uuid: string): Petition | null {
	const stmt = db.prepare('SELECT * FROM petition WHERE uuid = ?');
	return (stmt.get(uuid) as Petition | undefined) ?? null;
}

/**
 * List petitions with optional filters
 */
export function listPetitions(opts: {
	status?: Petition['status'];
	personUuid?: string;
} = {}): PetitionWithSignatures[] {
	let sql = `
		SELECT 
			p.*,
			COUNT(CASE WHEN ps.unsigned_at IS NULL THEN 1 END) as signature_count
		FROM petition p
		LEFT JOIN petition_signature ps ON p.uuid = ps.petition_uuid
		WHERE 1=1
	`;
	const params: any[] = [];

	if (opts.status) {
		sql += ' AND p.status = ?';
		params.push(opts.status);
	}

	sql += ' GROUP BY p.uuid ORDER BY p.created_at DESC';

	const stmt = db.prepare(sql);
	const petitions = stmt.all(...params) as PetitionWithSignatures[];

	// Enrich with signature details
	for (const petition of petitions) {
		const sigStmt = db.prepare(`
			SELECT ps.person_uuid, p.handle as person_handle, ps.signed_at
			FROM petition_signature ps
			JOIN person p ON ps.person_uuid = p.uuid
			WHERE ps.petition_uuid = ? AND ps.unsigned_at IS NULL
			ORDER BY ps.signed_at DESC
		`);
		petition.current_signatures = sigStmt.all(petition.uuid) as any[];

		if (opts.personUuid) {
			const checkStmt = db.prepare(`
				SELECT 1 FROM petition_signature 
				WHERE petition_uuid = ? AND person_uuid = ? AND unsigned_at IS NULL
			`);
			petition.is_signed_by = checkStmt.get(petition.uuid, opts.personUuid)
				? opts.personUuid
				: null;
		}
	}

	return petitions;
}

/**
 * Create a new petition
 */
export function createPetition(input: {
	title: string;
	body: string;
	created_by_uuid: string;
}): Petition {
	const uuid = randomUUID();
	const now = new Date().toISOString();

	const stmt = db.prepare(`
		INSERT INTO petition (uuid, title, body, created_by_uuid, created_at, status)
		VALUES (?, ?, ?, ?, ?, 'open')
	`);

	stmt.run(uuid, input.title, input.body, input.created_by_uuid, now);

	return getPetitionByUuid(uuid)!;
}

/**
 * Sign a petition
 */
export function signPetition(petitionUuid: string, personUuid: string): void {
	const now = new Date().toISOString();

	// Check if already signed
	const checkStmt = db.prepare(`
		SELECT unsigned_at FROM petition_signature 
		WHERE petition_uuid = ? AND person_uuid = ?
	`);
	const existing = checkStmt.get(petitionUuid, personUuid) as
		| { unsigned_at: string | null }
		| undefined;

	if (existing) {
		if (existing.unsigned_at === null) {
			// Already signed and active
			return;
		}
		// Previously unsigned, update to re-sign
		const updateStmt = db.prepare(`
			UPDATE petition_signature 
			SET unsigned_at = NULL, signed_at = ?
			WHERE petition_uuid = ? AND person_uuid = ?
		`);
		updateStmt.run(now, petitionUuid, personUuid);
	} else {
		// New signature
		const insertStmt = db.prepare(`
			INSERT INTO petition_signature (petition_uuid, person_uuid, signed_at)
			VALUES (?, ?, ?)
		`);
		insertStmt.run(petitionUuid, personUuid, now);
	}
}

/**
 * Unsign a petition
 */
export function unsignPetition(petitionUuid: string, personUuid: string): void {
	const now = new Date().toISOString();

	const stmt = db.prepare(`
		UPDATE petition_signature 
		SET unsigned_at = ?
		WHERE petition_uuid = ? AND person_uuid = ? AND unsigned_at IS NULL
	`);
	stmt.run(now, petitionUuid, personUuid);
}

/**
 * Respond to a petition (assembly action)
 */
export function respondToPetition(input: {
	petitionUuid: string;
	respondedByUuid: string;
	responseBody: string;
	relatedMotionUuid?: string;
}): Petition {
	const now = new Date().toISOString();

	const stmt = db.prepare(`
		UPDATE petition 
		SET status = 'responded',
		    responded_at = ?,
		    responded_by_uuid = ?,
		    response_body = ?,
		    related_motion_uuid = ?
		WHERE uuid = ?
	`);

	stmt.run(
		now,
		input.respondedByUuid,
		input.responseBody,
		input.relatedMotionUuid ?? null,
		input.petitionUuid
	);

	return getPetitionByUuid(input.petitionUuid)!;
}

/**
 * Withdraw a petition (creator action)
 */
export function withdrawPetition(petitionUuid: string): Petition {
	const stmt = db.prepare(`
		UPDATE petition 
		SET status = 'withdrawn'
		WHERE uuid = ?
	`);

	stmt.run(petitionUuid);

	return getPetitionByUuid(petitionUuid)!;
}

/**
 * Get signature count for a petition
 */
export function getSignatureCount(petitionUuid: string): number {
	const stmt = db.prepare(`
		SELECT COUNT(*) as count 
		FROM petition_signature 
		WHERE petition_uuid = ? AND unsigned_at IS NULL
	`);
	return (stmt.get(petitionUuid) as { count: number }).count;
}

/**
 * Check if a person has signed a petition
 */
export function hasSignedPetition(petitionUuid: string, personUuid: string): boolean {
	const stmt = db.prepare(`
		SELECT 1 FROM petition_signature 
		WHERE petition_uuid = ? AND person_uuid = ? AND unsigned_at IS NULL
	`);
	return !!stmt.get(petitionUuid, personUuid);
}
