import { db } from './db.js';
import { verify } from 'crypto';
import { lookupSociety, getLineageFromCache } from './registry.js';

/**
 * Verify a signed update request
 * Ensures request is authentic and recent (< 5 minutes old)
 */
export function verifyUpdateRequest(params: {
	handle: string;
	requestBody: string;
	signatureBase64: string;
}): { valid: boolean; error?: string } {
	const { handle, requestBody, signatureBase64 } = params;

	// 1. Get society's public key
	const society = lookupSociety(handle);
	if (!society) {
		return { valid: false, error: 'Society not found' };
	}

	// 2. Parse request body to check timestamp
	let request: any;
	try {
		request = JSON.parse(requestBody);
	} catch {
		return { valid: false, error: 'Invalid JSON in request body' };
	}

	if (!request.timestamp) {
		return { valid: false, error: 'Missing timestamp' };
	}

	// Check timestamp is recent (< 5 minutes old)
	const age = Date.now() - request.timestamp;
	if (age > 300_000) {
		return { valid: false, error: 'Request expired (timestamp too old)' };
	}

	if (age < -60_000) {
		return { valid: false, error: 'Request timestamp in future' };
	}

	// 3. Verify signature
	try {
		const signature = Buffer.from(signatureBase64, 'base64');
		const valid = verify(
			null,
			Buffer.from(requestBody),
			society.public_key,
			signature
		);

		if (!valid) {
			return { valid: false, error: 'Invalid signature' };
		}

		return { valid: true };
	} catch (error) {
		return { valid: false, error: 'Signature verification failed' };
	}
}

/**
 * Update society endpoint
 */
export function updateEndpoint(params: {
	handle: string;
	endpoint: string;
	endpointType?: 'hostname' | 'ip';
	signature: string;
	ipAddress?: string;
}): { success: boolean; error?: string } {
	const { handle, endpoint, endpointType = 'hostname', signature, ipAddress } = params;

	const society = lookupSociety(handle);
	if (!society) {
		return { success: false, error: 'Society not found' };
	}

	// Check status - revoked societies cannot update
	if (society.status === 'revoked') {
		return { success: false, error: 'Cannot update: Society has been revoked' };
	}

	const oldEndpoint = society.endpoint;

	// Update society record
	const stmt = db.prepare(/* sql */ `
		UPDATE societies 
		SET endpoint = ?,
		    endpoint_type = ?,
		    last_updated = unixepoch(),
		    update_count = update_count + 1
		WHERE handle = ?
	`);

	stmt.run(endpoint, endpointType, handle);

	// Log the update
	logUpdate({
		handle,
		updateType: 'endpoint',
		oldValue: oldEndpoint,
		newValue: endpoint,
		signature,
		ipAddress
	});

	// Refresh WHOIS cache
	cacheWhois(handle);

	return { success: true };
}

/**
 * Add or update DNS records
 */
export function upsertDnsRecords(params: {
	handle: string;
	records: Array<{
		type: string;
		value: string;
		ttl?: number;
		priority?: number;
	}>;
	signature: string;
	ipAddress?: string;
}): { success: boolean; added: number; error?: string } {
	const { handle, records, signature, ipAddress } = params;

	const society = lookupSociety(handle);
	if (!society) {
		return { success: false, added: 0, error: 'Society not found' };
	}

	// Check status - revoked societies cannot update
	if (society.status === 'revoked') {
		return { success: false, added: 0, error: 'Cannot add DNS records: Society has been revoked' };
	}

	let added = 0;

	for (const record of records) {
		const { type, value, ttl = 3600, priority } = record;

		// Check if record already exists
		const existing = db
			.prepare(
				'SELECT id FROM dns_records WHERE society_handle = ? AND record_type = ? AND record_value = ?'
			)
			.get(handle, type, value) as { id: number } | undefined;

		if (existing) {
			// Update existing record
			db.prepare(/* sql */ `
				UPDATE dns_records 
				SET ttl = ?, priority = ?, updated_at = unixepoch()
				WHERE id = ?
			`).run(ttl, priority, existing.id);
		} else {
			// Insert new record
			db.prepare(/* sql */ `
				INSERT INTO dns_records (society_handle, record_type, record_value, ttl, priority)
				VALUES (?, ?, ?, ?, ?)
			`).run(handle, type, value, ttl, priority);

			added++;

			// Log the addition
			logUpdate({
				handle,
				updateType: 'dns_add',
				oldValue: null,
				newValue: `${type} ${value}`,
				signature,
				ipAddress
			});
		}
	}

	// Refresh WHOIS cache after DNS changes
	if (added > 0) {
		cacheWhois(handle);
	}

	return { success: true, added };
}

/**
 * Delete DNS records by type
 */
export function deleteDnsRecords(params: {
	handle: string;
	recordType: string;
	signature: string;
	ipAddress?: string;
}): { success: boolean; deleted: number; error?: string } {
	const { handle, recordType, signature, ipAddress } = params;

	const society = lookupSociety(handle);
	if (!society) {
		return { success: false, deleted: 0, error: 'Society not found' };
	}

	// Check status - revoked societies cannot update
	if (society.status === 'revoked') {
		return { success: false, deleted: 0, error: 'Cannot delete DNS records: Society has been revoked' };
	}

	// Get records to delete (for logging)
	const records = db
		.prepare('SELECT record_value FROM dns_records WHERE society_handle = ? AND record_type = ?')
		.all(handle, recordType) as Array<{ record_value: string }>;

	// Delete the records
	const result = db
		.prepare('DELETE FROM dns_records WHERE society_handle = ? AND record_type = ?')
		.run(handle, recordType);

	const deleted = result.changes;

	// Log each deletion
	for (const record of records) {
		logUpdate({
			handle,
			updateType: 'dns_remove',
			oldValue: `${recordType} ${record.record_value}`,
			newValue: null,
			signature,
			ipAddress
		});
	}

	// Refresh WHOIS cache after DNS changes
	if (deleted > 0) {
		cacheWhois(handle);
	}

	return { success: true, deleted };
}

/**
 * Get DNS records for a society
 */
export function getDnsRecords(handle: string): Array<{
	type: string;
	value: string;
	ttl: number;
	priority: number | null;
	created_at: number;
	updated_at: number;
}> {
	const stmt = db.prepare(/* sql */ `
		SELECT 
			record_type as type,
			record_value as value,
			ttl,
			priority,
			created_at,
			updated_at
		FROM dns_records
		WHERE society_handle = ?
		ORDER BY record_type, priority, record_value
	`);

	return stmt.all(handle) as Array<{
		type: string;
		value: string;
		ttl: number;
		priority: number | null;
		created_at: number;
		updated_at: number;
	}>;
}

/**
 * Log an update to audit trail
 */
function logUpdate(params: {
	handle: string;
	updateType: string;
	oldValue: string | null;
	newValue: string | null;
	signature: string;
	ipAddress?: string;
}): void {
	const { handle, updateType, oldValue, newValue, signature, ipAddress } = params;

	db.prepare(/* sql */ `
		INSERT INTO update_log (society_handle, update_type, old_value, new_value, signature, updated_by_ip)
		VALUES (?, ?, ?, ?, ?, ?)
	`).run(handle, updateType, oldValue, newValue, signature, ipAddress || null);
}

/**
 * Get update history for a society
 */
export function getUpdateHistory(
	handle: string,
	limit = 50
): Array<{
	update_type: string;
	old_value: string | null;
	new_value: string | null;
	updated_at: number;
	updated_by_ip: string | null;
}> {
	const stmt = db.prepare(/* sql */ `
		SELECT 
			update_type,
			old_value,
			new_value,
			updated_at,
			updated_by_ip
		FROM update_log
		WHERE society_handle = ?
		ORDER BY updated_at DESC
		LIMIT ?
	`);

	return stmt.all(handle, limit) as Array<{
		update_type: string;
		old_value: string | null;
		new_value: string | null;
		updated_at: number;
		updated_by_ip: string | null;
	}>;
}

/**
 * Check rate limit for updates
 * Returns true if under limit, false if over
 */
export function checkRateLimit(handle: string, action: string): boolean {
	const oneDayAgo = Math.floor(Date.now() / 1000) - 86400;

	// Count updates in last 24 hours
	const result = db
		.prepare(
			/* sql */ `
		SELECT COUNT(*) as count 
		FROM update_log 
		WHERE society_handle = ? 
		  AND update_type = ? 
		  AND updated_at > ?
	`
		)
		.get(handle, action, oneDayAgo) as { count: number };

	const limits: Record<string, number> = {
		endpoint: 10, // 10 endpoint updates per day
		dns_add: 50, // 50 DNS additions per day
		dns_remove: 50 // 50 DNS removals per day
	};

	const limit = limits[action] || 100;

	return result.count < limit;
}

/**
 * Compute WHOIS information for a society
 * Returns comprehensive domain registration details
 */
export function computeWhois(handle: string) {
	// Get society info
	const society = db
		.prepare(
			/* sql */ `
		SELECT 
			handle, uuid, parent_handle, public_key, endpoint, endpoint_type,
			status, founded_at, registered_at, last_updated, update_count,
			founding_record_json
		FROM societies
		WHERE handle = ?
	`
		)
		.get(handle) as any;

	if (!society) {
		return null;
	}

	// Get DNS records
	const dnsRecords = db
		.prepare(
			/* sql */ `
		SELECT record_type, record_value, ttl, priority
		FROM dns_records
		WHERE society_handle = ?
		ORDER BY record_type, priority, record_value
	`
		)
		.all(handle) as any[];

	// Get founding record
	let foundingRecord: any = null;
	try {
		foundingRecord = JSON.parse(society.founding_record_json || '{}');
	} catch {
		// Invalid JSON, skip
	}

	// Get lineage path
	const lineage = getLineageFromCache(handle);

	// Get last update info
	const lastUpdate = db
		.prepare(
			/* sql */ `
		SELECT update_type, new_value, updated_at
		FROM update_log
		WHERE society_handle = ?
		ORDER BY updated_at DESC
		LIMIT 1
	`
		)
		.get(handle) as any;

	// Build WHOIS response
	const whois = {
		domain: `${handle}.bfs`,
		handle: society.handle,
		uuid: society.uuid,
		status: society.status,
		registrar: 'BFS Federation',
		created_date: new Date(society.founded_at * 1000).toISOString(),
		registered_date: new Date(society.registered_at * 1000).toISOString(),
		last_updated: society.last_updated
			? new Date(society.last_updated * 1000).toISOString()
			: null,
		update_count: society.update_count || 0,
		endpoint: {
			url: society.endpoint,
			type: society.endpoint_type || 'hostname'
		},
		parent: society.parent_handle ? `${society.parent_handle}.bfs` : null,
		lineage: lineage || [society.handle],
		public_key_fingerprint: society.public_key.substring(0, 100) + '...',
		dns_records: dnsRecords.map(r => ({
			type: r.record_type,
			value: r.record_value,
			ttl: r.ttl,
			...(r.priority && { priority: r.priority })
		})),
		last_change:
			lastUpdate
				? {
						type: lastUpdate.update_type,
						value: lastUpdate.new_value,
						date: new Date(lastUpdate.updated_at * 1000).toISOString()
					}
				: null,
		computed_at: new Date().toISOString()
	};

	return whois;
}

/**
 * Cache WHOIS data in database
 * Called after registration or updates
 */
export function cacheWhois(handle: string) {
	const whois = computeWhois(handle);
	const whoisJson = JSON.stringify(whois);

	db.prepare(
		/* sql */ `
		INSERT INTO whois_cache (society_handle, whois_json, computed_at)
		VALUES (?, ?, unixepoch())
		ON CONFLICT (society_handle) DO UPDATE
		SET whois_json = excluded.whois_json,
		    computed_at = excluded.computed_at
	`
	).run(handle, whoisJson);

	return { success: true, whois };
}

/**
 * Get cached WHOIS data
 * Returns cached data if fresh (< 1 hour old), otherwise recomputes
 */
export function getWhois(handle: string) {
	// Check cache
	const cached = db
		.prepare(
			/* sql */ `
		SELECT whois_json, computed_at
		FROM whois_cache
		WHERE society_handle = ?
	`
		)
		.get(handle) as any;

	const oneHourAgo = Math.floor(Date.now() / 1000) - 3600;

	// If cached and fresh, return it
	if (cached && cached.computed_at > oneHourAgo) {
		try {
			return JSON.parse(cached.whois_json);
		} catch {
			// Invalid JSON, recompute
		}
	}

	// Cache miss or stale - recompute and cache
	const result = cacheWhois(handle);
	return result.success ? result.whois : null;
}

/**
 * Simple resolve function - just return endpoint
 * Fast lookup for P2P clients
 */
export function resolveDomain(handle: string) {
	const result = db
		.prepare(
			/* sql */ `
		SELECT handle, endpoint, endpoint_type, status
		FROM societies
		WHERE handle = ?
	`
		)
		.get(handle) as any;

	if (!result) {
		return null;
	}

	if (result.status !== 'active') {
		return {
			handle: result.handle,
			domain: `${result.handle}.bfs`,
			status: result.status,
			endpoint: null
		};
	}

	return {
		handle: result.handle,
		domain: `${result.handle}.bfs`,
		endpoint: result.endpoint,
		endpoint_type: result.endpoint_type || 'hostname',
		status: result.status
	};
}

/**
 * Change society status
 * Records change in status_history table
 */
export function changeStatus(params: {
	handle: string;
	newStatus: 'active' | 'suspended' | 'revoked';
	reason?: string;
	changedBy: string;
}): { success: boolean; error?: string } {
	const { handle, newStatus, reason, changedBy } = params;

	const society = lookupSociety(handle);
	if (!society) {
		return { success: false, error: 'Society not found' };
	}

	const oldStatus = society.status;

	// No-op if status hasn't changed
	if (oldStatus === newStatus) {
		return { success: true };
	}

	// Validate status transition
	const validStatuses = ['active', 'suspended', 'revoked'];
	if (!validStatuses.includes(newStatus)) {
		return { success: false, error: `Invalid status: ${newStatus}` };
	}

	// Update society status
	db.prepare(/* sql */ `
		UPDATE societies 
		SET status = ?, last_updated = unixepoch()
		WHERE handle = ?
	`).run(newStatus, handle);

	// Record in status history
	db.prepare(/* sql */ `
		INSERT INTO status_history (society_handle, old_status, new_status, reason, changed_by)
		VALUES (?, ?, ?, ?, ?)
	`).run(handle, oldStatus, newStatus, reason || null, changedBy);

	// Log in update log
	logUpdate({
		handle,
		updateType: 'status',
		oldValue: oldStatus,
		newValue: newStatus,
		signature: `status_change_${changedBy}`,
		ipAddress: undefined
	});

	// Refresh WHOIS cache
	cacheWhois(handle);

	return { success: true };
}

/**
 * Get status history for a society
 */
export function getStatusHistory(handle: string, limit: number = 50) {
	const stmt = db.prepare(/* sql */ `
		SELECT old_status, new_status, reason, changed_by, changed_at
		FROM status_history
		WHERE society_handle = ?
		ORDER BY changed_at DESC
		LIMIT ?
	`);

	const history = stmt.all(handle, limit) as Array<{
		old_status: string | null;
		new_status: string;
		reason: string | null;
		changed_by: string;
		changed_at: number;
	}>;

	return history.map(h => ({
		old_status: h.old_status,
		new_status: h.new_status,
		reason: h.reason,
		changed_by: h.changed_by,
		changed_at: new Date(h.changed_at * 1000).toISOString()
	}));
}

/**
 * Validate status for operations
 * Returns true if society can perform the operation based on status
 */
export function validateStatus(handle: string, operation: 'resolve' | 'update'): {
	allowed: boolean;
	status: string;
	reason?: string;
} {
	const society = lookupSociety(handle);
	if (!society) {
		return { allowed: false, status: 'not_found', reason: 'Society not found' };
	}

	const status = society.status;

	switch (operation) {
		case 'resolve':
			// Only active societies can be resolved
			if (status === 'active') {
				return { allowed: true, status };
			}
			return {
				allowed: false,
				status,
				reason: status === 'suspended' ? 'Society suspended' : 'Society revoked'
			};

		case 'update':
			// Suspended societies can update (to become active again)
			// Revoked societies cannot update
			if (status === 'active' || status === 'suspended') {
				return { allowed: true, status };
			}
			return {
				allowed: false,
				status,
				reason: 'Society has been revoked and cannot be updated'
			};

		default:
			return { allowed: false, status, reason: 'Unknown operation' };
	}
}

