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
}

export interface Association {
	uuid: string;
	handle: string;
	name: string;
	status: string;
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
