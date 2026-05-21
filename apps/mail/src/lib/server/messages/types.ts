// ---------------------------------------------------------------------------
// Message Types & Interfaces
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

// Default pagination size
export const PAGE_SIZE = 25;
