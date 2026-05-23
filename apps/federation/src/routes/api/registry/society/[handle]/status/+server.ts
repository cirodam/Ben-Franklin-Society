import { json } from '@sveltejs/kit';
import { changeStatus } from '$lib/server/updates.js';
import { lookupSociety } from '$lib/server/queries.js';
import type { RequestHandler } from './$types.js';

/**
 * GET /api/registry/society/:handle/status
 * Get current status and status history for a society
 */
export const GET: RequestHandler = async ({ params }) => {
	const { handle } = params;

	const society = lookupSociety(handle);
	if (!society) {
		return json({ error: 'Society not found' }, { status: 404 });
	}

	return json({
		handle,
		current_status: society.status
	});
};

/**
 * PATCH /api/registry/society/:handle/status
 * Change society status (admin operation)
 * 
 * Body: {
 *   status: 'active' | 'suspended' | 'revoked',
 *   reason?: string,
 *   admin_key: string  // TODO: Replace with proper admin authentication
 * }
 * 
 * Status lifecycle:
 * - active: Normal operation, all features available
 * - suspended: Temporarily disabled, can be reactivated
 * - revoked: Permanently disabled, cannot be reactivated
 * 
 * Note: This is a placeholder admin endpoint. In production, this should
 * require proper authentication/authorization (governance vote, admin credentials, etc.)
 */
export const PATCH: RequestHandler = async ({ params, request, getClientAddress }) => {
	const { handle } = params;

	// Parse request body
	let body: any;
	try {
		body = await request.json();
	} catch {
		return json({ error: 'Invalid JSON' }, { status: 400 });
	}

	const { status: newStatus, reason, admin_key } = body;

	// Validate required fields
	if (!newStatus) {
		return json({ error: 'Missing required field: status' }, { status: 400 });
	}

	// Validate status value
	const validStatuses = ['active', 'suspended', 'revoked'];
	if (!validStatuses.includes(newStatus)) {
		return json(
			{ error: `Invalid status. Must be one of: ${validStatuses.join(', ')}` },
			{ status: 400 }
		);
	}

	// TODO: Replace with proper admin authentication
	// For now, require an admin_key parameter (placeholder)
	if (!admin_key) {
		return json(
			{ error: 'Admin authentication required (admin_key missing)' },
			{ status: 401 }
		);
	}

	// Placeholder admin check - in production, verify admin_key properly
	const PLACEHOLDER_ADMIN_KEY = 'federation_admin_2026';
	if (admin_key !== PLACEHOLDER_ADMIN_KEY) {
		return json({ error: 'Invalid admin credentials' }, { status: 403 });
	}

	// Change status
	const result = changeStatus({
		handle,
		newStatus,
		reason,
		changedBy: `admin@${getClientAddress()}`
	});

	if (!result.success) {
		return json({ error: result.error || 'Failed to change status' }, { status: 500 });
	}

	// Get updated society
	const society = lookupSociety(handle);

	return json({
		success: true,
		handle,
		new_status: newStatus,
		previous_status: history[0]?.old_status || 'unknown',
		reason: reason || null,
		history
	});
};
