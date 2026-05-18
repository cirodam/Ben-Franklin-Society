import { error, fail } from '@sveltejs/kit';
import { randomUUID } from 'node:crypto';
import type { PageServerLoad, Actions } from './$types.js';
import {
	getMotionByUuid,
	advanceMotion,
	setMotionVoteRule,
	setMotionDeliberationRule,
	setMotionClerkNotes,
	setMotionParliamentarianNotes,
	getMotionComments,
	addMotionComment,
	editMotionComment,
	deleteMotionComment,
	isMotionCommentAuthor,
	type MotionStatus,
} from '$lib/server/governance/motions.js';
import { listVoteRules, getVoteRuleByUuid } from '$lib/server/governance/vote-rules.js';
import { listDeliberationRules, getDeliberationRuleByUuid } from '$lib/server/governance/deliberation-rules.js';
import { 
	getVoteSessionsForMotion,
	createVoteSession,
	openVoteSession,
	closeVoteSession,
	finalizeVoteSession,
	getSessionTally,
	hasVoted
} from '$lib/server/governance/vote-sessions.js';
import { hasPermission, PERMISSIONS } from '$lib/server/infrastructure/permissions.js';
import { addEntry } from '$lib/server/communications/record.js';
import { audit } from '$lib/server/documents/audit.js';
import { db } from '$lib/server/db.js';

export const load: PageServerLoad = async ({ params, locals }) => {
	const motion = getMotionByUuid(params.uuid);
	if (!motion) error(404, 'Motion not found');

	const introducer = db
		.prepare('SELECT given_name, family_name, handle FROM person WHERE uuid = ?')
		.get(motion.content.introducer_uuid) as { given_name: string; family_name: string; handle: string } | null;

	const body = db.prepare('SELECT name, handle, abbreviation FROM association WHERE uuid = ?').get(motion.owner_uuid) as { name: string; handle: string; abbreviation: string | null } | null;

	// Load vote sessions for this motion
	const voteSessions = getVoteSessionsForMotion(motion.uuid);
	const activeSession = voteSessions.find(s => s.status === 'open');
	const tally = activeSession ? getSessionTally(activeSession.uuid) : null;

	const voteRules = listVoteRules(motion.owner_uuid);
	const currentRule = motion.content.vote_rule_uuid ? getVoteRuleByUuid(motion.content.vote_rule_uuid) : null;
	
	const deliberationRules = listDeliberationRules(motion.owner_uuid);
	const currentDeliberationRule = motion.content.deliberation_rule_uuid ? getDeliberationRuleByUuid(motion.content.deliberation_rule_uuid) : null;

	const comments = getMotionComments(motion.uuid);

	let canAdvance = false;
	let canCreateVoteSession = false;
	let actingAs: string | null = null;

	let alreadyVoted = false;
	if (locals.session) {
		actingAs = locals.session.acting_as_uuid;
		// For now, allow anyone logged in to advance motions and manage vote sessions
		canAdvance = true;
		canCreateVoteSession = true;
		// Check if user has already voted in active session
		if (activeSession) {
			alreadyVoted = hasVoted(activeSession.uuid, actingAs);
		}
	}

	// Flatten motion for backward compatibility with page expectations
	const flatMotion = {
		...motion,
		...motion.content,
		// Keep content accessible for future use
		content: motion.content
	};

	return { 
		motion: flatMotion, 
		introducer, 
		body, 
		voteSessions,
		activeSession,
		tally, 
		voteRules, 
		currentRule, 
		deliberationRules,
		currentDeliberationRule,
		comments, 
		canAdvance,
		canCreateVoteSession,
		alreadyVoted,
		actingAs 
	};
};

export const actions: Actions = {
	advance: async ({ params, locals, request }) => {
		if (!locals.session) error(401, 'Not authenticated');
		const actingAs = locals.session.acting_as_uuid;

		const motion = getMotionByUuid(params.uuid);
		if (!motion) error(404, 'Motion not found');

		const data = await request.formData();
		const to = data.get('to') as string;
		const valid: MotionStatus[] = ['introduced', 'deliberation', 'withdrawn'];
		if (!valid.includes(to as MotionStatus)) {
			return fail(400, { error: 'Invalid target status' });
		}

		advanceMotion(motion.uuid, to as MotionStatus);

		const label = to === 'introduced' ? 'introduced'
			: to === 'deliberation' ? 'moved to deliberation and voting'
			: 'withdrawn';
		addEntry(motion.owner_uuid, actingAs, `motion_${to}`, 'motion', motion.uuid,
			`Motion "${motion.title}" ${label}`);
		audit(actingAs, `motion.${to}`, 'motion', motion.uuid, `Motion "${motion.title}" ${label}`);

		return { success: true };
	},

	// TODO: Restore voting via vote_sessions system
	// castVote action removed - voting now happens through vote_sessions

	setVoteRule: async ({ params, locals, request }) => {
		if (!locals.session) error(401, 'Not authenticated');
		const actingAs = locals.session.acting_as_uuid;

		const motion = getMotionByUuid(params.uuid);
		if (!motion) error(404, 'Motion not found');

		const data = await request.formData();
		const vote_rule_uuid = String(data.get('vote_rule_uuid') ?? '').trim() || null;

		try {
			setMotionVoteRule(motion.uuid, vote_rule_uuid);
		} catch (err) {
			return fail(400, { error: err instanceof Error ? err.message : 'Failed to set vote rule' });
		}

		if (vote_rule_uuid) {
			const rule = db.prepare('SELECT name FROM vote_rule WHERE uuid = ?').get(vote_rule_uuid) as { name: string } | undefined;
			addEntry(motion.owner_uuid, actingAs, 'vote_rule_set', 'motion', motion.uuid,
				`Vote rule "${rule?.name ?? vote_rule_uuid}" assigned to motion "${motion.title}"`);
			audit(actingAs, 'motion.set_vote_rule', 'motion', motion.uuid,
				`Vote rule "${rule?.name ?? vote_rule_uuid}" set on motion "${motion.title}"`);
		}

		return { success: true };
	},

	setDeliberationRule: async ({ params, locals, request }) => {
		if (!locals.session) error(401, 'Not authenticated');
		const actingAs = locals.session.acting_as_uuid;

		const motion = getMotionByUuid(params.uuid);
		if (!motion) error(404, 'Motion not found');

		const data = await request.formData();
		const deliberation_rule_uuid = String(data.get('deliberation_rule_uuid') ?? '').trim() || null;

		try {
			setMotionDeliberationRule(motion.uuid, deliberation_rule_uuid);
		} catch (err) {
			return fail(400, { error: err instanceof Error ? err.message : 'Failed to set deliberation rule' });
		}

		if (deliberation_rule_uuid) {
			const rule = db.prepare('SELECT name FROM deliberation_rule WHERE uuid = ?').get(deliberation_rule_uuid) as { name: string } | undefined;
			addEntry(motion.owner_uuid, actingAs, 'deliberation_rule_set', 'motion', motion.uuid,
				`Deliberation rule "${rule?.name ?? deliberation_rule_uuid}" assigned to motion "${motion.title}"`);
			audit(actingAs, 'motion.set_deliberation_rule', 'motion', motion.uuid,
				`Deliberation rule "${rule?.name ?? deliberation_rule_uuid}" set on motion "${motion.title}"`);
		}

		return { success: true };
	},

	setMotionRules: async ({ params, locals, request }) => {
		if (!locals.session) error(401, 'Not authenticated');
		const actingAs = locals.session.acting_as_uuid;

		const motion = getMotionByUuid(params.uuid);
		if (!motion) error(404, 'Motion not found');

		const data = await request.formData();
		const vote_rule_uuid = String(data.get('vote_rule_uuid') ?? '').trim() || null;
		const deliberation_rule_uuid = String(data.get('deliberation_rule_uuid') ?? '').trim() || null;

		try {
			setMotionVoteRule(motion.uuid, vote_rule_uuid);
			setMotionDeliberationRule(motion.uuid, deliberation_rule_uuid);
		} catch (err) {
			return fail(400, { error: err instanceof Error ? err.message : 'Failed to set rules' });
		}

		// Log changes
		if (vote_rule_uuid) {
			const rule = db.prepare('SELECT name FROM vote_rule WHERE uuid = ?').get(vote_rule_uuid) as { name: string } | undefined;
			addEntry(motion.owner_uuid, actingAs, 'vote_rule_set', 'motion', motion.uuid,
				`Vote rule "${rule?.name ?? vote_rule_uuid}" assigned to motion "${motion.title}"`);
			audit(actingAs, 'motion.set_vote_rule', 'motion', motion.uuid,
				`Vote rule "${rule?.name ?? vote_rule_uuid}" set on motion "${motion.title}"`);
		}
		if (deliberation_rule_uuid) {
			const rule = db.prepare('SELECT name FROM deliberation_rule WHERE uuid = ?').get(deliberation_rule_uuid) as { name: string } | undefined;
			addEntry(motion.owner_uuid, actingAs, 'deliberation_rule_set', 'motion', motion.uuid,
				`Deliberation rule "${rule?.name ?? deliberation_rule_uuid}" assigned to motion "${motion.title}"`);
			audit(actingAs, 'motion.set_deliberation_rule', 'motion', motion.uuid,
				`Deliberation rule "${rule?.name ?? deliberation_rule_uuid}" set on motion "${motion.title}"`);
		}

		return { success: true };
	},

	setClerkNotes: async ({ params, locals, request }) => {
		if (!locals.session) error(401, 'Not authenticated');
		const actingAs = locals.session.acting_as_uuid;

		const motion = getMotionByUuid(params.uuid);
		if (!motion) error(404, 'Motion not found');

		const data = await request.formData();
		const clerk_notes = String(data.get('clerk_notes') ?? '').trim() || null;

		try {
			setMotionClerkNotes(motion.uuid, clerk_notes);
		} catch (err) {
			return fail(400, { error: err instanceof Error ? err.message : 'Failed to set clerk notes' });
		}

		return { success: true };
	},

	setParliamentarianNotes: async ({ params, locals, request }) => {
		if (!locals.session) error(401, 'Not authenticated');
		const actingAs = locals.session.acting_as_uuid;

		const motion = getMotionByUuid(params.uuid);
		if (!motion) error(404, 'Motion not found');

		const data = await request.formData();
		const parliamentarian_notes = String(data.get('parliamentarian_notes') ?? '').trim() || null;

		try {
			setMotionParliamentarianNotes(motion.uuid, parliamentarian_notes);
		} catch (err) {
			return fail(400, { error: err instanceof Error ? err.message : 'Failed to set parliamentarian notes' });
		}

		return { success: true };
	},

	comment: async ({ params, locals, request }) => {
		if (!locals.session) return fail(401, { error: 'Not authenticated' });
		const actingAs = locals.session.acting_as_uuid;

		const motion = getMotionByUuid(params.uuid);
		if (!motion) error(404, 'Motion not found');

		const data = await request.formData();
		const body = String(data.get('body') ?? '').trim();
		if (!body) return fail(400, { error: 'Comment cannot be empty' });

		try {
			addMotionComment(motion.uuid, actingAs, body);
		} catch (err) {
			return fail(400, { error: err instanceof Error ? err.message : 'Failed to add comment' });
		}

		return { success: true };
	},

	editComment: async ({ params, locals, request }) => {
		if (!locals.session) return fail(401, { error: 'Not authenticated' });
		const actingAs = locals.session.acting_as_uuid;

		const data = await request.formData();
		const commentUuid = String(data.get('comment_uuid') ?? '').trim();
		const body = String(data.get('body') ?? '').trim();
		if (!commentUuid || !body) return fail(400, { error: 'Missing fields' });

		if (!isMotionCommentAuthor(commentUuid, actingAs)) {
			return fail(403, { error: 'Not your comment' });
		}

		try {
			editMotionComment(commentUuid, body);
		} catch (err) {
			return fail(400, { error: err instanceof Error ? err.message : 'Failed to edit comment' });
		}

		return { success: true };
	},

	deleteComment: async ({ params, locals, request }) => {
		if (!locals.session) return fail(401, { error: 'Not authenticated' });
		const actingAs = locals.session.acting_as_uuid;

		const data = await request.formData();
		const commentUuid = String(data.get('comment_uuid') ?? '').trim();
		if (!commentUuid) return fail(400, { error: 'Missing comment_uuid' });

		if (!isMotionCommentAuthor(commentUuid, actingAs)) {
			return fail(403, { error: 'Not your comment' });
		}

		try {
			deleteMotionComment(commentUuid);
		} catch (err) {
			return fail(400, { error: err instanceof Error ? err.message : 'Failed to delete comment' });
		}

		return { success: true };
	},

	createVoteSession: async ({ params, locals, request }) => {
		if (!locals.session) error(401, 'Not authenticated');
		const actingAs = locals.session.acting_as_uuid;

		const motion = getMotionByUuid(params.uuid);
		if (!motion) error(404, 'Motion not found');

		const data = await request.formData();
		const opens_at = String(data.get('opens_at') ?? '');
		const closes_at = String(data.get('closes_at') ?? '');
		const passing_threshold = Number(data.get('passing_threshold') ?? 50) / 100;
		const requires_quorum = data.get('requires_quorum') === 'on';
		const quorum_threshold = requires_quorum ? Number(data.get('quorum_threshold') ?? 50) / 100 : null;

		if (!opens_at || !closes_at) {
			return fail(400, { error: 'Opens at and closes at are required' });
		}

		// Validate dates
		const opensDate = new Date(opens_at);
		const closesDate = new Date(closes_at);
		if (closesDate <= opensDate) {
			return fail(400, { error: 'Close time must be after open time' });
		}

		try {
			const session = createVoteSession({
				motion_uuid: motion.uuid,
				opened_by: actingAs,
				passing_threshold,
				requires_quorum,
				quorum_threshold,
				opens_at,
				closes_at
			});
			audit(actingAs, 'vote_session.create', 'vote_session', session.uuid, `Created vote session for motion "${motion.title}"`);
			addEntry(motion.owner_uuid, actingAs, 'vote_session_created', 'motion', motion.uuid,
				`Vote session created for motion "${motion.title}"`);
		} catch (err) {
			return fail(400, { error: err instanceof Error ? err.message : 'Failed to create vote session' });
		}

		return { success: true };
	},

	openVoteSession: async ({ params, locals, request }) => {
		if (!locals.session) error(401, 'Not authenticated');
		const actingAs = locals.session.acting_as_uuid;

		const motion = getMotionByUuid(params.uuid);
		if (!motion) error(404, 'Motion not found');

		const data = await request.formData();
		const sessionUuid = String(data.get('session_uuid') ?? '');

		try {
			openVoteSession(sessionUuid);
			audit(actingAs, 'vote_session.open', 'vote_session', sessionUuid, `Opened vote session for motion "${motion.title}"`);
		} catch (err) {
			return fail(400, { error: err instanceof Error ? err.message : 'Failed to open session' });
		}

		return { success: true };
	},

	closeVoteSession: async ({ params, locals, request }) => {
		if (!locals.session) error(401, 'Not authenticated');
		const actingAs = locals.session.acting_as_uuid;

		const motion = getMotionByUuid(params.uuid);
		if (!motion) error(404, 'Motion not found');

		const data = await request.formData();
		const sessionUuid = String(data.get('session_uuid') ?? '');

		try {
			closeVoteSession(sessionUuid);
			audit(actingAs, 'vote_session.close', 'vote_session', sessionUuid, `Closed vote session for motion "${motion.title}"`);
		} catch (err) {
			return fail(400, { error: err instanceof Error ? err.message : 'Failed to close session' });
		}

		return { success: true };
	},

	finalizeVoteSession: async ({ params, locals, request }) => {
		if (!locals.session) error(401, 'Not authenticated');
		const actingAs = locals.session.acting_as_uuid;

		const motion = getMotionByUuid(params.uuid);
		if (!motion) error(404, 'Motion not found');

		const data = await request.formData();
		const sessionUuid = String(data.get('session_uuid') ?? '');

		try {
			finalizeVoteSession(sessionUuid);
			audit(actingAs, 'vote_session.finalize', 'vote_session', sessionUuid, `Finalized vote session for motion "${motion.title}"`);
			addEntry(motion.owner_uuid, actingAs, 'vote_session_finalized', 'motion', motion.uuid,
				`Vote session finalized for motion "${motion.title}"`);
		} catch (err) {
			return fail(400, { error: err instanceof Error ? err.message : 'Failed to finalize session' });
		}

		return { success: true };
	},
};
