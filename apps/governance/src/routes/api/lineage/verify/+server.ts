import { json } from '@sveltejs/kit';
import { verifyFoundingRecord } from '$lib/server/lineage/verification.js';
import type { RequestHandler } from './$types.js';
import type { FoundingRecord } from '$lib/server/lineage/identity.js';

/**
 * POST /api/lineage/verify
 * Verify a founding record's cryptographic signature
 * 
 * Body: { founding_record: FoundingRecord }
 * Returns: { valid: boolean, lineage: string[] }
 */
export const POST: RequestHandler = async ({ request }) => {
	const body = await request.json();
	const foundingRecord = body.founding_record as FoundingRecord;

	if (!foundingRecord) {
		return json(
			{ error: 'founding_record required in body' },
			{ status: 400 }
		);
	}

	const valid = verifyFoundingRecord(foundingRecord);

	return json({
		valid,
		lineage: [foundingRecord.child.handle, foundingRecord.parent.handle]
	});
};
