import { error, fail, redirect } from '@sveltejs/kit';
import { randomUUID } from 'node:crypto';
import type { PageServerLoad, Actions } from './$types.js';
import {
	getMotionByUuid,
	getMotionBySlug,
	advanceMotion,
	setMotionStatus,
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
} from '$lib/server/governance/motion/index.js';
import { listVoteRules, getVoteRuleByUuid } from '$lib/server/governance/vote-rules.js';
import { listDeliberationRules, getDeliberationRuleByUuid } from '$lib/server/governance/deliberation-rules.js';
import { 
	getVoteSessionsForMotion,
	createVoteSession,
	openVoteSession,
	closeVoteSession,
	finalizeVoteSession,
	getSessionTally,
	hasVoted,
	canVote,
	castVote,
	type VoteChoice
} from '$lib/server/governance/vote-sessions.js';
import { hasPermission, PERMISSIONS } from '$lib/server/infrastructure/permissions.js';
import { addEntry } from '$lib/server/communications/record.js';
import { audit } from '$lib/server/documents/audit.js';
import { db } from '$lib/server/db.js';
import { 
	getAllBodySlugs, 
	getMotionFolder, 
	MOTION_STATUSES,
	moveMotion
} from '$lib/server/documents/society-core.js';
import { existsSync } from 'node:fs';
import { join } from 'node:path';

export const load: PageServerLoad = async ({ params, locals }) => {
	// Try to load by UUID first, then by slug
	let motion = getMotionByUuid(params.uuid);
	let loadedByUuid = false;
	
	if (motion) {
		loadedByUuid = true;
	} else {
		motion = getMotionBySlug(params.uuid);
	}
	
	if (!motion) error(404, 'Motion not found');
	
	// If loaded by UUID, redirect to slug-based URL
	if (loadedByUuid && motion.slug !== params.uuid) {
		throw redirect(302, `/governance/motions/${motion.slug}`);
	}

	const introducer = db
		.prepare('SELECT given_name, family_name, handle FROM person WHERE uuid = ?')
		.get(motion.content.introducer_uuid) as { given_name: string; family_name: string; handle: string } | null;

	const body = db.prepare('SELECT uuid, name, handle, abbreviation, type FROM association WHERE uuid = ?').get(motion.owner_uuid) as { uuid: string; name: string; handle: string; abbreviation: string | null; type: string } | null;

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
	let personUuid: string | null = null;

	let alreadyVoted = false;
	let userCanVote = false;
	if (locals.session) {
		actingAs = locals.session.acting_as_uuid;
		personUuid = locals.session.person_uuid;
		// For now, allow anyone logged in to advance motions and manage vote sessions
		canAdvance = true;
		canCreateVoteSession = true;
		// Check if user has already voted in active session
		// Use person_uuid for voting, not acting_as_uuid (people vote, not associations)
		if (activeSession && personUuid) {
			alreadyVoted = hasVoted(activeSession.uuid, personUuid);
			userCanVote = canVote(activeSession.uuid, personUuid);
		}
	}

	// Determine current folder location (status and bodySlug)
	let currentStatus: typeof MOTION_STATUSES[number] = 'inbox';
	let bodySlugForMove: string | null = null;
	const bodies = getAllBodySlugs();
	for (const bodySlug of bodies) {
		for (const status of MOTION_STATUSES) {
			const filePath = join(getMotionFolder(bodySlug, status), `${motion.slug}.json`);
			if (existsSync(filePath)) {
				currentStatus = status;
				bodySlugForMove = bodySlug;
				break;
			}
		}
		if (bodySlugForMove) break;
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
		userCanVote,
		actingAs,
		currentStatus,
		bodySlugForMove
	};
};

export const actions: Actions = {
	advance: async ({ params, locals, request }) => {
		if (!locals.session) error(401, 'Not authenticated');
		const actingAs = locals.session.acting_as_uuid;

		// Try UUID first, then slug
		let motion = getMotionByUuid(params.uuid);
		if (!motion) motion = getMotionBySlug(params.uuid);
		if (!motion) error(404, 'Motion not found');

		const data = await request.formData();
		const to = data.get('to') as string;
		const valid: MotionStatus[] = ['introduced', 'deliberation', 'voting', 'enacted', 'withdrawn'];
		if (!valid.includes(to as MotionStatus)) {
			return fail(400, { error: 'Invalid target status' });
		}

		// Motions cannot be advanced to 'introduced' without a body_uuid
		// (they must be introduced through the proper body's introduction flow)
		if (to === 'introduced' && !motion.content.body_uuid) {
			return fail(400, { 
				error: 'Motion must be introduced through a governing body (General Assembly, Committee, etc.) to set the body association' 
			});
		}

		// For record entry, use the motion's body_uuid if set
		if (!motion.content.body_uuid) {
			return fail(400, { 
				error: 'Motion must have a body_uuid set before status can be changed' 
			});
		}

		advanceMotion(motion.slug, to as MotionStatus);

		const label = to === 'introduced' ? 'introduced'
			: to === 'deliberation' ? 'moved to deliberation'
			: to === 'voting' ? 'moved to voting'
			: to === 'enacted' ? 'enacted'
			: 'withdrawn';
		
		// Use the motion's body_uuid for the record entry
		addEntry(motion.content.body_uuid, actingAs, `motion_${to}`, 'motion', motion.uuid,
			`Motion "${motion.title}" ${label}`);
		audit(actingAs, `motion.${to}`, 'motion', motion.uuid, `Motion "${motion.title}" ${label}`);

		return { success: true };
	},

	vote: async ({ params, locals, request }) => {
		if (!locals.session) error(401, 'Not authenticated');
		const actingAs = locals.session.acting_as_uuid;
		const personUuid = locals.session.person_uuid;

		// Try UUID first, then slug
		let motion = getMotionByUuid(params.uuid);
		if (!motion) motion = getMotionBySlug(params.uuid);
		if (!motion) error(404, 'Motion not found');

		const data = await request.formData();
		const sessionUuid = String(data.get('session_uuid') ?? '');
		const choice = data.get('choice') as string;
		const validChoices: VoteChoice[] = ['aye', 'nay', 'abstain'];
		
		if (!validChoices.includes(choice as VoteChoice)) {
			return fail(400, { error: 'Invalid vote choice' });
		}

		try {
			// Use person_uuid for voting (people vote, not associations)
			castVote(sessionUuid, personUuid, choice as VoteChoice);
			audit(actingAs, 'vote_session.vote', 'vote_session', sessionUuid, 
				`Voted on session for motion "${motion.title}"`);
		} catch (err) {
			return fail(400, { error: err instanceof Error ? err.message : 'Vote failed' });
		}

		return { success: true };
	},

	setVoteRule: async ({ params, locals, request }) => {
		if (!locals.session) error(401, 'Not authenticated');
		const actingAs = locals.session.acting_as_uuid;

		// Try UUID first, then slug
		let motion = getMotionByUuid(params.uuid);
		if (!motion) motion = getMotionBySlug(params.uuid);
		if (!motion) error(404, 'Motion not found');

		const data = await request.formData();
		const vote_rule_uuid = String(data.get('vote_rule_uuid') ?? '').trim() || null;

		try {
			setMotionVoteRule(motion.slug, vote_rule_uuid);
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

		// Try UUID first, then slug
		let motion = getMotionByUuid(params.uuid);
		if (!motion) motion = getMotionBySlug(params.uuid);
		if (!motion) error(404, 'Motion not found');

		const data = await request.formData();
		const deliberation_rule_uuid = String(data.get('deliberation_rule_uuid') ?? '').trim() || null;

		try {
			setMotionDeliberationRule(motion.slug, deliberation_rule_uuid);
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

		// Try UUID first, then slug
		let motion = getMotionByUuid(params.uuid);
		if (!motion) motion = getMotionBySlug(params.uuid);
		if (!motion) error(404, 'Motion not found');

		const data = await request.formData();
		const vote_rule_uuid = String(data.get('vote_rule_uuid') ?? '').trim() || null;
		const deliberation_rule_uuid = String(data.get('deliberation_rule_uuid') ?? '').trim() || null;

		try {
			setMotionVoteRule(motion.slug, vote_rule_uuid);
			setMotionDeliberationRule(motion.slug, deliberation_rule_uuid);
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

		// Try UUID first, then slug
		let motion = getMotionByUuid(params.uuid);
		if (!motion) motion = getMotionBySlug(params.uuid);
		if (!motion) error(404, 'Motion not found');

		const data = await request.formData();
		const clerk_notes = String(data.get('clerk_notes') ?? '').trim() || null;

		try {
			setMotionClerkNotes(motion.slug, clerk_notes);
		} catch (err) {
			return fail(400, { error: err instanceof Error ? err.message : 'Failed to set clerk notes' });
		}

		return { success: true };
	},

	setParliamentarianNotes: async ({ params, locals, request }) => {
		if (!locals.session) error(401, 'Not authenticated');
		const actingAs = locals.session.acting_as_uuid;

		// Try UUID first, then slug
		let motion = getMotionByUuid(params.uuid);
		if (!motion) motion = getMotionBySlug(params.uuid);
		if (!motion) error(404, 'Motion not found');

		const data = await request.formData();
		const parliamentarian_notes = String(data.get('parliamentarian_notes') ?? '').trim() || null;

		try {
			setMotionParliamentarianNotes(motion.slug, parliamentarian_notes);
		} catch (err) {
			return fail(400, { error: err instanceof Error ? err.message : 'Failed to set parliamentarian notes' });
		}

		return { success: true };
	},

	comment: async ({ params, locals, request }) => {
		if (!locals.session) return fail(401, { error: 'Not authenticated' });
		const actingAs = locals.session.acting_as_uuid;

		// Try UUID first, then slug
		let motion = getMotionByUuid(params.uuid);
		if (!motion) motion = getMotionBySlug(params.uuid);
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

		// Try UUID first, then slug
		let motion = getMotionByUuid(params.uuid);
		if (!motion) motion = getMotionBySlug(params.uuid);
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

		// Try UUID first, then slug
		let motion = getMotionByUuid(params.uuid);
		if (!motion) motion = getMotionBySlug(params.uuid);
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

		// Try UUID first, then slug
		let motion = getMotionByUuid(params.uuid);
		if (!motion) motion = getMotionBySlug(params.uuid);
		if (!motion) error(404, 'Motion not found');

		const data = await request.formData();
		const sessionUuid = String(data.get('session_uuid') ?? '');

		try {
			closeVoteSession(sessionUuid);
			audit(actingAs, 'vote_session.close', 'vote_session', sessionUuid, `Closed vote session for motion "${motion.title}"`);
			
			// Automatically finalize the session to count votes and determine outcome
			finalizeVoteSession(sessionUuid);
			audit(actingAs, 'vote_session.finalize', 'vote_session', sessionUuid, `Finalized vote session for motion "${motion.title}"`);
			addEntry(motion.owner_uuid, actingAs, 'vote_session_finalized', 'motion', motion.uuid,
				`Vote session finalized for motion "${motion.title}"`);
		} catch (err) {
			return fail(400, { error: err instanceof Error ? err.message : 'Failed to close session' });
		}

		return { success: true };
	},

	finalizeVoteSession: async ({ params, locals, request }) => {
		if (!locals.session) error(401, 'Not authenticated');
		const actingAs = locals.session.acting_as_uuid;

		// Try UUID first, then slug
		let motion = getMotionByUuid(params.uuid);
		if (!motion) motion = getMotionBySlug(params.uuid);
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

	changeStatus: async ({ params, locals, request }) => {
		if (!locals.session) error(401, 'Not authenticated');
		const actingAs = locals.session.acting_as_uuid;

		const motion = getMotionByUuid(params.uuid);
		if (!motion) error(404, 'Motion not found');

		const data = await request.formData();
		const new_status = data.get('new_status') as MotionStatus;
		
		const validStatuses: MotionStatus[] = ['draft', 'introduced', 'deliberation', 'adopted', 'enacted', 'rejected', 'withdrawn'];
		if (!validStatuses.includes(new_status)) {
			return fail(400, { error: 'Invalid status' });
		}

		try {
			setMotionStatus(motion.uuid, new_status);
			audit(actingAs, 'motion.change_status', 'motion', motion.uuid, 
				`Manually changed motion "${motion.title}" status from ${motion.content.status} to ${new_status}`);
			addEntry(motion.owner_uuid, actingAs, 'motion_status_changed', 'motion', motion.uuid,
				`Motion "${motion.title}" status manually changed to ${new_status}`);
		} catch (err) {
			return fail(400, { error: err instanceof Error ? err.message : 'Failed to change status' });
		}

		return { success: true };
	},

	moveDocument: async ({ params, request, locals }) => {
		if (!locals.session) {
			return fail(401, { error: 'Authentication required' });
		}

		const data = await request.formData();
		const toStatus = data.get('toStatus') as string;
		const bodySlug = data.get('bodySlug') as string;

		if (!toStatus) {
			return fail(400, { error: 'Target status is required' });
		}

		if (!bodySlug) {
			return fail(400, { error: 'Body slug is required' });
		}

		try {
			// Try to load motion
			let motion = getMotionByUuid(params.uuid);
			if (!motion) motion = getMotionBySlug(params.uuid);
			if (!motion) error(404, 'Motion not found');

			// Find current status
			let fromStatus: typeof MOTION_STATUSES[number] | null = null;
			for (const status of MOTION_STATUSES) {
				const filePath = join(getMotionFolder(bodySlug, status), `${motion.slug}.json`);
				if (existsSync(filePath)) {
					fromStatus = status;
					break;
				}
			}

			if (!fromStatus) {
				return fail(404, { error: 'Motion file not found' });
			}

			if (!MOTION_STATUSES.includes(toStatus as any)) {
				return fail(400, { error: 'Invalid target status' });
			}

			const success = moveMotion(
				motion.slug,
				bodySlug,
				fromStatus,
				toStatus as typeof MOTION_STATUSES[number]
			);

			if (!success) {
				return fail(500, { error: 'Failed to move motion' });
			}

			const actingAs = locals.session.acting_as_uuid;
			audit(actingAs, 'motion.move', 'motion', motion.uuid, 
				`Moved motion "${motion.title}" from ${fromStatus} to ${toStatus}`);

			return { success: true };
		} catch (err) {
			return fail(500, { error: err instanceof Error ? err.message : 'Failed to move motion' });
		}
	},
};
