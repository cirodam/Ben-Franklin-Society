import type { PageServerLoad } from './$types.js';
import { error } from '@sveltejs/kit';
import { getLabel } from '$lib/server/labels.js';
import { getInbox } from '$lib/server/messages.js';
import { db } from '$lib/server/db.js';

interface ThreadWithLabels {
	thread_id: string;
	subject: string;
	from_handle_cache: string;
	sent_at: string;
	unread_count: number;
}

export const load: PageServerLoad = async ({ locals, params }) => {
	const session = locals.session!;
	const label = getLabel(params.uuid, session.acting_as_uuid);

	if (!label) {
		error(404, 'Label not found');
	}

	// Get threads with this label
	const threads = db
		.prepare(
			`SELECT DISTINCT
        m.thread_id,
        m.subject,
        m.from_handle_cache,
        m.sent_at,
        COUNT(CASE WHEN mr.read_at IS NULL AND mr.recipient_owner_uuid = ? THEN 1 END) as unread_count
      FROM message m
      JOIN thread_label tl ON m.thread_id = tl.thread_id
      LEFT JOIN message_recipient mr ON m.uuid = mr.message_uuid
      WHERE tl.label_uuid = ? 
        AND tl.mailbox_uuid = ?
        AND (m.from_owner_uuid = ? OR mr.recipient_owner_uuid = ?)
        AND (mr.trashed_at IS NULL OR m.from_owner_uuid = ?)
      GROUP BY m.thread_id
      ORDER BY m.sent_at DESC`
		)
		.all(
			session.acting_as_uuid,
			label.uuid,
			session.acting_as_uuid,
			session.acting_as_uuid,
			session.acting_as_uuid,
			session.acting_as_uuid
		) as ThreadWithLabels[];

	return { label, threads };
};
