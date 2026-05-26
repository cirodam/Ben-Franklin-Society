import { GOVERNANCE_URL, GOVERNANCE_SHARED_SECRET } from '$env/static/private';

export interface PersonInfo {
	uuid: string;
	handle: string;
	name: string;
}

/**
 * Resolve a handle to a person UUID by calling the governance API
 */
export async function resolveHandle(handle: string): Promise<PersonInfo | null> {
	try {
		const url = `${GOVERNANCE_URL}/api/resolve-handle?handle=${encodeURIComponent(handle)}`;
		console.log('[resolveHandle] Calling:', url);
		
		const response = await fetch(url, {
			headers: {
				Authorization: `Bearer ${GOVERNANCE_SHARED_SECRET}`
			}
		});

		console.log('[resolveHandle] Response status:', response.status);

		if (!response.ok) {
			if (response.status === 404) {
				console.log('[resolveHandle] Person not found');
				return null;
			}
			const text = await response.text();
			console.error('[resolveHandle] API error:', response.status, text);
			throw new Error(`Governance API error: ${response.status}`);
		}

		const data = await response.json();
		console.log('[resolveHandle] Success:', data);
		return data;
	} catch (err) {
		console.error('[resolveHandle] Exception:', err);
		return null;
	}
}
