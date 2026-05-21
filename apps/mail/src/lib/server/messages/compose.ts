import { randomUUID } from 'node:crypto';
import { db } from '../db.js';
import type { Message } from './types.js';

// ---------------------------------------------------------------------------
// Internal Helper - Insert Recipients
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
		stmt.run(randomUUID(), message_uuid, r.owner_uuid, r.handle_cache, type);
	}
}

// ---------------------------------------------------------------------------
// Save Draft - Create or update a draft message
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
		// Update existing draft
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

	// Create new draft
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
// Send Message - Send new message or promote draft to sent
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
			// Promote existing draft to sent
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
			// Create new sent message
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
// Reply to Message - Reply in existing thread
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
// Forward Message - Create new thread with forwarded content
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
