import { randomUUID } from 'node:crypto';
import { db } from './db.js';
import { suspendMailbox, reinstateMailbox as reinstateMailboxRecord } from './mailboxes.js';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface Report {
	uuid: string;
	message_uuid: string;
	reporter_uuid: string;
	reason: string;
	status: 'pending' | 'dismissed' | 'actioned';
	created_at: string;
	reviewed_at: string | null;
	reviewed_by_uuid: string | null;
}

export interface EnrichedReport extends Report {
	message_subject: string;
	message_from_handle: string;
	message_body: string;
	thread_id: string;
}

export interface ModerationLogEntry {
	uuid: string;
	action: string;
	target_uuid: string;
	target_type: string;
	actor_uuid: string;
	reason: string;
	report_uuid: string | null;
	created_at: string;
}

// ---------------------------------------------------------------------------
// Reports
// ---------------------------------------------------------------------------

export function getPendingReports(): EnrichedReport[] {
	return db
		.prepare(
			`SELECT
         r.*,
         m.subject  AS message_subject,
         m.from_handle_cache AS message_from_handle,
         m.body     AS message_body,
         m.thread_id
       FROM message_report r
       JOIN message m ON m.uuid = r.message_uuid
       WHERE r.status = 'pending'
       ORDER BY r.created_at ASC`
		)
		.all() as EnrichedReport[];
}

export function getReport(uuid: string): EnrichedReport | null {
	return (
		db
			.prepare(
				`SELECT
           r.*,
           m.subject  AS message_subject,
           m.from_handle_cache AS message_from_handle,
           m.body     AS message_body,
           m.thread_id
         FROM message_report r
         JOIN message m ON m.uuid = r.message_uuid
         WHERE r.uuid = ?`
			)
			.get(uuid) as EnrichedReport | undefined
	) ?? null;
}

// ---------------------------------------------------------------------------
// Resolve report (dismiss only — no destructive action)
// ---------------------------------------------------------------------------

export function dismissReport(uuid: string, actor_uuid: string, reason: string): void {
	const now = new Date().toISOString();
	db.transaction(() => {
		db.prepare(
			`UPDATE message_report
       SET status = 'dismissed', reviewed_at = ?, reviewed_by_uuid = ?
       WHERE uuid = ?`
		).run(now, actor_uuid, uuid);

		logModerationAction({
			action:      'dismiss_report',
			target_uuid: uuid,
			target_type: 'report',
			actor_uuid,
			reason,
			report_uuid: uuid,
		});
	})();
}

// ---------------------------------------------------------------------------
// Delete a message (soft-delete via deleted_at; optionally resolve report)
// ---------------------------------------------------------------------------

export function deleteMessage(
	message_uuid: string,
	actor_uuid: string,
	reason: string,
	report_uuid?: string
): void {
	const now = new Date().toISOString();
	db.transaction(() => {
		db.prepare(`UPDATE message SET deleted_at = ? WHERE uuid = ?`).run(now, message_uuid);

		if (report_uuid) {
			db.prepare(
				`UPDATE message_report
         SET status = 'actioned', reviewed_at = ?, reviewed_by_uuid = ?
         WHERE uuid = ?`
			).run(now, actor_uuid, report_uuid);
		}

		logModerationAction({
			action:      'delete_message',
			target_uuid: message_uuid,
			target_type: 'message',
			actor_uuid,
			reason,
			report_uuid: report_uuid ?? null,
		});
	})();
}

// ---------------------------------------------------------------------------
// Suspend / reinstate mailbox (with moderation log)
// ---------------------------------------------------------------------------

export function suspendMailboxByMod(
	principal_uuid: string,
	actor_uuid: string,
	reason: string,
	report_uuid?: string
): void {
	const now = new Date().toISOString();
	db.transaction(() => {
		suspendMailbox(principal_uuid);

		if (report_uuid) {
			db.prepare(
				`UPDATE message_report
         SET status = 'actioned', reviewed_at = ?, reviewed_by_uuid = ?
         WHERE uuid = ?`
			).run(now, actor_uuid, report_uuid);
		}

		logModerationAction({
			action:      'suspend_mailbox',
			target_uuid: principal_uuid,
			target_type: 'mailbox',
			actor_uuid,
			reason,
			report_uuid: report_uuid ?? null,
		});
	})();
}

export function reinstateMailboxByMod(
	principal_uuid: string,
	actor_uuid: string,
	reason: string
): void {
	db.transaction(() => {
		reinstateMailboxRecord(principal_uuid);

		logModerationAction({
			action:      'reinstate_mailbox',
			target_uuid: principal_uuid,
			target_type: 'mailbox',
			actor_uuid,
			reason,
			report_uuid: null,
		});
	})();
}

// ---------------------------------------------------------------------------
// All mailboxes (for admin list)
// ---------------------------------------------------------------------------

export interface MailboxRow {
	principal_uuid: string;
	handle_cache: string;
	status: string;
	created_at: string;
}

export function getAllMailboxes(opts: { q?: string } = {}): MailboxRow[] {
	if (opts.q) {
		const like = `%${opts.q.toLowerCase().replace(/^@/, '')}%`;
		return db
			.prepare(
				`SELECT * FROM mailbox
         WHERE LOWER(handle_cache) LIKE ?
         ORDER BY handle_cache ASC`
			)
			.all(like) as MailboxRow[];
	}
	return db
		.prepare('SELECT * FROM mailbox ORDER BY handle_cache ASC')
		.all() as MailboxRow[];
}

// ---------------------------------------------------------------------------
// Moderation log
// ---------------------------------------------------------------------------

export function getModerationLog(
	target_uuid: string
): ModerationLogEntry[] {
	return db
		.prepare(
			`SELECT * FROM moderation_log
       WHERE target_uuid = ?
       ORDER BY created_at DESC`
		)
		.all(target_uuid) as ModerationLogEntry[];
}

// ---------------------------------------------------------------------------
// Internal helper
// ---------------------------------------------------------------------------

function logModerationAction(opts: {
	action: string;
	target_uuid: string;
	target_type: string;
	actor_uuid: string;
	reason: string;
	report_uuid: string | null;
}): void {
	db.prepare(
		`INSERT INTO moderation_log
       (uuid, action, target_uuid, target_type, actor_uuid, reason, report_uuid, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
	).run(
		randomUUID(),
		opts.action,
		opts.target_uuid,
		opts.target_type,
		opts.actor_uuid,
		opts.reason,
		opts.report_uuid,
		new Date().toISOString()
	);
}
