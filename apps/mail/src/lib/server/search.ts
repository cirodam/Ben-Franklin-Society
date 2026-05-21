import { db } from './db.js';
import type { Message } from './messages/types.js';

export interface SearchResult extends Message {
	/** Snippet showing search term context */
	snippet: string;
	/** Relevance rank (lower is more relevant) */
	rank: number;
}

export interface SearchFilters {
	/** Date range start (ISO string) */
	from_date?: string;
	/** Date range end (ISO string) */
	to_date?: string;
	/** Filter by sender handle */
	sender?: string;
	/** Filter to sent messages only */
	sent_only?: boolean;
	/** Filter to received messages only */
	received_only?: boolean;
}

const PAGE_SIZE = 25;

/**
 * Search messages using full-text search.
 * Only returns messages the user has access to (sent by them or received by them).
 */
export function searchMessages(
	owner_uuid: string,
	query: string,
	filters: SearchFilters = {},
	opts: { limit?: number; offset?: number } = {}
): SearchResult[] {
	if (!query || query.trim().length === 0) {
		return [];
	}

	const limit = opts.limit ?? PAGE_SIZE + 1;
	const offset = opts.offset ?? 0;

	// Build WHERE clauses
	const conditions: string[] = [];
	const params: unknown[] = [query, owner_uuid, owner_uuid];

	if (filters.from_date) {
		conditions.push('m.sent_at >= ?');
		params.push(filters.from_date);
	}

	if (filters.to_date) {
		conditions.push('m.sent_at <= ?');
		params.push(filters.to_date);
	}

	if (filters.sender) {
		conditions.push('m.from_handle_cache = ?');
		params.push(filters.sender);
	}

	if (filters.sent_only) {
		conditions.push('m.from_owner_uuid = ?');
		params.push(owner_uuid);
	} else if (filters.received_only) {
		conditions.push('mr.recipient_owner_uuid = ?');
		params.push(owner_uuid);
	}

	const whereClause = conditions.length > 0 
		? 'AND ' + conditions.join(' AND ')
		: '';

	params.push(limit, offset);

	const sql = `
		SELECT DISTINCT
			m.*,
			snippet(message_fts, 1, '<mark>', '</mark>', '...', 32) as snippet,
			message_fts.rank as rank
		FROM message_fts
		JOIN message m ON m.rowid = message_fts.rowid
		LEFT JOIN message_recipient mr ON mr.message_uuid = m.uuid
		WHERE message_fts MATCH ?
			AND m.status = 'sent'
			AND m.deleted_at IS NULL
			AND (
				m.from_owner_uuid = ?
				OR mr.recipient_owner_uuid = ?
			)
			${whereClause}
		ORDER BY message_fts.rank
		LIMIT ? OFFSET ?
	`;

	return db.prepare(sql).all(...params) as SearchResult[];
}

/**
 * Get count of search results (for pagination).
 */
export function countSearchResults(
	owner_uuid: string,
	query: string,
	filters: SearchFilters = {}
): number {
	if (!query || query.trim().length === 0) {
		return 0;
	}

	const conditions: string[] = [];
	const params: unknown[] = [query, owner_uuid, owner_uuid];

	if (filters.from_date) {
		conditions.push('m.sent_at >= ?');
		params.push(filters.from_date);
	}

	if (filters.to_date) {
		conditions.push('m.sent_at <= ?');
		params.push(filters.to_date);
	}

	if (filters.sender) {
		conditions.push('m.from_handle_cache = ?');
		params.push(filters.sender);
	}

	if (filters.sent_only) {
		conditions.push('m.from_owner_uuid = ?');
		params.push(owner_uuid);
	} else if (filters.received_only) {
		conditions.push('mr.recipient_owner_uuid = ?');
		params.push(owner_uuid);
	}

	const whereClause = conditions.length > 0 
		? 'AND ' + conditions.join(' AND ')
		: '';

	const sql = `
		SELECT COUNT(DISTINCT m.uuid) as count
		FROM message_fts
		JOIN message m ON m.rowid = message_fts.rowid
		LEFT JOIN message_recipient mr ON mr.message_uuid = m.uuid
		WHERE message_fts MATCH ?
			AND m.status = 'sent'
			AND m.deleted_at IS NULL
			AND (
				m.from_owner_uuid = ?
				OR mr.recipient_owner_uuid = ?
			)
			${whereClause}
	`;

	const result = db.prepare(sql).get(...params) as { count: number };
	return result.count;
}
