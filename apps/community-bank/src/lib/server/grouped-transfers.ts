import { randomUUID } from 'node:crypto';
import { db } from './db.js';
import { getAccountByUuid, principalCanAutoPull, type Account } from './accounts.js';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type TransferMode = 'flat' | 'percentage';
export type TargetFilter = 'specific' | 'all' | 'all_standard' | 'all_above_threshold';

export interface GroupedTransfer {
	uuid: string;
	name: string;
	from_uuid: string | null; // null for percentage mode (dynamically determined)
	to_uuid: string;
	amount: number | null; // null for percentage mode
	transfer_mode: TransferMode;
	target_filter: TargetFilter;
	rate_percentage: number | null; // for percentage mode
	threshold: number | null; // for all_above_threshold filter
	type: string;
	schedule: string;
	group_uuid: string | null;
	status: 'active' | 'pending_authorization' | 'paused' | 'cancelled' | 'rejected';
	requested_by_principal_uuid: string;
	authorized_by_principal_uuid: string | null;
	created_by_motion_uuid: string | null;
	created_at: string;
	cancelled_at: string | null;
}

export interface EnrichedGroupedTransfer extends GroupedTransfer {
	from_handle: string | null;
	from_name: string | null;
	to_handle: string;
	to_name: string;
}

// ---------------------------------------------------------------------------
// Authorization logic
// ---------------------------------------------------------------------------

/**
 * Determines the initial status for a new grouped transfer.
 * 
 * Rules:
 * 1. Motion-created → 'active' (governance authorized)
 * 2. Percentage mode (from_uuid is null) → 'active' (authorized principals can pull)
 * 3. Self-push (requester owns from_account) → 'active' (self-authorized)
 * 4. Authorized principal pull → 'active' (principal has can_auto_pull permission)
 * 5. Regular pull → 'pending_authorization' (needs payer approval)
 */
function determineInitialStatus(opts: {
	from_uuid: string | null;
	to_uuid: string;
	transfer_mode: TransferMode;
	requested_by_principal_uuid: string;
	created_by_motion_uuid: string | null;
}): { status: 'active' | 'pending_authorization'; authorized_by: string | null } {
	// Motion-created
	if (opts.created_by_motion_uuid) {
		return { status: 'active', authorized_by: 'governance' };
	}

	// Percentage mode (authorized principals pulling from many)
	if (opts.transfer_mode === 'percentage') {
		const toAccount = getAccountByUuid(opts.to_uuid);
		if (toAccount && principalCanAutoPull(toAccount.principal_uuid)) {
			return { status: 'active', authorized_by: 'system' };
		}
		// Percentage mode without auto-pull permission needs authorization
		return { status: 'pending_authorization', authorized_by: null };
	}

	// Flat mode with specific from account
	if (opts.from_uuid) {
		// Self-push
		const fromAccount = getAccountByUuid(opts.from_uuid);
		if (fromAccount && fromAccount.principal_uuid === opts.requested_by_principal_uuid) {
			return { status: 'active', authorized_by: opts.requested_by_principal_uuid };
		}

		// Authorized principal pull (has can_auto_pull permission)
		const toAccount = getAccountByUuid(opts.to_uuid);
		if (toAccount && toAccount.principal_uuid === opts.requested_by_principal_uuid && principalCanAutoPull(toAccount.principal_uuid)) {
			return { status: 'active', authorized_by: 'system' };
		}
	}

	// Regular pull - needs authorization
	return { status: 'pending_authorization', authorized_by: null };
}

// ---------------------------------------------------------------------------
// Create grouped transfer
// ---------------------------------------------------------------------------

export function createGroupedTransfer(opts: {
	name: string;
	to_uuid: string;
	type: string;
	schedule: 'daily' | 'weekly' | 'monthly';
	requested_by_principal_uuid: string;
	transfer_mode: TransferMode;
	target_filter: TargetFilter;
	// Flat mode fields
	from_uuid?: string | null;
	amount?: number | null;
	// Percentage mode fields
	rate_percentage?: number | null;
	threshold?: number | null;
	// Optional
	group_uuid?: string | null;
	created_by_motion_uuid?: string | null;
}): GroupedTransfer {
	// Validate mode-specific requirements
	if (opts.transfer_mode === 'flat') {
		if (!opts.from_uuid) throw new Error('Flat mode requires from_uuid');
		if (!opts.amount || opts.amount <= 0) throw new Error('Flat mode requires positive amount');
		if (opts.target_filter !== 'specific') throw new Error('Flat mode only supports target_filter=specific');
	} else {
		// Percentage mode
		if (opts.from_uuid) throw new Error('Percentage mode should not specify from_uuid');
		if (opts.amount) throw new Error('Percentage mode should not specify amount');
		if (!opts.rate_percentage || opts.rate_percentage <= 0 || opts.rate_percentage > 1) {
			throw new Error('Percentage mode requires rate_percentage between 0 and 1');
		}
		if (opts.target_filter === 'specific') throw new Error('Percentage mode requires a multi-account target_filter');
		if (opts.target_filter === 'all_above_threshold' && (!opts.threshold || opts.threshold <= 0)) {
			throw new Error('all_above_threshold requires positive threshold');
		}
	}

	// Validate to_account
	const toAccount = getAccountByUuid(opts.to_uuid);
	if (!toAccount) throw new Error('To account not found');
	if (toAccount.status === 'frozen') throw new Error('To account is frozen');

	// Validate from_account for flat mode
	if (opts.transfer_mode === 'flat' && opts.from_uuid) {
		const fromAccount = getAccountByUuid(opts.from_uuid);
		if (!fromAccount) throw new Error('From account not found');
		if (fromAccount.status === 'frozen') throw new Error('From account is frozen');
		if (opts.from_uuid === opts.to_uuid) throw new Error('From and to accounts must be different');
	}

	const uuid = randomUUID();
	const now = new Date().toISOString();
	const { status, authorized_by } = determineInitialStatus({
		from_uuid: opts.from_uuid ?? null,
		to_uuid: opts.to_uuid,
		transfer_mode: opts.transfer_mode,
		requested_by_principal_uuid: opts.requested_by_principal_uuid,
		created_by_motion_uuid: opts.created_by_motion_uuid ?? null,
	});

	db.prepare(
		`INSERT INTO scheduled_transfer (
			uuid, name, from_uuid, to_uuid, amount, transfer_mode, target_filter, 
			rate_percentage, threshold, type, schedule, group_uuid, status, 
			requested_by_principal_uuid, authorized_by_principal_uuid, 
			created_by_motion_uuid, created_at
		) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
	).run(
		uuid,
		opts.name,
		opts.from_uuid ?? null,
		opts.to_uuid,
		opts.amount ?? null,
		opts.transfer_mode,
		opts.target_filter,
		opts.rate_percentage ?? null,
		opts.threshold ?? null,
		opts.type,
		opts.schedule,
		opts.group_uuid ?? null,
		status,
		opts.requested_by_principal_uuid,
		authorized_by,
		opts.created_by_motion_uuid ?? null,
		now
	);

	return getGroupedTransferByUuid(uuid)!;
}

// ---------------------------------------------------------------------------
// Authorize/reject pending transfers
// ---------------------------------------------------------------------------

export function authorizeGroupedTransfer(
	transferUuid: string,
	authorizingPrincipalUuid: string
): GroupedTransfer {
	const transfer = getGroupedTransferByUuid(transferUuid);
	if (!transfer) throw new Error('Grouped transfer not found');

	if (transfer.status !== 'pending_authorization') {
		throw new Error('Only pending transfers can be authorized');
	}

	// Verify the authorizing principal owns the from_account
	if (!transfer.from_uuid) throw new Error('Cannot authorize percentage mode transfer');
	const fromAccount = getAccountByUuid(transfer.from_uuid);
	if (!fromAccount || fromAccount.principal_uuid !== authorizingPrincipalUuid) {
		throw new Error('Only the payer can authorize this transfer');
	}

	db.prepare(
		`UPDATE scheduled_transfer 
		 SET status = 'active', authorized_by_principal_uuid = ?
		 WHERE uuid = ?`
	).run(authorizingPrincipalUuid, transferUuid);

	return getGroupedTransferByUuid(transferUuid)!;
}

export function rejectGroupedTransfer(
	transferUuid: string,
	rejectingPrincipalUuid: string
): GroupedTransfer {
	const transfer = getGroupedTransferByUuid(transferUuid);
	if (!transfer) throw new Error('Grouped transfer not found');

	if (transfer.status !== 'pending_authorization') {
		throw new Error('Only pending transfers can be rejected');
	}

	// Verify the rejecting principal owns the from_account
	if (!transfer.from_uuid) throw new Error('Cannot reject percentage mode transfer');
	const fromAccount = getAccountByUuid(transfer.from_uuid);
	if (!fromAccount || fromAccount.principal_uuid !== rejectingPrincipalUuid) {
		throw new Error('Only the payer can reject this transfer');
	}

	db.prepare(
		`UPDATE scheduled_transfer 
		 SET status = 'rejected', cancelled_at = ?
		 WHERE uuid = ?`
	).run(new Date().toISOString(), transferUuid);

	return getGroupedTransferByUuid(transferUuid)!;
}

// ---------------------------------------------------------------------------
// Pause/unpause/cancel
// ---------------------------------------------------------------------------

export function pauseGroupedTransfer(transferUuid: string): GroupedTransfer {
	const transfer = getGroupedTransferByUuid(transferUuid);
	if (!transfer) throw new Error('Grouped transfer not found');
	if (transfer.status !== 'active') {
		throw new Error('Only active transfers can be paused');
	}

	db.prepare(`UPDATE scheduled_transfer SET status = 'paused' WHERE uuid = ?`).run(transferUuid);
	return getGroupedTransferByUuid(transferUuid)!;
}

export function unpauseGroupedTransfer(transferUuid: string): GroupedTransfer {
	const transfer = getGroupedTransferByUuid(transferUuid);
	if (!transfer) throw new Error('Grouped transfer not found');
	if (transfer.status !== 'paused') {
		throw new Error('Only paused transfers can be unpaused');
	}

	db.prepare(`UPDATE scheduled_transfer SET status = 'active' WHERE uuid = ?`).run(transferUuid);
	return getGroupedTransferByUuid(transferUuid)!;
}

export function cancelGroupedTransfer(transferUuid: string): GroupedTransfer {
	const transfer = getGroupedTransferByUuid(transferUuid);
	if (!transfer) throw new Error('Grouped transfer not found');

	if (transfer.status === 'cancelled' || transfer.status === 'rejected') {
		throw new Error('Transfer is already cancelled or rejected');
	}

	db.prepare(
		`UPDATE scheduled_transfer 
		 SET status = 'cancelled', cancelled_at = ?
		 WHERE uuid = ?`
	).run(new Date().toISOString(), transferUuid);

	return getGroupedTransferByUuid(transferUuid)!;
}

// ---------------------------------------------------------------------------
// Query functions
// ---------------------------------------------------------------------------

export function getGroupedTransferByUuid(uuid: string): GroupedTransfer | null {
	return db
		.prepare('SELECT * FROM scheduled_transfer WHERE uuid = ?')
		.get(uuid) as GroupedTransfer | null;
}

export function getAllGroupedTransfers(): EnrichedGroupedTransfer[] {
	return db
		.prepare(
			`SELECT st.*,
              fa.handle_cache AS from_handle, fa.name AS from_name,
              ta.handle_cache AS to_handle,   ta.name AS to_name
       FROM scheduled_transfer st
       LEFT JOIN account fa ON fa.uuid = st.from_uuid
       JOIN account ta ON ta.uuid = st.to_uuid
       ORDER BY st.status, st.created_at DESC`
		)
		.all() as EnrichedGroupedTransfer[];
}

// ---------------------------------------------------------------------------
// Principal-specific views
// ---------------------------------------------------------------------------

/**
 * Get pending pull requests that need this principal's authorization.
 * These are pulls FROM accounts owned by this principal.
 */
export function getPendingPullRequests(principalUuid: string): EnrichedGroupedTransfer[] {
	return db
		.prepare(
			`SELECT st.*,
              fa.handle_cache AS from_handle, fa.name AS from_name,
              ta.handle_cache AS to_handle,   ta.name AS to_name
       FROM scheduled_transfer st
       LEFT JOIN account fa ON fa.uuid = st.from_uuid
       JOIN account ta ON ta.uuid = st.to_uuid
       WHERE fa.principal_uuid = ?
         AND st.status = 'pending_authorization'
       ORDER BY st.created_at DESC`
		)
		.all(principalUuid) as EnrichedGroupedTransfer[];
}

/**
 * Get active pulls FROM accounts owned by this principal.
 * Shows what recurring charges are being pulled from your accounts.
 */
export function getActivePullsFromMe(principalUuid: string): EnrichedGroupedTransfer[] {
	return db
		.prepare(
			`SELECT st.*,
              fa.handle_cache AS from_handle, fa.name AS from_name,
              ta.handle_cache AS to_handle,   ta.name AS to_name
       FROM scheduled_transfer st
       LEFT JOIN account fa ON fa.uuid = st.from_uuid
       JOIN account ta ON ta.uuid = st.to_uuid
       WHERE fa.principal_uuid = ?
         AND st.requested_by_principal_uuid != ?
         AND st.status IN ('active', 'paused')
       ORDER BY st.status, st.created_at DESC`
		)
		.all(principalUuid, principalUuid) as EnrichedGroupedTransfer[];
}

/**
 * Get outbound transfers (pushes) FROM accounts owned by this principal.
 * These are transfers this principal initiated to push money out.
 */
export function getMyOutboundTransfers(principalUuid: string): EnrichedGroupedTransfer[] {
	return db
		.prepare(
			`SELECT st.*,
              fa.handle_cache AS from_handle, fa.name AS from_name,
              ta.handle_cache AS to_handle,   ta.name AS to_name
       FROM scheduled_transfer st
       LEFT JOIN account fa ON fa.uuid = st.from_uuid
       JOIN account ta ON ta.uuid = st.to_uuid
       WHERE fa.principal_uuid = ?
         AND st.requested_by_principal_uuid = ?
         AND st.status IN ('active', 'paused')
       ORDER BY st.status, st.created_at DESC`
		)
		.all(principalUuid, principalUuid) as EnrichedGroupedTransfer[];
}

/**
 * Get pull requests this principal has made (awaiting others' approval).
 * These are pulls TO accounts owned by this principal, still pending.
 */
export function getMyPendingPullRequests(principalUuid: string): EnrichedGroupedTransfer[] {
	return db
		.prepare(
			`SELECT st.*,
              fa.handle_cache AS from_handle, fa.name AS from_name,
              ta.handle_cache AS to_handle,   ta.name AS to_name
       FROM scheduled_transfer st
       LEFT JOIN account fa ON fa.uuid = st.from_uuid
       JOIN account ta ON ta.uuid = st.to_uuid
       WHERE ta.principal_uuid = ?
         AND st.requested_by_principal_uuid = ?
         AND st.status = 'pending_authorization'
       ORDER BY st.created_at DESC`
		)
		.all(principalUuid, principalUuid) as EnrichedGroupedTransfer[];
}

/**
 * Get active pulls TO accounts owned by this principal.
 * These are recurring deposits coming into your accounts.
 */
export function getActivePullsToMe(principalUuid: string): EnrichedGroupedTransfer[] {
	return db
		.prepare(
			`SELECT st.*,
              fa.handle_cache AS from_handle, fa.name AS from_name,
              ta.handle_cache AS to_handle,   ta.name AS to_name
       FROM scheduled_transfer st
       LEFT JOIN account fa ON fa.uuid = st.from_uuid
       JOIN account ta ON ta.uuid = st.to_uuid
       WHERE ta.principal_uuid = ?
         AND st.requested_by_principal_uuid = ?
         AND st.status IN ('active', 'paused')
       ORDER BY st.status, st.created_at DESC`
		)
		.all(principalUuid, principalUuid) as EnrichedGroupedTransfer[];
}

// ---------------------------------------------------------------------------
// Get target accounts for percentage mode execution
// ---------------------------------------------------------------------------

export function getTargetAccounts(transfer: GroupedTransfer): Account[] {
	if (transfer.transfer_mode !== 'percentage') {
		throw new Error('getTargetAccounts only works for percentage mode');
	}

	let query: string;
	const params: any[] = [];

	switch (transfer.target_filter) {
		case 'all':
			query = `SELECT * FROM account WHERE status = 'active' AND uuid != ?`;
			params.push(transfer.to_uuid);
			break;

		case 'all_standard':
			query = `SELECT * FROM account WHERE status = 'active' AND account_type = 'standard' AND uuid != ?`;
			params.push(transfer.to_uuid);
			break;

		case 'all_above_threshold':
			if (!transfer.threshold) throw new Error('threshold required for all_above_threshold');
			query = `SELECT * FROM account WHERE status = 'active' AND balance >= ? AND uuid != ?`;
			params.push(transfer.threshold, transfer.to_uuid);
			break;

		default:
			throw new Error(`Unknown target_filter: ${transfer.target_filter}`);
	}

	return db.prepare(query).all(...params) as Account[];
}
