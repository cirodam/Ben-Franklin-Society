/**
 * Governance API Client
 * 
 * Helper functions to query the Governance app's REST API.
 * Provides a clean interface for session validation, permission checks,
 * and entity lookups without direct database access.
 */

const GOVERNANCE_URL = process.env.GOVERNANCE_URL ?? 'http://localhost:5173';

export interface Person {
	uuid: string;
	handle: string;
	given_name: string;
	family_name: string;
	status: string;
	street_address?: string | null;
	latitude?: number | null;
	longitude?: number | null;
}

export interface PersonSyncData extends Person {
	date_of_birth: string;
	created_at: string;
	updated_at: string;
}

export interface Association {
	uuid: string;
	handle: string;
	name: string;
	status: string;
}

export interface AssociationSyncData extends Association {
	created_at: string;
	updated_at: string;
}

/**
 * Lookup a person by their handle.
 * Returns null if not found or on error.
 */
export async function lookupPersonByHandle(handle: string): Promise<Person | null> {
	try {
		const response = await fetch(
			`${GOVERNANCE_URL}/api/persons/by-handle/${encodeURIComponent(handle)}`,
			{
				method: 'GET',
				headers: { Accept: 'application/json' },
			}
		);

		if (response.status === 404) return null;

		if (!response.ok) {
			console.error(
				`Governance API person lookup failed: ${response.status} ${response.statusText}`
			);
			return null;
		}

		return await response.json();
	} catch (err) {
		console.error('Governance API network error (person lookup):', err);
		return null;
	}
}

/**
 * Lookup an association by handle.
 * Returns null if not found or on error.
 */
export async function lookupAssociationByHandle(
	handle: string
): Promise<Association | null> {
	try {
		const response = await fetch(
			`${GOVERNANCE_URL}/api/associations/by-handle/${encodeURIComponent(handle)}`,
			{
				method: 'GET',
				headers: { Accept: 'application/json' },
			}
		);

		if (response.status === 404) return null;

		if (!response.ok) {
			console.error(
				`Governance API association lookup failed: ${response.status} ${response.statusText}`
			);
			return null;
		}

		return await response.json();
	} catch (err) {
		console.error('Governance API network error (association lookup):', err);
		return null;
	}
}

/**
 * Get all person UUIDs with a specific role.
 * Returns empty array on error.
 */
export async function getMembersByRole(role_code: string): Promise<string[]> {
	try {
		const response = await fetch(
			`${GOVERNANCE_URL}/api/members/by-role/${encodeURIComponent(role_code)}`,
			{
				method: 'GET',
				headers: { Accept: 'application/json' },
			}
		);

		if (!response.ok) {
			console.error(
				`Governance API members lookup failed: ${response.status} ${response.statusText}`
			);
			return [];
		}

		const data = await response.json();
		return data.person_uuids ?? [];
	} catch (err) {
		console.error('Governance API network error (members lookup):', err);
		return [];
	}
}

/**
 * Get person data for synchronization.
 * Optionally provide updated_since timestamp for incremental sync.
 * Returns empty array on error.
 */
export async function syncPersons(updated_since?: string): Promise<PersonSyncData[]> {
	try {
		const url = new URL(`${GOVERNANCE_URL}/api/persons/sync-data`);
		if (updated_since) {
			url.searchParams.set('updated_since', updated_since);
		}

		const response = await fetch(url.toString(), {
			method: 'GET',
			headers: { Accept: 'application/json' },
		});

		if (!response.ok) {
			console.error(
				`Governance API persons sync failed: ${response.status} ${response.statusText}`
			);
			return [];
		}

		const data = await response.json();
		return data.persons ?? [];
	} catch (err) {
		console.error('Governance API network error (persons sync):', err);
		return [];
	}
}

/**
 * Get association data for synchronization.
 * Optionally provide updated_since timestamp for incremental sync.
 * Returns empty array on error.
 */
export async function syncAssociations(
	updated_since?: string
): Promise<AssociationSyncData[]> {
	try {
		const url = new URL(`${GOVERNANCE_URL}/api/associations/sync-data`);
		if (updated_since) {
			url.searchParams.set('updated_since', updated_since);
		}

		const response = await fetch(url.toString(), {
			method: 'GET',
			headers: { Accept: 'application/json' },
		});

		if (!response.ok) {
			console.error(
				`Governance API associations sync failed: ${response.status} ${response.statusText}`
			);
			return [];
		}

		const data = await response.json();
		return data.associations ?? [];
	} catch (err) {
		console.error('Governance API network error (associations sync):', err);
		return [];
	}
}
