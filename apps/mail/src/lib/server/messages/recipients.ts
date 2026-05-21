import { randomUUID } from 'node:crypto';
import { db } from '../db.js';
import { lookupPersonByHandle, lookupAssociationByHandle } from '../governance-api.js';
import { ensureMailbox } from '../mailboxes.js';

// ---------------------------------------------------------------------------
// Resolve Handle - Convert @handle to owner UUID
// ---------------------------------------------------------------------------

export async function resolveHandle(
	handle: string
): Promise<{ owner_uuid: string; handle_cache: string } | null> {
	const clean = handle.toLowerCase().replace(/^@/, '').trim();
	if (!clean) return null;

	// Try to find person
	const person = await lookupPersonByHandle(clean);
	if (person && person.status !== 'revoked') {
		// Auto-provision mailbox if it doesn't exist
		ensureMailbox(person.uuid, person.handle);
		
		const box = db
			.prepare(`SELECT 1 FROM mailbox WHERE principal_uuid = ? AND status = 'active'`)
			.get(person.uuid);
		if (box) return { owner_uuid: person.uuid, handle_cache: person.handle };
	}

	// Try to find association
	const assoc = await lookupAssociationByHandle(clean);
	if (assoc && assoc.status !== 'dissolved') {
		// Auto-provision mailbox if it doesn't exist
		ensureMailbox(assoc.uuid, assoc.handle);
		
		const box = db
			.prepare(`SELECT 1 FROM mailbox WHERE principal_uuid = ? AND status = 'active'`)
			.get(assoc.uuid);
		if (box) return { owner_uuid: assoc.uuid, handle_cache: assoc.handle };
	}

	return null;
}

// ---------------------------------------------------------------------------
// Insert Report - Report a message for moderation
// ---------------------------------------------------------------------------

export function insertReport(
	message_uuid: string,
	reporter_uuid: string,
	reason: string
): void {
	// Enforce one report per member per message in application code
	const existing = db
		.prepare(
			'SELECT 1 FROM message_report WHERE message_uuid = ? AND reporter_uuid = ? LIMIT 1'
		)
		.get(message_uuid, reporter_uuid);
	if (existing) return;

	db.prepare(
		`INSERT INTO message_report (uuid, message_uuid, reporter_uuid, reason, status, created_at)
     VALUES (?, ?, ?, ?, 'pending', ?)`
	).run(randomUUID(), message_uuid, reporter_uuid, reason, new Date().toISOString());
}
