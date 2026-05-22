export interface Association {
	uuid: string;
	handle: string;
	name: string;
	description: string | null;
	type: string;
	status: string;
}

/**
 * Get associations that a user is a member of
 * Makes an API call to governance instead of direct DB access
 */
export async function getUserAssociations(userUuid: string, accessToken: string): Promise<Association[]> {
	const governanceUrl = process.env.GOVERNANCE_URL ?? 'http://localhost:5173';
	
	try {
		const response = await fetch(`${governanceUrl}/api/me/associations`, {
			headers: {
				'Authorization': `Bearer ${accessToken}`
			}
		});

		if (!response.ok) {
			console.error('[library/associations] Failed to fetch associations:', response.status);
			return [];
		}

		const data = await response.json();
		return data.associations || [];
	} catch (err) {
		console.error('[library/associations] Error fetching associations:', err);
		return [];
	}
}

/**
 * Check if a user is a member of an association
 * Makes an API call to governance instead of direct DB access
 */
export async function isAssociationMember(
	userUuid: string, 
	associationHandle: string, 
	accessToken: string
): Promise<boolean> {
	const associations = await getUserAssociations(userUuid, accessToken);
	return associations.some(a => a.handle === associationHandle);
}

/**
 * Get association by handle
 */
export function getAssociationByHandle(handle: string): Association | null {
	const association = governanceDb.prepare(`
		SELECT *
		FROM association
		WHERE handle = ?
		  AND status = 'active'
	`).get(handle) as Association | undefined;

	return association ?? null;
}
