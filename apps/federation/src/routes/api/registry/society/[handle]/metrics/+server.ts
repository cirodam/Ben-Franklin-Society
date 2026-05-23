import { json } from '@sveltejs/kit';
import { lookupSociety } from '$lib/server/queries.js';
import { verifyUpdateRequest, updateMetrics } from '$lib/server/updates.js';
import type { RequestHandler } from './$types.js';

/**
 * GET /api/registry/society/:handle/metrics
 * Get society metrics (people_count, person_years, issued_florens)
 */
export const GET: RequestHandler = async ({ params }) => {
	const { handle } = params;

	const society = lookupSociety(handle);

	if (!society) {
		return json({ error: 'Society not found' }, { status: 404 });
	}

	return json({
		handle: society.handle,
		uuid: society.uuid,
		people_count: society.people_count,
		person_years: society.person_years,
		issued_florens: society.issued_florens
	});
};

/**
 * PATCH /api/registry/society/:handle/metrics
 * Update society metrics (requires signature authentication)
 * 
 * Headers: Authorization: Signature <base64-signature>
 * Body: {
 *   people_count?: number,
 *   person_years?: number,
 *   timestamp: number
 * }
 */
export const PATCH: RequestHandler = async ({ params, request }) => {
	const { handle } = params;

	// Get authorization header
	const authHeader = request.headers.get('authorization');
	if (!authHeader || !authHeader.startsWith('Signature ')) {
		return json({ error: 'Missing or invalid Authorization header' }, { status: 401 });
	}

	const signatureBase64 = authHeader.substring('Signature '.length);

	// Get request body
	let body: any;
	const bodyText = await request.text();
	try {
		body = JSON.parse(bodyText);
	} catch {
		return json({ error: 'Invalid JSON' }, { status: 400 });
	}

	// Verify signature
	const verification = verifyUpdateRequest({
		handle,
		requestBody: bodyText,
		signatureBase64
	});

	if (!verification.valid) {
		return json({ error: verification.error }, { status: 401 });
	}

	const { people_count, person_years } = body;

	// Update metrics
	const result = updateMetrics({
		handle,
		peopleCount: people_count,
		personYears: person_years
	});

	if (!result.success) {
		return json({ error: result.error }, { status: 400 });
	}

	// Return updated society metrics
	const society = lookupSociety(handle);
	return json({
		success: true,
		metrics: {
			people_count: society?.people_count,
			person_years: society?.person_years,
			issued_florens: society?.issued_florens
		}
	});
};
