/**
 * Mutation functions for the petition system (write operations)
 */

import { randomUUID } from 'crypto';
import { db } from '../../db.js';
import type { Petition } from './types.js';
import { getPetitionByUuid } from './queries.js';

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
