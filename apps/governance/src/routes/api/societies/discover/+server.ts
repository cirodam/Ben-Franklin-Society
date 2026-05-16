import { json } from '@sveltejs/kit';
import { lookupInFederation } from '$lib/server/federation/client.js';
import type { RequestHandler } from './$types.js';

/**
 * POST /api/societies/discover
 * Discover a society by querying Federation or directly querying their endpoint
 * Body: { handle: "columbus" }  OR  { endpoint: "https://columbus.bfs/" }
 */
export const POST: RequestHandler = async ({ request }) => {
	try {
		const body = await request.json();
		const { handle, endpoint } = body;

		if (!handle && !endpoint) {
			return json(
				{ error: 'Either handle or endpoint required' },
				{ status: 400 }
			);
		}

		// If we have a handle, look it up in Federation
		if (handle) {
			const society = await lookupInFederation(handle);

			if (!society) {
				return json(
					{ error: 'Society not found in Federation' },
					{ status: 404 }
				);
			}

			return json({ society });
		}

		// If we have an endpoint, query it directly for identity
		// Then look up in Federation or cache directly
		if (endpoint) {
			try {
				const response = await fetch(`${endpoint}/api/lineage`);
				if (!response.ok) {
					return json(
						{ error: 'Failed to query society endpoint' },
						{ status: 400 }
					);
				}

				const identity = await response.json();

				// Try to find in Federation
				const society = await lookupInFederation(identity.handle);

				if (!society) {
					return json(
						{ error: 'Society not registered in Federation', identity },
						{ status: 404 }
					);
				}

				return json({ society });
			} catch (error) {
				return json(
					{ error: 'Failed to connect to society endpoint' },
					{ status: 400 }
				);
			}
		}

		return json({ error: 'Invalid request' }, { status: 400 });
	} catch (error) {
		console.error('Discovery error:', error);
		return json(
			{ error: 'Internal server error' },
			{ status: 500 }
		);
	}
};
