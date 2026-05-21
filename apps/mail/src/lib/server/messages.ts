import { randomUUID } from 'node:crypto';
import { db } from './db.js';
import { lookupPersonByHandle, lookupAssociationByHandle } from './governance-api.js';
import { ensureMailbox } from './mailboxes.js';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface Message {
	uuid: string;
	from_owner_uuid: string;
	from_handle_cache: string;
	subject: string;
	body: string;
	content_type: 'text/plain' | 'text/markdown';
	thread_id: string;
	reply_to_id: string | null;
	origin: string;
	is_automated: number;
	status: 'draft' | 'sent' | 'deleted';
	created_at: string;
	sent_at: string | null;
	deleted_at: string | null;
}

export interface Recipient {
	uuid: string;
	message_uuid: string;
	recipient_owner_uuid: string;
	recipient_handle_cache: string;
	recipient_society_handle: string | null;
	type: 'to' | 'cc';
	read_at: string | null;
	trashed_at: string | null;
	delivery_status: string | null;
	delivery_error: string | null;
}

export interface MessageWithRecipients extends Message {
	recipients: Recipient[];
}

export interface ThreadSummary {
	thread_id: string;
	subject: string;
	from_handle_cache: string;
	latest_at: string | null;
	unread_count: number;
}

export interface ThreadMessage extends Message {
	/** null if the viewer is the sender, not a recipient */
	read_at: string | null;
	trashed_at: string | null;
	recipient_type: string | null;
	recipients: Recipient[];
}

const PAGE_SIZE = 25;

// ---------------------------------------------------------------------------
// Inbox
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
		.all(principal_uuid, limit, offset) as ThreadSummary[];
}

// ---------------------------------------------------------------------------
// Sent
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
		.all(principal_uuid, limit, offset) as Message[];
}

// ---------------------------------------------------------------------------
// Drafts
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
		.all(principal_uuid, limit, offset) as Message[];
}

// ---------------------------------------------------------------------------
// Trash
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
		.all(principal_uuid, limit, offset) as (Message & { trashed_at: string })[];
}

// ---------------------------------------------------------------------------
// Thread
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
		.all(principal_uuid, thread_id, principal_uuid) as ThreadMessage[];

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
// Single message
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
// Mark read
// ---------------------------------------------------------------------------

export function markRead(message_uuid: string, owner_uuid: string): void {
	db.prepare(
		`UPDATE message_recipient
     SET read_at = ?
     WHERE message_uuid = ? AND recipient_owner_uuid = ? AND read_at IS NULL`
	).run(new Date().toISOString(), message_uuid, principal_uuid);
}

// ---------------------------------------------------------------------------
// Trash / restore / permanently delete
// ---------------------------------------------------------------------------

export function trashMessage(message_uuid: string, owner_uuid: string): void {
	db.prepare(
		`UPDATE message_recipient
     SET trashed_at = ?
     WHERE message_uuid = ? AND recipient_owner_uuid = ?`
	).run(new Date().toISOString(), message_uuid, principal_uuid);
}

export function restoreMessage(message_uuid: string, owner_uuid: string): void {
	db.prepare(
		`UPDATE message_recipient
     SET trashed_at = NULL
     WHERE message_uuid = ? AND recipient_owner_uuid = ?`
	).run(message_uuid, principal_uuid);
}

export function permanentlyDelete(message_uuid: string, owner_uuid: string): void {
	db.prepare(
		`DELETE FROM message_recipient
     WHERE message_uuid = ? AND recipient_owner_uuid = ?`
	).run(message_uuid, principal_uuid);
}

// ---------------------------------------------------------------------------
// Archive / unarchive (inbox management)
// ---------------------------------------------------------------------------

/**
 * Archive a thread (removes from inbox but keeps for search/archive view).
 * Archives all messages in the thread for this recipient.
 */
export function archiveThread(thread_id: string, owner_uuid: string): void {
	db.prepare(
		`UPDATE message_recipient
     SET archived_at = ?
     WHERE message_uuid IN (SELECT uuid FROM message WHERE thread_id = ?)
       AND recipient_owner_uuid = ?
       AND archived_at IS NULL`
	).run(new Date().toISOString(), thread_id, principal_uuid);
}

/**
 * Unarchive a thread (return to inbox).
 */
export function unarchiveThread(thread_id: string, owner_uuid: string): void {
	db.prepare(
		`UPDATE message_recipient
     SET archived_at = NULL
     WHERE message_uuid IN (SELECT uuid FROM message WHERE thread_id = ?)
       AND recipient_owner_uuid = ?`
	).run(thread_id, principal_uuid);
}

/**
 * Get archived threads (like inbox but filtered to archived).
 */
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
		.all(principal_uuid, limit, offset) as ThreadSummary[];
}

// ---------------------------------------------------------------------------
// Unread count (for sidebar badge)
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
		.get(principal_uuid) as { n: number };
	return row.n;
}

// ---------------------------------------------------------------------------
// Resolve handle to principal
// ---------------------------------------------------------------------------

export async function resolveHandle(
	handle: string
): Promise<{ owner_uuid: string; handle_cache: string } | null> {
	const clean = handle.toLowerCase().replace(/^@/, '').trim();
	if (!clean) return null;

	const person = await lookupPersonByHandle(clean);
	if (person && person.status !== 'revoked') {
		// Auto-provision mailbox if it doesn't exist
		ensureMailbox(person.uuid, person.handle);
		
		const box = db
			.prepare(`SELECT 1 FROM mailbox WHERE principal_uuid = ? AND status = 'active'`)
			.get(person.uuid);
		if (box) return { principal_uuid: person.uuid, handle_cache: person.handle };
	}

	const assoc = await lookupAssociationByHandle(clean);
	if (assoc && assoc.status !== 'dissolved') {
		// Auto-provision mailbox if it doesn't exist
		ensureMailbox(assoc.uuid, assoc.handle);
		
		const box = db
			.prepare(`SELECT 1 FROM mailbox WHERE principal_uuid = ? AND status = 'active'`)
			.get(assoc.uuid);
		if (box) return { principal_uuid: assoc.uuid, handle_cache: assoc.handle };
	}

	return null;
}

// ---------------------------------------------------------------------------
// Save draft (upsert)
// ---------------------------------------------------------------------------

export function saveDraft(opts: {
	draft_uuid?: string;
	from_owner_uuid: string;
	from_handle_cache: string;
	to: Array<{ owner_uuid: string; handle_cache: string }>;
	cc?: Array<{ owner_uuid: string; handle_cache: string }>;
	bcc?: Array<{ owner_uuid: string; handle_cache: string }>;
	subject: string;
	body: string;
	content_type?: 'text/plain' | 'text/markdown';
}): Message {
	const now = new Date().toISOString();
	const content_type = opts.content_type ?? 'text/plain';

	if (opts.draft_uuid) {
		db.transaction(() => {
			db.prepare(
				`UPDATE message
         SET from_handle_cache = ?, subject = ?, body = ?, content_type = ?, created_at = ?
         WHERE uuid = ? AND from_owner_uuid = ? AND status = 'draft'`
			).run(
				opts.from_handle_cache,
				opts.subject,
				opts.body,
				content_type,
				now,
				opts.draft_uuid!,
				opts.from_owner_uuid
			);
			db.prepare('DELETE FROM message_recipient WHERE message_uuid = ?').run(opts.draft_uuid!);
			insertRecipients(opts.draft_uuid!, opts.to, 'to');
			insertRecipients(opts.draft_uuid!, opts.cc ?? [], 'cc');
			insertRecipients(opts.draft_uuid!, opts.bcc ?? [], 'bcc');
		})();
		return db.prepare('SELECT * FROM message WHERE uuid = ?').get(opts.draft_uuid!) as Message;
	}

	const uuid = randomUUID();
	db.transaction(() => {
		db.prepare(
			`INSERT INTO message
         (uuid, from_owner_uuid, from_handle_cache, subject, body, content_type,
          thread_id, reply_to_id, origin, status, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, NULL, 'local', 'draft', ?)`
		).run(
			uuid,
			opts.from_owner_uuid,
			opts.from_handle_cache,
			opts.subject,
			opts.body,
			content_type,
			uuid,
			now
		);
		insertRecipients(uuid, opts.to, 'to');
		insertRecipients(uuid, opts.cc ?? [], 'cc');
		insertRecipients(uuid, opts.bcc ?? [], 'bcc');
	})();
	return db.prepare('SELECT * FROM message WHERE uuid = ?').get(uuid) as Message;
}

// ---------------------------------------------------------------------------
// Send message (new or promote draft)
// ---------------------------------------------------------------------------

export function sendMessage(opts: {
	draft_uuid?: string;
	from_owner_uuid: string;
	from_handle_cache: string;
	to: Array<{ owner_uuid: string; handle_cache: string }>;
	cc?: Array<{ owner_uuid: string; handle_cache: string }>;
	bcc?: Array<{ owner_uuid: string; handle_cache: string }>;
	subject: string;
	body: string;
	content_type?: 'text/plain' | 'text/markdown';
}): Message {
	const now  = new Date().toISOString();
	const uuid = opts.draft_uuid ?? randomUUID();
	const content_type = opts.content_type ?? 'text/plain';

	db.transaction(() => {
		if (opts.draft_uuid) {
			db.prepare(
				`UPDATE message
         SET from_handle_cache = ?, subject = ?, body = ?, content_type = ?, status = 'sent', sent_at = ?
         WHERE uuid = ? AND from_owner_uuid = ? AND status = 'draft'`
			).run(
				opts.from_handle_cache,
				opts.subject,
				opts.body,
				content_type,
				now,
				uuid,
				opts.from_owner_uuid
			);
			db.prepare('DELETE FROM message_recipient WHERE message_uuid = ?').run(uuid);
		} else {
			db.prepare(
				`INSERT INTO message
           (uuid, from_owner_uuid, from_handle_cache, subject, body, content_type,
            thread_id, reply_to_id, origin, status, created_at, sent_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, NULL, 'local', 'sent', ?, ?)`
			).run(
				uuid,
				opts.from_owner_uuid,
				opts.from_handle_cache,
				opts.subject,
				opts.body,
				content_type,
				uuid,
				now,
				now
			);
		}
		insertRecipients(uuid, opts.to, 'to');
		insertRecipients(uuid, opts.cc ?? [], 'cc');
		insertRecipients(uuid, opts.bcc ?? [], 'bcc');
	})();

	return db.prepare('SELECT * FROM message WHERE uuid = ?').get(uuid) as Message;
}

// ---------------------------------------------------------------------------
// Reply in thread
// ---------------------------------------------------------------------------

export function replyToMessage(opts: {
	thread_id: string;
	reply_to_id: string;
	from_owner_uuid: string;
	from_handle_cache: string;
	subject: string;
	body: string;
	recipients: Array<{ owner_uuid: string; handle_cache: string }>;
	content_type?: 'text/plain' | 'text/markdown';
}): Message {
	const now  = new Date().toISOString();
	const uuid = randomUUID();
	const content_type = opts.content_type ?? 'text/plain';

	db.transaction(() => {
		db.prepare(
			`INSERT INTO message
         (uuid, from_owner_uuid, from_handle_cache, subject, body, content_type,
          thread_id, reply_to_id, origin, status, created_at, sent_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'local', 'sent', ?, ?)`
		).run(
			uuid,
			opts.from_owner_uuid,
			opts.from_handle_cache,
			opts.subject,
			opts.body,
			content_type,
			opts.thread_id,
			opts.reply_to_id,
			now,
			now
		);
		insertRecipients(uuid, opts.recipients, 'to');
	})();

	return db.prepare('SELECT * FROM message WHERE uuid = ?').get(uuid) as Message;
}

// ---------------------------------------------------------------------------
// Forward message (creates new thread with forwarded content)
// ---------------------------------------------------------------------------

export function forwardMessage(opts: {
	from_owner_uuid: string;
	from_handle_cache: string;
	to: Array<{ owner_uuid: string; handle_cache: string }>;
	cc?: Array<{ owner_uuid: string; handle_cache: string }>;
	bcc?: Array<{ owner_uuid: string; handle_cache: string }>;
	subject: string;
	body: string;
	content_type?: 'text/plain' | 'text/markdown';
}): Message {
	const now  = new Date().toISOString();
	const uuid = randomUUID();
	const content_type = opts.content_type ?? 'text/plain';

	db.transaction(() => {
		db.prepare(
			`INSERT INTO message
         (uuid, from_owner_uuid, from_handle_cache, subject, body, content_type,
          thread_id, reply_to_id, origin, status, created_at, sent_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, NULL, 'local', 'sent', ?, ?)`
		).run(
			uuid,
			opts.from_owner_uuid,
			opts.from_handle_cache,
			opts.subject,
			opts.body,
			content_type,
			uuid, // New thread
			now,
			now
		);
		insertRecipients(uuid, opts.to, 'to');
		insertRecipients(uuid, opts.cc ?? [], 'cc');
		insertRecipients(uuid, opts.bcc ?? [], 'bcc');
	})();

	return db.prepare('SELECT * FROM message WHERE uuid = ?').get(uuid) as Message;
}

// ---------------------------------------------------------------------------
// Report a message (one per reporter per message)
// ---------------------------------------------------------------------------

export function insertReport(
	message_uuid: string,
	reporter_uuid: string,
	reason: string
): void {
	// Enforce one report per member per message in application code.
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

// ---------------------------------------------------------------------------
// Internal helper
// ---------------------------------------------------------------------------

function insertRecipients(
	message_uuid: string,
	recipients: Array<{ owner_uuid: string; handle_cache: string }>,
	type: 'to' | 'cc'
): void {
	const stmt = db.prepare(
		`INSERT INTO message_recipient
       (uuid, message_uuid, recipient_owner_uuid, recipient_handle_cache, type)
     VALUES (?, ?, ?, ?, ?)`
	);
	for (const r of recipients) {
		stmt.run(randomUUID(), message_uuid, r.principal_uuid, r.handle_cache, type);
	}
}
