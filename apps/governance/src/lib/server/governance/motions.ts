import { randomUUID } from 'node:crypto';
import { db } from '../db.js';
import { getVoteRuleByUuid, evaluateTally } from './vote-rules.js';
import * as library from '../documents/library.js';
import * as discussions from '../communications/discussions.js';
import type { MotionDocument, MotionContent, MotionStatus } from '../documents/library-types.js';

// --- Types ---

// Re-export types from library
export type { MotionDocument, MotionContent, MotionStatus };

export type VoteChoice = 'aye' | 'nay' | 'abstain';

// Motion comments are now in discussions system
// Vote tallies are now in vote_sessions system

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

export function getMotionByUuid(uuid: string): MotionDocument | null {
	return library.getMotionByUuid(uuid);
}

export function getMotionBySlug(slug: string): MotionDocument | null {
	return library.getMotionBySlug(slug);
}

export function listMotions(opts: {
	bodyUuid?: string;
	status?: MotionStatus;
} = {}): MotionDocument[] {
	return library.listMotions({
		owner_uuid: opts.bodyUuid,
		status: opts.status,
	});
}

export function listEnactedMotions(): MotionDocument[] {
	return library.listMotions({ status: 'enacted' });
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
}): MotionDocument {
	const uuid = randomUUID();
	
	// Get next motion number for this body from library
	const libraryMotions = library.listMotions({ owner_uuid: input.body_uuid });
	const maxNumber = libraryMotions.reduce((max, m) => {
		// Extract number from format "M-2026-001"
		const match = m.content.motion_number?.match(/-(\d+)$/);
		const num = match ? parseInt(match[1], 10) : 0;
		return Math.max(max, num);
	}, 0);
	
	const motionNumber = maxNumber + 1;
	
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

export function advanceMotion(uuid: string, to: MotionStatus): MotionDocument {
	const motion = getMotionByUuid(uuid);
	if (!motion) throw new Error(`Motion not found: ${uuid}`);

	const allowed = ALLOWED_TRANSITIONS[motion.content.status] ?? [];
	if (!allowed.includes(to)) {
		throw new Error(`Cannot transition motion from '${motion.content.status}' to '${to}'`);
	}

	const resolvedAt = (to === 'withdrawn') ? now() : null;
	const introducedAt = (to === 'introduced' && !motion.content.introduced_at) ? now() : null;
	
	// Note: Voting now happens during meetings, not automatically when advancing to deliberation
	if (to === 'deliberation') {
		// Check if vote rule is set
		if (!motion.content.vote_rule_uuid) {
			throw new Error('A vote rule must be assigned before deliberation can begin');
		}
	}
	
	// Update motion status in library
	return library.updateMotionStatus(motion.slug, to, {
		introduced_at: introducedAt || undefined,
		vote_closed_at: resolvedAt || undefined,
	});
}

export function setMotionVoteRule(motionUuid: string, voteRuleUuid: string | null): MotionDocument {
	const motion = getMotionByUuid(motionUuid);
	if (!motion) throw new Error(`Motion not found: ${motionUuid}`);
	if (motion.content.status === 'deliberation' || motion.content.status === 'enacted' || motion.content.status === 'rejected' || motion.content.status === 'withdrawn') {
		throw new Error(`Cannot change vote rule on a motion in status '${motion.content.status}'`);
	}
	return library.updateMotion(motion.slug, { vote_rule_uuid: voteRuleUuid ?? undefined });
}

export function setMotionDeliberationRule(motionUuid: string, deliberationRuleUuid: string | null): MotionDocument {
	const motion = getMotionByUuid(motionUuid);
	if (!motion) throw new Error(`Motion not found: ${motionUuid}`);
	if (motion.content.status === 'deliberation' || motion.content.status === 'enacted' || motion.content.status === 'rejected' || motion.content.status === 'withdrawn') {
		throw new Error(`Cannot change deliberation rule on a motion in status '${motion.content.status}'`);
	}
	return library.updateMotion(motion.slug, { deliberation_rule_uuid: deliberationRuleUuid ?? undefined });
}

export function setMotionClerkNotes(motionUuid: string, clerkNotes: string | null): MotionDocument {
	const motion = getMotionByUuid(motionUuid);
	if (!motion) throw new Error(`Motion not found: ${motionUuid}`);
	return library.updateMotion(motion.slug, { clerk_notes: clerkNotes ?? undefined });
}

export function setMotionParliamentarianNotes(motionUuid: string, parliamentarianNotes: string | null): MotionDocument {
	const motion = getMotionByUuid(motionUuid);
	if (!motion) throw new Error(`Motion not found: ${motionUuid}`);
	return library.updateMotion(motion.slug, { parliamentarian_notes: parliamentarianNotes ?? undefined });
}

// --- Vote Tallies ---
// Voting is handled by the vote_sessions system (see vote-sessions.ts).
// Old motion_vote_tally table is deprecated.

// --- Motion Enactment ---
// These functions are called by the vote_sessions system when a vote is finalized.

/**
 * Enact a motion based on a passed vote session
 * Called by vote_sessions system when outcome is 'passed'
 */
export function enactMotion(motionUuid: string, voteSessionUuid: string): MotionDocument {
	const motion = getMotionByUuid(motionUuid);
	if (!motion) throw new Error(`Motion not found: ${motionUuid}`);
	
	if (motion.content.status === 'enacted') {
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
export function rejectMotion(motionUuid: string, voteSessionUuid: string): MotionDocument {
	const motion = getMotionByUuid(motionUuid);
	if (!motion) throw new Error(`Motion not found: ${motionUuid}`);
	
	if (motion.content.status === 'rejected') {
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
	if (!motion.content.thread_uuid) throw new Error('Motion has no discussion thread');
	
	return discussions.addComment({
		thread_uuid: motion.content.thread_uuid,
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
	if (!motion?.content.thread_uuid) return [];
	
	return discussions.getCommentsWithAuthors(motion.content.thread_uuid);
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

