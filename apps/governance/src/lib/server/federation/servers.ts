import { db } from '../db.js';

export interface FederationServer {
	uuid: string;
	url: string;
	handle: string | null;
	service_type: string;
	is_primary: number;
	connection_status: string;
	connected_at: number | null;
	last_contacted_at: number | null;
	created_at: number;
	updated_at: number;
}

/**
 * Get all federation servers
 */
export function getAllFederationServers(): FederationServer[] {
	const stmt = db.prepare(/* sql */ `
		SELECT uuid, url, handle, service_type, is_primary, connection_status, connected_at, last_contacted_at, created_at, updated_at
		FROM federation_servers
		ORDER BY is_primary DESC, created_at ASC
	`);
	return stmt.all() as FederationServer[];
}

/**
 * Get the primary federation server
 */
export function getPrimaryFederationServer(): FederationServer | null {
	const stmt = db.prepare(/* sql */ `
		SELECT uuid, url, handle, service_type, is_primary, connection_status, connected_at, last_contacted_at, created_at, updated_at
		FROM federation_servers
		WHERE is_primary = 1
		LIMIT 1
	`);
	return (stmt.get() as FederationServer) || null;
}

/**
 * Get a federation server by UUID
 */
export function getFederationServer(uuid: string): FederationServer | null {
	const stmt = db.prepare(/* sql */ `
		SELECT uuid, url, handle, service_type, is_primary, connection_status, connected_at, last_contacted_at, created_at, updated_at
		FROM federation_servers
		WHERE uuid = ?
	`);
	return (stmt.get(uuid) as FederationServer) || null;
}

/**
 * Add a new federation server
 */
export function addFederationServer(params: {
	uuid: string;
	url: string;
	handle?: string | null;
	serviceType?: string;
	isPrimary?: boolean;
}): void {
	const stmt = db.prepare(/* sql */ `
		INSERT INTO federation_servers (uuid, url, handle, service_type, is_primary)
		VALUES (?, ?, ?, ?, ?)
	`);
	stmt.run(params.uuid, params.url, params.handle || null, params.serviceType || 'registry', params.isPrimary ? 1 : 0);
}

/**
 * Update a federation server
 */
export function updateFederationServer(params: {
	uuid: string;
	url?: string;
	handle?: string | null;
	serviceType?: string;
	isPrimary?: boolean;
}): void {
	const updates: string[] = [];
	const values: any[] = [];

	if (params.url !== undefined) {
		updates.push('url = ?');
		values.push(params.url);
	}
	if (params.handle !== undefined) {
		updates.push('handle = ?');
		values.push(params.handle);
	}
	if (params.serviceType !== undefined) {
		updates.push('service_type = ?');
		values.push(params.serviceType);
	}
	if (params.isPrimary !== undefined) {
		updates.push('is_primary = ?');
		values.push(params.isPrimary ? 1 : 0);
	}

	updates.push('updated_at = unixepoch()');
	values.push(params.uuid);

	const stmt = db.prepare(/* sql */ `
		UPDATE federation_servers
		SET ${updates.join(', ')}
		WHERE uuid = ?
	`);
	stmt.run(...values);
}

/**
 * Set a server as primary (and unset all others)
 */
export function setPrimaryFederationServer(uuid: string): void {
	const unsetStmt = db.prepare(/* sql */ `
		UPDATE federation_servers SET is_primary = 0
	`);
	const setStmt = db.prepare(/* sql */ `
		UPDATE federation_servers SET is_primary = 1, updated_at = unixepoch() WHERE uuid = ?
	`);

	db.transaction(() => {
		unsetStmt.run();
		setStmt.run(uuid);
	})();
}

/**
 * Delete a federation server
 */
export function deleteFederationServer(uuid: string): void {
	const stmt = db.prepare(/* sql */ `
		DELETE FROM federation_servers WHERE uuid = ?
	`);
	stmt.run(uuid);
}

/**
 * Update last contacted timestamp
 */
export function updateFederationServerContact(uuid: string): void {
	const stmt = db.prepare(/* sql */ `
		UPDATE federation_servers
		SET last_contacted_at = unixepoch(), updated_at = unixepoch()
		WHERE uuid = ?
	`);
	stmt.run(uuid);
}

/**
 * Update connection status
 */
export function updateFederationServerConnectionStatus(params: {
	uuid: string;
	status: 'connected' | 'disconnected' | 'pending';
}): void {
	const { uuid, status } = params;
	const connectedAt = status === 'connected' ? 'unixepoch()' : 'connected_at';
	
	const stmt = db.prepare(/* sql */ `
		UPDATE federation_servers
		SET connection_status = ?, 
		    connected_at = ${connectedAt},
		    updated_at = unixepoch()
		WHERE uuid = ?
	`);
	stmt.run(status, uuid);
}
