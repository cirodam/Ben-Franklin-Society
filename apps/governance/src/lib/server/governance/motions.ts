import { randomUUID } from 'node:crypto';
import { db } from '../db.js';
import { getVoteRuleByUuid, evaluateTally } from './vote-rules.js';
import * as library from '../documents/library.js';
import * as discussions from '../communications/discussions.js';

// --- Types ---

export type MotionStatus =
	| 'draft'
	| 'introduced'
	| 'deliberation' // Combined deliberation and voting phase
	| 'enacted'
	| 'rejected'
	| 'withdrawn';

export type VoteChoice = 'aye' | 'nay' | 'abstain';

export interface Motion {
	uuid: string;
	slug: string;
	motion_number: number;
	title: string;
	owner_uuid: string; // the association that owns this (typically same as body_uuid)
	body: string;
	reasoning: string | null;
	introduced_by_uuid: string;
	body_uuid: string; // every motion belongs to a body; use the community association for society-wide motions
	deliberation_rule_uuid: string | null;
	vote_rule_uuid: string | null;
	status: MotionStatus;
	clerk_notes: string | null;
	parliamentarian_notes: string | null;
	thread_uuid: string | null;
	created_at: string;
	introduced_at: string | null;
	enacted_at: string | null;
	resolved_at: string | null;
	adopted_by_motion_uuid: string | null; // reference to motion that adopted/amended this
	repealed_by_motion_uuid: string | null;
}

export interface VoteTally {
	motion_uuid: string;
	eligible_count: number;
	aye_count: number;
	nay_count: number;
	abstain_count: number;
	opened_at: string;
	closed_at: string | null;
}

export interface MotionComment {
	uuid: string;
	motion_uuid: string;
	author_uuid: string;
	body: string;
	created_at: string;
	edited_at: string | null;
	deleted_at: string | null;
}

// --- Helpers ---

function now(): string {
	return new Date().toISOString();
}

const ALLOWED_TRANSITIONS: Partial<Record<MotionStatus, MotionStatus[]>> = {
	draft: ['introduced', 'withdrawn'],
	introduced: ['deliberation', 'withdrawn'],
	deliberation: ['withdrawn'], // deliberation → enacted/rejected goes through closeVote()
};

// --- Motion queries ---

export function getMotionByUuid(uuid: string): Motion | null {
	return library.getMotionByUuid(uuid);
}

export function getMotionBySlug(slug: string): Motion | null {
	return library.getMotionBySlug(slug);
}

export function listMotions(opts: {
	bodyUuid?: string;
	status?: MotionStatus;
} = {}): Motion[] {
	return library.listMotions({
		owner_uuid: opts.bodyUuid,
		status: opts.status,
	});
}

export function listEnactedMotions(): (Motion & { body_name: string; body_abbreviation: string | null })[] {
	return db.prepare(
		`SELECT m.*, a.name AS body_name, a.abbreviation AS body_abbreviation
		 FROM motion m
		 JOIN association a ON a.uuid = m.body_uuid
		 WHERE m.status = 'enacted'
		 ORDER BY m.enacted_at DESC`
	).all() as (Motion & { body_name: string; body_abbreviation: string | null })[];
}

// --- Motion writes ---

export function createMotion(input: {
	title: string;
	body: string;
	reasoning?: string | null;
	introduced_by_uuid: string;
	body_uuid: string;
	deliberation_rule_uuid?: string | null;
	type?: string;
	seniority?: number | null;
	slug?: string;
}): Motion {
	const uuid = randomUUID();
	
	// Get next motion number for this body
	// Check both database (old) and library (new) for highest number
	const dbResult = db.prepare(
		'SELECT COALESCE(MAX(motion_number), 0) AS max_number FROM motion WHERE body_uuid = ?'
	).get(input.body_uuid) as { max_number: number };
	
	const libraryMotions = library.listMotions({ owner_uuid: input.body_uuid });
	const libraryMaxNumber = libraryMotions.reduce((max, m) => Math.max(max, m.motion_number), 0);
	
	const motionNumber = Math.max(dbResult.max_number, libraryMaxNumber) + 1;
	
	// Generate slug if not provided
	const slug = input.slug ?? `motion-${uuid.substring(0, 8)}`;
	const year = new Date().getFullYear();
	const paddedNumber = motionNumber.toString().padStart(3, '0');
	const motionNumberStr = `M-${year}-${paddedNumber}`;
	
	// Create discussion thread for this motion
	const thread = discussions.createThread();
	
	const motion = library.createMotion({
		slug,
		title: input.title,
		body: input.body,
		reasoning: input.reasoning ?? undefined,
		introducer_uuid: input.introduced_by_uuid,
		owner_uuid: input.body_uuid,
		motion_number: motionNumberStr,
		deliberation_rule_uuid: input.deliberation_rule_uuid ?? undefined,
		thread_uuid: thread.uuid,
	});
	
	// Set status to introduced (library creates as draft)
	return library.updateMotionStatus(slug, 'introduced', {
		introduced_at: now(),
	});
}

export function advanceMotion(uuid: string, to: MotionStatus): Motion {
	const motion = getMotionByUuid(uuid);
	if (!motion) throw new Error(`Motion not found: ${uuid}`);

	const allowed = ALLOWED_TRANSITIONS[motion.status] ?? [];
	if (!allowed.includes(to)) {
		throw new Error(`Cannot transition motion from '${motion.status}' to '${to}'`);
	}

	const resolvedAt = (to === 'withdrawn') ? now() : null;
	const introducedAt = (to === 'introduced' && !motion.introduced_at) ? now() : null;
	
	// Note: Voting now happens during meetings, not automatically when advancing to deliberation
	if (to === 'deliberation') {
		// Check if vote rule is set
		if (!motion.vote_rule_uuid) {
			throw new Error('A vote rule must be assigned before deliberation can begin');
		}
	}
	
	// Update motion status in library
	return library.updateMotionStatus(motion.slug, to, {
		introduced_at: introducedAt || undefined,
		vote_closed_at: resolvedAt || undefined,
	});
}

export function setMotionVoteRule(motionUuid: string, voteRuleUuid: string | null): Motion {
	const motion = getMotionByUuid(motionUuid);
	if (!motion) throw new Error(`Motion not found: ${motionUuid}`);
	if (motion.status === 'deliberation' || motion.status === 'enacted' || motion.status === 'rejected' || motion.status === 'withdrawn') {
		throw new Error(`Cannot change vote rule on a motion in status '${motion.status}'`);
	}
	return library.updateMotion(motion.slug, { vote_rule_uuid: voteRuleUuid ?? undefined });
}

export function setMotionDeliberationRule(motionUuid: string, deliberationRuleUuid: string | null): Motion {
	const motion = getMotionByUuid(motionUuid);
	if (!motion) throw new Error(`Motion not found: ${motionUuid}`);
	if (motion.status === 'deliberation' || motion.status === 'enacted' || motion.status === 'rejected' || motion.status === 'withdrawn') {
		throw new Error(`Cannot change deliberation rule on a motion in status '${motion.status}'`);
	}
	return library.updateMotion(motion.slug, { deliberation_rule_uuid: deliberationRuleUuid ?? undefined });
}

export function setMotionClerkNotes(motionUuid: string, clerkNotes: string | null): Motion {
	const motion = getMotionByUuid(motionUuid);
	if (!motion) throw new Error(`Motion not found: ${motionUuid}`);
	return library.updateMotion(motion.slug, { clerk_notes: clerkNotes ?? undefined });
}

export function setMotionParliamentarianNotes(motionUuid: string, parliamentarianNotes: string | null): Motion {
	const motion = getMotionByUuid(motionUuid);
	if (!motion) throw new Error(`Motion not found: ${motionUuid}`);
	return library.updateMotion(motion.slug, { parliamentarian_notes: parliamentarianNotes ?? undefined });
}

// --- Vote Tallies ---
// Note: Voting is now handled by the vote_sessions system (see vote_sessions.ts).
// This function remains for backward compatibility and simple tally queries.

export function getVoteTally(motionUuid: string): VoteTally | null {
	return (
		(db
			.prepare('SELECT * FROM motion_vote_tally WHERE motion_uuid = ?')
			.get(motionUuid) as VoteTally | undefined) ?? null
	);
}

// --- Motion Enactment ---
// These functions are called by the vote_sessions system when a vote is finalized.

/**
 * Enact a motion based on a passed vote session
 * Called by vote_sessions system when outcome is 'passed'
 */
export function enactMotion(motionUuid: string, voteSessionUuid: string): Motion {
	const motion = getMotionByUuid(motionUuid);
	if (!motion) throw new Error(`Motion not found: ${motionUuid}`);
	
	if (motion.status === 'enacted') {
		// Already enacted, no-op
		return motion;
	}
	
	const enacted_at = now();
	
	return library.updateMotion(motion.slug, {
		status: 'enacted',
		enacted_at
	});
}

/**
 * Reject a motion based on a failed vote session
 * Called by vote_sessions system when outcome is 'failed'
 */
export function rejectMotion(motionUuid: string, voteSessionUuid: string): Motion {
	const motion = getMotionByUuid(motionUuid);
	if (!motion) throw new Error(`Motion not found: ${motionUuid}`);
	
	if (motion.status === 'rejected') {
		// Already rejected, no-op
		return motion;
	}
	
	const vote_closed_at = now();
	
	return library.updateMotion(motion.slug, {
		status: 'rejected',
		vote_closed_at
	});
}

// --- Comments ---

/**
 * Add a comment to a motion's discussion thread
 */
export function addMotionComment(
	motionUuid: string,
	authorUuid: string,
	body: string,
	parentCommentUuid?: string
) {
	const motion = getMotionByUuid(motionUuid);
	if (!motion) throw new Error('Motion not found');
	if (!motion.thread_uuid) throw new Error('Motion has no discussion thread');
	
	return discussions.addComment({
		thread_uuid: motion.thread_uuid,
		author_uuid: authorUuid,
		body,
		parent_comment_uuid: parentCommentUuid
	});
}

/**
 * Edit a comment
 */
export function editMotionComment(commentUuid: string, body: string): void {
	discussions.editComment(commentUuid, body);
}

/**
 * Delete a comment
 */
export function deleteMotionComment(commentUuid: string): void {
	discussions.deleteComment(commentUuid);
}

/**
 * Get all comments for a motion
 */
export function getMotionComments(motionUuid: string) {
	const motion = getMotionByUuid(motionUuid);
	if (!motion?.thread_uuid) return [];
	
	return discussions.getCommentsWithAuthors(motion.thread_uuid);
}

/**
 * Check if person is author of a comment
 */
export function isMotionCommentAuthor(commentUuid: string, personUuid: string): boolean {
	return discussions.isCommentAuthor(commentUuid, personUuid);
}

// --- Legacy comment functions (deprecated, for backward compatibility) ---

export function addComment(motionUuid: string, authorUuid: string, body: string) {
	return addMotionComment(motionUuid, authorUuid, body);
}

export function editComment(commentUuid: string, body: string): void {
	editMotionComment(commentUuid, body);
}

export function deleteComment(commentUuid: string): void {
	deleteMotionComment(commentUuid);
}

export function getComments(motionUuid: string) {
	return getMotionComments(motionUuid);
}

// --- Motion as Document ---

