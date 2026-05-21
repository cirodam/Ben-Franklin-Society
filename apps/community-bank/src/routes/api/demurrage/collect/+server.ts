import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { collectDemurrage } from '$lib/server/domain/demurrage.js';
import { getOidcClient } from '$lib/server/auth/oidc.js';
import { canCollectDemurrage } from '$lib/server/auth/authorization.js';

/**
 * POST /api/demurrage/collect
 * Execute demurrage collection operation
 * Requires bank:collect_demurrage permission
 */
export const POST: RequestHandler = async ({ request, cookies }) => {
	const client = getOidcClient();
	const session = await client.getSession(cookies);

	if (!session) {
		return json({ error: 'Unauthorized' }, { status: 401 });
	}

	// Check for collect_demurrage permission
	if (!canCollectDemurrage(session)) {
		return json(
			{ error: 'Forbidden: bank:collect_demurrage permission required' },
			{ status: 403 }
		);
	}

	const body = await request.json();
	const collectionDate = body.collection_date;
	const notes = body.notes;

	try {
		const result = collectDemurrage({
			performedByUuid: session.acting_as_uuid,
			collectionDate,
			notes
		});

		return json({
			success: true,
			operation: result.operation,
			summary: result.summary
		});
	} catch (error) {
		return json({ error: (error as Error).message }, { status: 400 });
	}
};
