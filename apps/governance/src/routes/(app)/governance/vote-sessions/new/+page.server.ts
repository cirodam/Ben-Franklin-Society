import { error, fail, redirect } from '@sveltejs/kit';
import type { PageServerLoad, Actions } from './$types.js';
import { createVoteSession } from '$lib/server/governance/vote-sessions';
import { getMotionByUuid } from '$lib/server/governance/motions';
import { hasPermission, PERMISSIONS } from '$lib/server/infrastructure/permissions';
import { audit } from '$lib/server/documents/audit';
import { addEntry } from '$lib/server/communications/record';

export const load: PageServerLoad = async ({ url, locals }) => {
	if (!locals.session) {
		error(401, 'Not authenticated');
	}

	const motionUuid = url.searchParams.get('motion_uuid');
	if (!motionUuid) {
		error(400, 'motion_uuid parameter required');
	}

	const motion = getMotionByUuid(motionUuid);
	if (!motion) {
		error(404, 'Motion not found');
	}

	// Check if user can create vote sessions
	const actingAs = locals.session.acting_as_uuid;
	const canCreate = hasPermission(actingAs, PERMISSIONS.VOTE_SESSIONS_CREATE, motion.body_uuid);
	if (!canCreate) {
		error(403, 'Insufficient permissions to create vote sessions');
	}

	return {
		motion,
		actingAs
	};
};

export const actions: Actions = {
	create: async ({ request, locals }) => {
		if (!locals.session) error(401, 'Not authenticated');
		const actingAs = locals.session.acting_as_uuid;

		const data = await request.formData();
		const motionUuid = data.get('motion_uuid') as string;
		const passingThreshold = parseFloat(data.get('passing_threshold') as string);
		const requiresQuorum = data.get('requires_quorum') === 'true';
		const quorumThreshold = data.get('quorum_threshold') ? parseFloat(data.get('quorum_threshold') as string) : null;
		const opensAt = data.get('opens_at') as string;
		const closesAt = data.get('closes_at') as string;

		// Validate
		if (!motionUuid || !opensAt || !closesAt) {
			return fail(400, { error: 'Missing required fields' });
		}

		if (isNaN(passingThreshold) || passingThreshold <= 0 || passingThreshold > 1) {
			return fail(400, { error: 'Passing threshold must be between 0 and 1' });
		}

		if (requiresQuorum) {
			if (!quorumThreshold || isNaN(quorumThreshold) || quorumThreshold <= 0 || quorumThreshold > 1) {
				return fail(400, { error: 'Valid quorum threshold required when quorum is enabled' });
			}
		}

		const motion = getMotionByUuid(motionUuid);
		if (!motion) {
			return fail(404, { error: 'Motion not found' });
		}

		if (!hasPermission(actingAs, PERMISSIONS.VOTE_SESSIONS_CREATE, motion.body_uuid)) {
			return fail(403, { error: 'Insufficient permissions' });
		}

		try {
			const session = createVoteSession({
				motion_uuid: motionUuid,
				opened_by: actingAs,
				passing_threshold: passingThreshold,
				requires_quorum: requiresQuorum,
				quorum_threshold: requiresQuorum ? quorumThreshold : null,
				opens_at: opensAt,
				closes_at: closesAt,
				meeting_uuid: undefined
			});

			audit(actingAs, 'vote_session.create', 'vote_session', session.uuid,
				`Created vote session for motion "${motion.title}"`);
			addEntry(motion.body_uuid, actingAs, 'vote_session_created', 'vote_session', session.uuid,
				`Vote session created for motion "${motion.title}"`);

			throw redirect(303, `/vote-sessions/${session.uuid}`);
		} catch (err) {
			if (err instanceof Response) throw err; // redirect
			return fail(400, { error: err instanceof Error ? err.message : 'Failed to create session' });
		}
	}
};
