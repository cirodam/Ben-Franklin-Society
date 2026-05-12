import { randomUUID } from 'node:crypto';
import { db }        from './db.js';
import { getClassified, getService } from './listings.js';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface ListingReport {
	uuid:             string;
	listing_uuid:     string;
	listing_type:     'classified' | 'service';
	reporter_uuid:    string;
	reason:           string;
	status:           'pending' | 'reviewed';
	created_at:       string;
	reviewed_at:      string | null;
	reviewed_by_uuid: string | null;
}

export interface EnrichedReport extends ListingReport {
	listing_title:  string;
	listing_status: string;
	seller_uuid:    string;
	seller_handle:  string;
}

export interface SellerRow {
	principal_uuid:   string;
	handle:           string;
	listing_count:    number;
	suspended:        number; // 0 | 1
	suspended_reason: string | null;
	suspended_at:     string | null;
}

// ---------------------------------------------------------------------------
// Reports — member-facing
// ---------------------------------------------------------------------------

export function insertReport(
	listing_uuid:  string,
	listing_type:  'classified' | 'service',
	reporter_uuid: string,
	reason:        string
): void {
	// Block duplicate open reports from same reporter for same listing
	const existing = db
		.prepare(
			`SELECT 1 FROM listing_report
       WHERE listing_uuid = ? AND reporter_uuid = ? AND status = 'pending'`
		)
		.get(listing_uuid, reporter_uuid);
	if (existing) return; // silently ignore duplicate

	db.prepare(
		`INSERT INTO listing_report
       (uuid, listing_uuid, listing_type, reporter_uuid, reason, status, created_at)
     VALUES (?, ?, ?, ?, ?, 'pending', ?)`
	).run(randomUUID(), listing_uuid, listing_type, reporter_uuid, reason, new Date().toISOString());
}

// ---------------------------------------------------------------------------
// Reports — admin-facing
// ---------------------------------------------------------------------------

export function getPendingReports(): EnrichedReport[] {
	const rows = db
		.prepare(
			`SELECT r.*,
              COALESCE(
                (SELECT title FROM classified_listing WHERE uuid = r.listing_uuid),
                (SELECT title FROM service_listing   WHERE uuid = r.listing_uuid)
              ) AS listing_title,
              COALESCE(
                (SELECT status FROM classified_listing WHERE uuid = r.listing_uuid),
                (SELECT status FROM service_listing   WHERE uuid = r.listing_uuid)
              ) AS listing_status,
              COALESCE(
                (SELECT seller_uuid          FROM classified_listing WHERE uuid = r.listing_uuid),
                (SELECT provider_uuid        FROM service_listing   WHERE uuid = r.listing_uuid)
              ) AS seller_uuid,
              COALESCE(
                (SELECT seller_handle_cache  FROM classified_listing WHERE uuid = r.listing_uuid),
                (SELECT provider_handle_cache FROM service_listing  WHERE uuid = r.listing_uuid)
              ) AS seller_handle
       FROM listing_report r
       WHERE r.status = 'pending'
       ORDER BY r.created_at ASC`
		)
		.all() as EnrichedReport[];
	return rows;
}

export function getReport(uuid: string): EnrichedReport | null {
	const row = db
		.prepare(
			`SELECT r.*,
              COALESCE(
                (SELECT title FROM classified_listing WHERE uuid = r.listing_uuid),
                (SELECT title FROM service_listing   WHERE uuid = r.listing_uuid)
              ) AS listing_title,
              COALESCE(
                (SELECT status FROM classified_listing WHERE uuid = r.listing_uuid),
                (SELECT status FROM service_listing   WHERE uuid = r.listing_uuid)
              ) AS listing_status,
              COALESCE(
                (SELECT seller_uuid           FROM classified_listing WHERE uuid = r.listing_uuid),
                (SELECT provider_uuid         FROM service_listing   WHERE uuid = r.listing_uuid)
              ) AS seller_uuid,
              COALESCE(
                (SELECT seller_handle_cache   FROM classified_listing WHERE uuid = r.listing_uuid),
                (SELECT provider_handle_cache FROM service_listing   WHERE uuid = r.listing_uuid)
              ) AS seller_handle
       FROM listing_report r
       WHERE r.uuid = ?`
		)
		.get(uuid) as EnrichedReport | undefined;
	return row ?? null;
}

function resolveReport(report_uuid: string, actor_uuid: string): void {
	const now = new Date().toISOString();
	db.prepare(
		`UPDATE listing_report
     SET status = 'reviewed', reviewed_at = ?, reviewed_by_uuid = ?
     WHERE uuid = ?`
	).run(now, actor_uuid, report_uuid);
}

function writeLog(
	action:      string,
	target_uuid: string,
	target_type: string,
	actor_uuid:  string,
	reason:      string,
	report_uuid: string | null = null
): void {
	db.prepare(
		`INSERT INTO moderation_log (uuid, action, target_uuid, target_type, actor_uuid, reason, report_uuid, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
	).run(
		randomUUID(), action, target_uuid, target_type, actor_uuid, reason, report_uuid,
		new Date().toISOString()
	);
}

export function dismissReport(uuid: string, actor_uuid: string, reason: string): void {
	const report = getReport(uuid);
	if (!report) return;
	resolveReport(uuid, actor_uuid);
	writeLog('dismiss_report', uuid, 'listing_report', actor_uuid, reason, uuid);
}

export function removeListing(
	listing_uuid:  string,
	listing_type:  'classified' | 'service',
	actor_uuid:    string,
	reason:        string,
	report_uuid:   string | null = null
): void {
	const table = listing_type === 'classified' ? 'classified_listing' : 'service_listing';
	db.prepare(`UPDATE ${table} SET status = 'removed' WHERE uuid = ?`).run(listing_uuid);
	if (report_uuid) resolveReport(report_uuid, actor_uuid);
	writeLog('remove_listing', listing_uuid, listing_type, actor_uuid, reason, report_uuid);
}

export function reinstateListing(
	listing_uuid: string,
	listing_type: 'classified' | 'service',
	actor_uuid:   string,
	reason:       string
): void {
	const table = listing_type === 'classified' ? 'classified_listing' : 'service_listing';
	db.prepare(`UPDATE ${table} SET status = 'active' WHERE uuid = ?`).run(listing_uuid);
	writeLog('reinstate_listing', listing_uuid, listing_type, actor_uuid, reason);
}

export function suspendSeller(
	principal_uuid: string,
	actor_uuid:     string,
	reason:         string,
	report_uuid:    string | null = null
): void {
	const now = new Date().toISOString();
	db.prepare(
		`INSERT INTO seller_suspension (principal_uuid, actor_uuid, reason, suspended_at)
     VALUES (?, ?, ?, ?)
     ON CONFLICT(principal_uuid) DO UPDATE SET
       actor_uuid   = excluded.actor_uuid,
       reason       = excluded.reason,
       suspended_at = excluded.suspended_at,
       lifted_at    = NULL`
	).run(principal_uuid, actor_uuid, reason, now);
	if (report_uuid) resolveReport(report_uuid, actor_uuid);
	writeLog('suspend_seller', principal_uuid, 'seller', actor_uuid, reason, report_uuid);
}

export function reinstateSeller(
	principal_uuid: string,
	actor_uuid:     string,
	reason:         string
): void {
	const now = new Date().toISOString();
	db.prepare(
		`UPDATE seller_suspension SET lifted_at = ? WHERE principal_uuid = ?`
	).run(now, principal_uuid);
	writeLog('reinstate_seller', principal_uuid, 'seller', actor_uuid, reason);
}

// ---------------------------------------------------------------------------
// Sellers list
// ---------------------------------------------------------------------------

export function getAllSellers(opts: { q?: string } = {}): SellerRow[] {
	const likeParam = opts.q ? `%${opts.q}%` : '%';
	const rows = db
		.prepare(
			`SELECT
         principal_uuid,
         handle,
         listing_count,
         CASE WHEN lifted_at IS NULL AND suspended_at IS NOT NULL THEN 1 ELSE 0 END AS suspended,
         ss.reason      AS suspended_reason,
         ss.suspended_at AS suspended_at
       FROM (
         SELECT seller_uuid AS principal_uuid, seller_handle_cache AS handle, COUNT(*) AS listing_count
         FROM classified_listing
         GROUP BY seller_uuid
         UNION
         SELECT provider_uuid AS principal_uuid, provider_handle_cache AS handle, COUNT(*) AS listing_count
         FROM service_listing
         GROUP BY provider_uuid
       ) AS sellers
       LEFT JOIN seller_suspension ss ON ss.principal_uuid = sellers.principal_uuid
       WHERE handle LIKE ?
       ORDER BY handle ASC`
		)
		.all(likeParam) as SellerRow[];
	return rows;
}
