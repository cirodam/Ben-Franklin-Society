import { db } from '../db.js';
import type { Message, Recipient, MessageWithRecipients, ThreadSummary, ThreadMessage } from './types.js';
import { PAGE_SIZE } from './types.js';

// ---------------------------------------------------------------------------
// Inbox - Get received messages grouped by thread
// ---------------------------------------------------------------------------

export function getInbox(
	owner_uuid: string,
	opts: { limit?: number; offset?: number } = {}
): ThreadSummary[] {
	const limit  = opts.limit  ?? PAGE_SIZE + 1;
	const offset = opts.offset ?? 0;
	return db
		.prepare(
			`SELECT
         m.thread_id,
         orig.subject,
         orig.from_handle_cache,
         MAX(m.sent_at)                                                AS latest_at,
         SUM(CASE WHEN mr.read_at IS NULL THEN 1 ELSE 0 END)          AS unread_count
       FROM message_recipient mr
       JOIN message m    ON m.uuid    = mr.message_uuid
       JOIN message orig ON orig.uuid = m.thread_id
       WHERE mr.recipient_owner_uuid = ?
         AND mr.trashed_at IS NULL
         AND mr.archived_at IS NULL
         AND m.status      = 'sent'
         AND m.deleted_at  IS NULL
       GROUP BY m.thread_id
       ORDER BY MAX(m.sent_at) DESC
       LIMIT ? OFFSET ?`
		)
		.all(owner_uuid, limit, offset) as ThreadSummary[];
}

// ---------------------------------------------------------------------------
// Sent - Get messages sent by owner
// ---------------------------------------------------------------------------

export function getSent(
	owner_uuid: string,
	opts: { limit?: number; offset?: number } = {}
): Message[] {
	const limit  = opts.limit  ?? PAGE_SIZE + 1;
	const offset = opts.offset ?? 0;
	return db
		.prepare(
			`SELECT * FROM message
       WHERE from_owner_uuid = ?
         AND status     = 'sent'
         AND deleted_at IS NULL
       ORDER BY sent_at DESC
       LIMIT ? OFFSET ?`
		)
		.all(owner_uuid, limit, offset) as Message[];
}

// ---------------------------------------------------------------------------
// Drafts - Get draft messages
// ---------------------------------------------------------------------------

export function getDrafts(
	owner_uuid: string,
	opts: { limit?: number; offset?: number } = {}
): Message[] {
	const limit  = opts.limit  ?? PAGE_SIZE + 1;
	const offset = opts.offset ?? 0;
	return db
		.prepare(
			`SELECT * FROM message
       WHERE from_owner_uuid = ?
         AND status     = 'draft'
         AND deleted_at IS NULL
       ORDER BY created_at DESC
       LIMIT ? OFFSET ?`
		)
		.all(owner_uuid, limit, offset) as Message[];
}

// ---------------------------------------------------------------------------
// Trash - Get trashed messages
// ---------------------------------------------------------------------------

export function getTrash(
	owner_uuid: string,
	opts: { limit?: number; offset?: number } = {}
): (Message & { trashed_at: string })[] {
	const limit  = opts.limit  ?? PAGE_SIZE + 1;
	const offset = opts.offset ?? 0;
	return db
		.prepare(
			`SELECT m.*, mr.trashed_at
       FROM message_recipient mr
       JOIN message m ON m.uuid = mr.message_uuid
       WHERE mr.recipient_owner_uuid = ?
         AND mr.trashed_at  IS NOT NULL
         AND m.status       = 'sent'
         AND m.deleted_at   IS NULL
       ORDER BY mr.trashed_at DESC
       LIMIT ? OFFSET ?`
		)
		.all(owner_uuid, limit, offset) as (Message & { trashed_at: string })[];
}

// ---------------------------------------------------------------------------
// Archived - Get archived threads
// ---------------------------------------------------------------------------

export function getArchived(
	owner_uuid: string,
	opts: { limit?: number; offset?: number } = {}
): ThreadSummary[] {
	const limit  = opts.limit  ?? PAGE_SIZE + 1;
	const offset = opts.offset ?? 0;
	return db
		.prepare(
			`SELECT
         m.thread_id,
         orig.subject,
         orig.from_handle_cache,
         MAX(m.sent_at)                                                AS latest_at,
         SUM(CASE WHEN mr.read_at IS NULL THEN 1 ELSE 0 END)          AS unread_count
       FROM message_recipient mr
       JOIN message m    ON m.uuid    = mr.message_uuid
       JOIN message orig ON orig.uuid = m.thread_id
       WHERE mr.recipient_owner_uuid = ?
         AND mr.archived_at IS NOT NULL
         AND mr.trashed_at IS NULL
         AND m.status      = 'sent'
         AND m.deleted_at  IS NULL
       GROUP BY m.thread_id
       ORDER BY MAX(mr.archived_at) DESC
       LIMIT ? OFFSET ?`
		)
		.all(owner_uuid, limit, offset) as ThreadSummary[];
}

// ---------------------------------------------------------------------------
// Thread - Get all messages in a thread
// ---------------------------------------------------------------------------

export function getThread(thread_id: string, owner_uuid: string): ThreadMessage[] {
	const rows = db
		.prepare(
			`SELECT m.*,
         mr.read_at,
         mr.trashed_at,
         mr.type AS recipient_type
       FROM message m
       LEFT JOIN message_recipient mr
         ON mr.message_uuid = m.uuid AND mr.recipient_owner_uuid = ?
       WHERE m.thread_id   = ?
         AND m.status      = 'sent'
         AND m.deleted_at  IS NULL
         AND (mr.message_uuid IS NOT NULL OR m.from_owner_uuid = ?)
       ORDER BY m.created_at ASC`
		)
		.all(owner_uuid, thread_id, owner_uuid) as ThreadMessage[];

	const getRecipients = db.prepare(
		`SELECT * FROM message_recipient
     WHERE message_uuid = ? ORDER BY type, recipient_handle_cache`
	);
	for (const row of rows) {
		row.recipients = getRecipients.all(row.uuid) as Recipient[];
	}
	return rows;
}

// ---------------------------------------------------------------------------
// Single Message - Get message with recipients
// ---------------------------------------------------------------------------

export function getMessage(uuid: string): MessageWithRecipients | null {
	const msg = db
		.prepare('SELECT * FROM message WHERE uuid = ?')
		.get(uuid) as Message | undefined;
	if (!msg) return null;
	const recipients = db
		.prepare(
			'SELECT * FROM message_recipient WHERE message_uuid = ? ORDER BY type, recipient_handle_cache'
		)
		.all(uuid) as Recipient[];
	return { ...msg, recipients };
}

// ---------------------------------------------------------------------------
// Unread Count - Get count of unread messages for sidebar badge
// ---------------------------------------------------------------------------

export function getUnreadCount(owner_uuid: string): number {
	const row = db
		.prepare(
			`SELECT COUNT(*) AS n
       FROM message_recipient mr
       JOIN message m ON m.uuid = mr.message_uuid
       WHERE mr.recipient_owner_uuid = ?
         AND mr.read_at    IS NULL
         AND mr.trashed_at IS NULL
         AND m.status      = 'sent'
         AND m.deleted_at  IS NULL`
		)
		.get(owner_uuid) as { n: number };
	return row.n;
}
