import { json } from '@sveltejs/kit';
import { issueVouch } from '$lib/server/federation/vouching/issuer.js';
import type { RequestHandler } from './$types.js';

/**
 * POST /api/vouching/issue
 * Issue a vouch credential for another society
 * Body: { vouched_for: string, vouch_type: string, confidence: string, statement: string }
 */
export const POST: RequestHandler = async ({ request }) => {
	try {
		const body = await request.json();
		const { vouched_for, vouch_type, confidence, statement } = body;

		if (!vouched_for || !vouch_type || !confidence || !statement) {
			return json(
				{ error: 'Missing required fields: vouched_for, vouch_type, confidence, statement' },
				{ status: 400 }
			);
		}

		// Validate vouch_type
		const validTypes = ['general', 'banking', 'governance', 'technical'];
		if (!validTypes.includes(vouch_type)) {
			return json(
				{ error: `Invalid vouch_type. Must be one of: ${validTypes.join(', ')}` },
				{ status: 400 }
			);
		}

		// Validate confidence
		const validConfidence = ['strong', 'moderate', 'weak'];
		if (!validConfidence.includes(confidence)) {
			return json(
				{ error: `Invalid confidence. Must be one of: ${validConfidence.join(', ')}` },
				{ status: 400 }
			);
		}

		const credential = issueVouch({
			vouchedFor: vouched_for,
			vouchType: vouch_type,
			confidence,
			statement
		});

		return json({
			success: true,
			credential
		});
	} catch (error) {
		console.error('Issue vouch error:', error);
		return json(
			{ error: error instanceof Error ? error.message : 'Failed to issue vouch' },
			{ status: 500 }
		);
	}
};
