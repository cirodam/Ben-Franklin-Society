import { error, fail } from '@sveltejs/kit';
import type { PageServerLoad, Actions } from './$types.js';
import { 
	getVoteSession, 
	getSessionTally, 
	canVote, 
	hasVoted, 
	castVote,
	closeVoteSession,
	finalizeVoteSession,
	type VoteChoice
} from '$lib/server/governance/vote-sessions';
import { getMotionByUuid } from '$lib/server/governance/motions';
import { hasPermission, PERMISSIONS } from '$lib/server/infrastructure/permissions';
import { db } from '$lib/server/db.js';
import { audit } from '$lib/server/documents/audit';
import { addEntry } from '$lib/server/communications/record';

export const load: PageServerLoad = async ({ params, locals }) => {
	const session = getVoteSession(params.uuid);
	if (!session) error(404, 'Vote session not found');

	const motion = getMotionByUuid(session.motion_uuid);
	if (!motion) error(404, 'Motion not found');

	const body = db.prepare('SELECT name, abbreviation FROM association WHERE uuid = ?')
		.get(motion.body_uuid) as { name: string; abbreviation: string | null } | undefined;

	const opener = db.prepare('SELECT given_name, family_name, handle FROM person WHERE uuid = ?')
		.get(session.opened_by) as { given_name: string; family_name: string; handle: string } | undefined;

	const tally = getSessionTally(session.uuid);

	let userCanVote = false;
	let userHasVoted = false;
	let canClose = false;
	let canFinalize = false;
	let actingAs: string | null = null;

	if (locals.session) {
		actingAs = locals.session.acting_as_uuid;
		userCanVote = canVote(session.uuid, actingAs);
		userHasVoted = hasVoted(session.uuid, actingAs);
		canClose = hasPermission(actingAs, PERMISSIONS.VOTE_SESSIONS_CLOSE, motion.body_uuid);
		canFinalize = hasPermission(actingAs, PERMISSIONS.VOTE_SESSIONS_FINALIZE, motion.body_uuid);
	}

	return {
		session,
		motion,
		body,
		opener,
		tally,
		userCanVote,
		userHasVoted,
		canClose,
		canFinalize,
		actingAs
	};
};

export const actions: Actions = {
	vote: async ({ params, locals, request }) => {
		if (!locals.session) error(401, 'Not authenticated');
		const actingAs = locals.session.acting_as_uuid;

		const session = getVoteSession(params.uuid);
		if (!session) error(404, 'Vote session not found');

		const data = await request.formData();
		const choice = data.get('choice') as string;
		const validChoices: VoteChoice[] = ['aye', 'nay', 'abstain'];
		if (!validChoices.includes(choice as VoteChoice)) {
			return fail(400, { error: 'Invalid vote choice' });
		}

		try {
			castVote(session.uuid, actingAs, choice as VoteChoice);
			
			const motion = getMotionByUuid(session.motion_uuid);
			if (motion) {
				audit(actingAs, 'vote_session.vote', 'vote_session', session.uuid, 
					`Voted on session for motion "${motion.title}"`);
			}
		} catch (err) {
			return fail(400, { error: err instanceof Error ? err.message : 'Vote failed' });
		}

		return { success: true };
	},

	close: async ({ params, locals }) => {
		if (!locals.session) error(401, 'Not authenticated');
		const actingAs = locals.session.acting_as_uuid;

		const session = getVoteSession(params.uuid);
		if (!session) error(404, 'Vote session not found');

		const motion = getMotionByUuid(session.motion_uuid);
		if (!motion) error(404, 'Motion not found');

		if (!hasPermission(actingAs, PERMISSIONS.VOTE_SESSIONS_CLOSE, motion.body_uuid)) {
			return fail(403, { error: 'Insufficient permissions' });
		}

		try {
			closeVoteSession(session.uuid);
			audit(actingAs, 'vote_session.close', 'vote_session', session.uuid,
				`Closed vote session for motion "${motion.title}"`);
			addEntry(motion.body_uuid, actingAs, 'vote_session_closed', 'vote_session', session.uuid,
				`Vote session closed for motion "${motion.title}"`);
		} catch (err) {
			return fail(400, { error: err instanceof Error ? err.message : 'Close failed' });
		}

		return { success: true };
	},

	finalize: async ({ params, locals }) => {
		if (!locals.session) error(401, 'Not authenticated');
		const actingAs = locals.session.acting_as_uuid;

		const session = getVoteSession(params.uuid);
		if (!session) error(404, 'Vote session not found');

		const motion = getMotionByUuid(session.motion_uuid);
		if (!motion) error(404, 'Motion not found');

		if (!hasPermission(actingAs, PERMISSIONS.VOTE_SESSIONS_FINALIZE, motion.body_uuid)) {
			return fail(403, { error: 'Insufficient permissions' });
		}

		try {
			finalizeVoteSession(session.uuid);
			audit(actingAs, 'vote_session.finalize', 'vote_session', session.uuid,
				`Finalized vote session for motion "${motion.title}"`);
			addEntry(motion.body_uuid, actingAs, 'vote_session_finalized', 'vote_session', session.uuid,
				`Vote session finalized for motion "${motion.title}" - outcome: ${session.outcome}`);
		} catch (err) {
			return fail(400, { error: err instanceof Error ? err.message : 'Finalize failed' });
		}

		return { success: true };
	},
};
