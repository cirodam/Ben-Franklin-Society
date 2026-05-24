/**
 * Query functions for the petition system (read operations)
 */

import { db } from '../../db.js';
import type { Petition, PetitionWithSignatures } from './types.js';

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
