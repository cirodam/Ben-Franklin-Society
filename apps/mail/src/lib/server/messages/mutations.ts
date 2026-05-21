import { db } from '../db.js';

// ---------------------------------------------------------------------------
// Mark Read - Mark a message as read
// ---------------------------------------------------------------------------

export function markRead(message_uuid: string, owner_uuid: string): void {
	db.prepare(
		`UPDATE message_recipient
     SET read_at = ?
     WHERE message_uuid = ? AND recipient_owner_uuid = ? AND read_at IS NULL`
	).run(new Date().toISOString(), message_uuid, owner_uuid);
}

// ---------------------------------------------------------------------------
// Trash Message - Move message to trash
// ---------------------------------------------------------------------------

export function trashMessage(message_uuid: string, owner_uuid: string): void {
	db.prepare(
		`UPDATE message_recipient
     SET trashed_at = ?
     WHERE message_uuid = ? AND recipient_owner_uuid = ?`
	).run(new Date().toISOString(), message_uuid, owner_uuid);
}

// ---------------------------------------------------------------------------
// Restore Message - Remove from trash
// ---------------------------------------------------------------------------

export function restoreMessage(message_uuid: string, owner_uuid: string): void {
	db.prepare(
		`UPDATE message_recipient
     SET trashed_at = NULL
     WHERE message_uuid = ? AND recipient_owner_uuid = ?`
	).run(message_uuid, owner_uuid);
}

// ---------------------------------------------------------------------------
// Permanently Delete - Remove message permanently
// ---------------------------------------------------------------------------

export function permanentlyDelete(message_uuid: string, owner_uuid: string): void {
	db.prepare(
		`DELETE FROM message_recipient
     WHERE message_uuid = ? AND recipient_owner_uuid = ?`
	).run(message_uuid, owner_uuid);
}

// ---------------------------------------------------------------------------
// Archive Thread - Remove thread from inbox but keep for search/archive
// ---------------------------------------------------------------------------

export function archiveThread(thread_id: string, owner_uuid: string): void {
	db.prepare(
		`UPDATE message_recipient
     SET archived_at = ?
     WHERE message_uuid IN (SELECT uuid FROM message WHERE thread_id = ?)
       AND recipient_owner_uuid = ?
       AND archived_at IS NULL`
	).run(new Date().toISOString(), thread_id, owner_uuid);
}

// ---------------------------------------------------------------------------
// Unarchive Thread - Return thread to inbox
// ---------------------------------------------------------------------------

export function unarchiveThread(thread_id: string, owner_uuid: string): void {
	db.prepare(
		`UPDATE message_recipient
     SET archived_at = NULL
     WHERE message_uuid IN (SELECT uuid FROM message WHERE thread_id = ?)
       AND recipient_owner_uuid = ?`
	).run(thread_id, owner_uuid);
}
