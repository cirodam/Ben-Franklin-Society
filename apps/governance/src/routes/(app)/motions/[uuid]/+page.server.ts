import { error, fail } from '@sveltejs/kit';
import { randomUUID } from 'node:crypto';
import type { PageServerLoad, Actions } from './$types.js';
import {
	getMotionByUuid, getVoteTally,
	advanceMotion, closeVote, castVote, hasVoted, setMotionVoteRule, setMotionDeliberationRule, setMotionClerkNotes, setMotionParliamentarianNotes,
	getReadinessCount, hasMarkedReady, getReadinessSigners, markReady, unmarkReady,
	type MotionStatus, type VoteChoice,
} from '$lib/server/motions.js';
import { listVoteRules, getVoteRuleByUuid } from '$lib/server/vote_rules.js';
import { listDeliberationRules, getDeliberationRuleByUuid, isDeliberationPeriodComplete, getDaysRemainingInDeliberation } from '$lib/server/deliberation_rules.js';
import { hasPermission, PERMISSIONS } from '$lib/server/permissions.js';
import { addEntry } from '$lib/server/record.js';
import { audit } from '$lib/server/audit.js';
import { db } from '$lib/server/db.js';

export const load: PageServerLoad = async ({ params, locals }) => {
	const motion = getMotionByUuid(params.uuid);
	if (!motion) error(404, 'Motion not found');

	const introducer = db
		.prepare('SELECT given_name, family_name, handle FROM person WHERE uuid = ?')
		.get(motion.introduced_by_uuid) as { given_name: string; family_name: string; handle: string } | null;

	const body = db.prepare('SELECT name, handle, abbreviation FROM association WHERE uuid = ?').get(motion.body_uuid) as { name: string; handle: string; abbreviation: string | null } | null;

	const tally = getVoteTally(motion.uuid);
	const voteRules = listVoteRules(motion.body_uuid);
	const currentRule = motion.vote_rule_uuid ? getVoteRuleByUuid(motion.vote_rule_uuid) : null;
	
	const deliberationRules = listDeliberationRules(motion.body_uuid);
	const currentDeliberationRule = motion.deliberation_rule_uuid ? getDeliberationRuleByUuid(motion.deliberation_rule_uuid) : null;
	const deliberationComplete = isDeliberationPeriodComplete(motion.deliberation_opened_at, currentDeliberationRule);
	const daysRemainingInDeliberation = getDaysRemainingInDeliberation(motion.deliberation_opened_at, currentDeliberationRule);

	const comments = db.prepare(`
		SELECT mc.uuid, mc.body, mc.created_at, mc.edited_at, mc.author_uuid,
		       p.given_name, p.family_name, p.handle
		FROM motion_comment mc
		JOIN person p ON p.uuid = mc.author_uuid
		WHERE mc.motion_uuid = ? AND mc.deleted_at IS NULL
		ORDER BY mc.created_at ASC
	`).all(motion.uuid) as Array<{
		uuid: string;
		body: string;
		created_at: string;
		edited_at: string | null;
		author_uuid: string;
		given_name: string;
		family_name: string;
		handle: string;
	}>;

	let canAdvance = false;
	let canCloseVote = false;
	let alreadyVoted = false;
	let hasMarkedMotionReady = false;
	let actingAs: string | null = null;

	if (locals.session) {
		actingAs = locals.session.acting_as_uuid;
		const scope = motion.body_uuid;
		canAdvance   = hasPermission(actingAs, PERMISSIONS.MOTIONS_ADVANCE, scope);
		canCloseVote = hasPermission(actingAs, PERMISSIONS.VOTES_CLOSE,     scope);
		if (motion.status === 'deliberation') {
			alreadyVoted = hasVoted(motion.uuid, actingAs);
		}
		if (motion.status === 'introduced') {
			hasMarkedMotionReady = hasMarkedReady(motion.uuid, actingAs);
		}
	}

	const readinessCount = motion.status === 'introduced' ? getReadinessCount(motion.uuid) : 0;
	const readinessSigners = motion.status === 'introduced' ? getReadinessSigners(motion.uuid) : [];

	return { 
		motion, 
		introducer, 
		body, 
		tally, 
		voteRules, 
		currentRule, 
		deliberationRules,
		currentDeliberationRule,
		deliberationComplete,
		daysRemainingInDeliberation,
		comments, 
		canAdvance, 
		canCloseVote, 
		alreadyVoted,
		hasMarkedMotionReady,
		readinessCount,
		readinessSigners,
		actingAs 
	};
};

export const actions: Actions = {
	advance: async ({ params, locals, request }) => {
		if (!locals.session) error(401, 'Not authenticated');
		const actingAs = locals.session.acting_as_uuid;

		const motion = getMotionByUuid(params.uuid);
		if (!motion) error(404, 'Motion not found');

		if (!hasPermission(actingAs, PERMISSIONS.MOTIONS_ADVANCE, motion.body_uuid)) {
			return fail(403, { error: 'Insufficient permissions' });
		}

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
		addEntry(motion.body_uuid, actingAs, `motion_${to}`, 'motion', motion.uuid,
			`Motion "${motion.title}" ${label}`);
		audit(actingAs, `motion.${to}`, 'motion', motion.uuid, `Motion "${motion.title}" ${label}`);

		return { success: true };
	},

	closeVote: async ({ params, locals }) => {
		if (!locals.session) error(401, 'Not authenticated');
		const actingAs = locals.session.acting_as_uuid;

		const motion = getMotionByUuid(params.uuid);
		if (!motion) error(404, 'Motion not found');

		if (!hasPermission(actingAs, PERMISSIONS.VOTES_CLOSE, motion.body_uuid)) {
			return fail(403, { error: 'Insufficient permissions' });
		}

		// Check if deliberation period is complete
		const delibRule = motion.deliberation_rule_uuid ? getDeliberationRuleByUuid(motion.deliberation_rule_uuid) : null;
		if (motion.deliberation_opened_at && !isDeliberationPeriodComplete(motion.deliberation_opened_at, delibRule)) {
			const daysRemaining = getDaysRemainingInDeliberation(motion.deliberation_opened_at, delibRule);
			return fail(400, { error: `Cannot close vote yet. Deliberation period requires ${daysRemaining} more day(s).` });
		}

		const outcome = closeVote(motion.uuid);

		addEntry(motion.body_uuid, actingAs, `motion_${outcome}`, 'motion', motion.uuid,
			`Motion "${motion.title}" ${outcome} by vote`);
		audit(actingAs, `vote.close.${outcome}`, 'motion', motion.uuid,
			`Motion "${motion.title}" ${outcome} by vote`);

		return { outcome };
	},

	castVote: async ({ params, locals, request }) => {
		if (!locals.session) error(401, 'Not authenticated');
		const actingAs = locals.session.acting_as_uuid;

		const motion = getMotionByUuid(params.uuid);
		if (!motion) error(404, 'Motion not found');

		const data = await request.formData();
		const choice = data.get('choice') as string;
		const validChoices: VoteChoice[] = ['aye', 'nay', 'abstain'];
		if (!validChoices.includes(choice as VoteChoice)) {
			return fail(400, { error: 'Invalid vote choice' });
		}

		try {
			castVote(motion.uuid, actingAs, choice as VoteChoice);
		} catch (err) {
			return fail(400, { error: err instanceof Error ? err.message : 'Vote failed' });
		}

		return { success: true };
	},

	setVoteRule: async ({ params, locals, request }) => {
		if (!locals.session) error(401, 'Not authenticated');
		const actingAs = locals.session.acting_as_uuid;

		const motion = getMotionByUuid(params.uuid);
		if (!motion) error(404, 'Motion not found');

		if (!hasPermission(actingAs, PERMISSIONS.MOTIONS_ADVANCE, motion.body_uuid)) {
			return fail(403, { error: 'Insufficient permissions' });
		}

		const data = await request.formData();
		const vote_rule_uuid = String(data.get('vote_rule_uuid') ?? '').trim() || null;

		try {
			setMotionVoteRule(motion.uuid, vote_rule_uuid);
		} catch (err) {
			return fail(400, { error: err instanceof Error ? err.message : 'Failed to set vote rule' });
		}

		if (vote_rule_uuid) {
			const rule = db.prepare('SELECT name FROM vote_rule WHERE uuid = ?').get(vote_rule_uuid) as { name: string } | undefined;
			addEntry(motion.body_uuid, actingAs, 'vote_rule_set', 'motion', motion.uuid,
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

		if (!hasPermission(actingAs, PERMISSIONS.MOTIONS_ADVANCE, motion.body_uuid)) {
			return fail(403, { error: 'Insufficient permissions' });
		}

		const data = await request.formData();
		const deliberation_rule_uuid = String(data.get('deliberation_rule_uuid') ?? '').trim() || null;

		try {
			setMotionDeliberationRule(motion.uuid, deliberation_rule_uuid);
		} catch (err) {
			return fail(400, { error: err instanceof Error ? err.message : 'Failed to set deliberation rule' });
		}

		if (deliberation_rule_uuid) {
			const rule = db.prepare('SELECT name FROM deliberation_rule WHERE uuid = ?').get(deliberation_rule_uuid) as { name: string } | undefined;
			addEntry(motion.body_uuid, actingAs, 'deliberation_rule_set', 'motion', motion.uuid,
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

		if (!hasPermission(actingAs, PERMISSIONS.MOTIONS_ADVANCE, motion.body_uuid)) {
			return fail(403, { error: 'Insufficient permissions' });
		}

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
			addEntry(motion.body_uuid, actingAs, 'vote_rule_set', 'motion', motion.uuid,
				`Vote rule "${rule?.name ?? vote_rule_uuid}" assigned to motion "${motion.title}"`);
			audit(actingAs, 'motion.set_vote_rule', 'motion', motion.uuid,
				`Vote rule "${rule?.name ?? vote_rule_uuid}" set on motion "${motion.title}"`);
		}
		if (deliberation_rule_uuid) {
			const rule = db.prepare('SELECT name FROM deliberation_rule WHERE uuid = ?').get(deliberation_rule_uuid) as { name: string } | undefined;
			addEntry(motion.body_uuid, actingAs, 'deliberation_rule_set', 'motion', motion.uuid,
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

		if (!hasPermission(actingAs, PERMISSIONS.MOTIONS_ADVANCE, motion.body_uuid)) {
			return fail(403, { error: 'Insufficient permissions' });
		}

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

		if (!hasPermission(actingAs, PERMISSIONS.MOTIONS_ADVANCE, motion.body_uuid)) {
			return fail(403, { error: 'Insufficient permissions' });
		}

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

		db.prepare(
			`INSERT INTO motion_comment (uuid, motion_uuid, author_uuid, body, created_at)
			 VALUES (?, ?, ?, ?, ?)`
		).run(randomUUID(), motion.uuid, actingAs, body, new Date().toISOString());

		return { success: true };
	},

	editComment: async ({ params, locals, request }) => {
		if (!locals.session) return fail(401, { error: 'Not authenticated' });
		const actingAs = locals.session.acting_as_uuid;

		const data = await request.formData();
		const commentUuid = String(data.get('comment_uuid') ?? '').trim();
		const body = String(data.get('body') ?? '').trim();
		if (!commentUuid || !body) return fail(400, { error: 'Missing fields' });

		const comment = db.prepare('SELECT * FROM motion_comment WHERE uuid = ? AND deleted_at IS NULL').get(commentUuid) as { author_uuid: string } | undefined;
		if (!comment) return fail(404, { error: 'Comment not found' });
		if (comment.author_uuid !== actingAs) return fail(403, { error: 'Not your comment' });

		db.prepare('UPDATE motion_comment SET body = ?, edited_at = ? WHERE uuid = ?')
			.run(body, new Date().toISOString(), commentUuid);

		return { success: true };
	},

	deleteComment: async ({ params, locals, request }) => {
		if (!locals.session) return fail(401, { error: 'Not authenticated' });
		const actingAs = locals.session.acting_as_uuid;

		const data = await request.formData();
		const commentUuid = String(data.get('comment_uuid') ?? '').trim();
		if (!commentUuid) return fail(400, { error: 'Missing comment_uuid' });

		const comment = db.prepare('SELECT * FROM motion_comment WHERE uuid = ? AND deleted_at IS NULL').get(commentUuid) as { author_uuid: string } | undefined;
		if (!comment) return fail(404, { error: 'Comment not found' });
		if (comment.author_uuid !== actingAs) return fail(403, { error: 'Not your comment' });

		db.prepare('UPDATE motion_comment SET deleted_at = ? WHERE uuid = ?')
			.run(new Date().toISOString(), commentUuid);

		return { success: true };
	},

	markReady: async ({ params, locals }) => {
		if (!locals.session) error(401, 'Not authenticated');
		const actingAs = locals.session.acting_as_uuid;

		const motion = getMotionByUuid(params.uuid);
		if (!motion) error(404, 'Motion not found');

		if (motion.status !== 'introduced') {
			return fail(400, { error: 'Motion must be in introduced status to mark ready' });
		}

		// Check if user is a member of the association
		const membership = db.prepare(
			'SELECT 1 FROM association_member WHERE association_uuid = ? AND person_uuid = ? AND removed_at IS NULL'
		).get(motion.body_uuid, actingAs);

		if (!membership) {
			return fail(403, { error: 'Only association members can mark motions ready' });
		}

		try {
			markReady(motion.uuid, actingAs);
		} catch (err) {
			return fail(400, { error: err instanceof Error ? err.message : 'Failed to mark ready' });
		}

		return { success: true };
	},

	unmarkReady: async ({ params, locals }) => {
		if (!locals.session) error(401, 'Not authenticated');
		const actingAs = locals.session.acting_as_uuid;

		const motion = getMotionByUuid(params.uuid);
		if (!motion) error(404, 'Motion not found');

		try {
			unmarkReady(motion.uuid, actingAs);
		} catch (err) {
			return fail(400, { error: err instanceof Error ? err.message : 'Failed to unmark ready' });
		}

		return { success: true };
	},
};
