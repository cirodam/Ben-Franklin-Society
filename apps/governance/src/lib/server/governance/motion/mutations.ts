/**
 * Mutation functions for the motion system (write operations)
 */

import { randomUUID } from 'node:crypto';
import * as library from '../../documents/society-docs.js';
import * as discussions from '../../communications/discussions.js';
import type { MotionDocument, MotionStatus } from './types.js';
import { ALLOWED_TRANSITIONS } from './types.js';
import { getMotionByUuid, getMotionBySlug } from './queries.js';

function now(): string {
	return new Date().toISOString();
}

/**
 * Create a new motion
 */
export function createMotion(input: {
	title: string;
	body: string;
	reasoning?: string | null;
	introduced_by_uuid: string;
	body_uuid: string;
	body_name?: string;
	deliberation_rule_uuid?: string | null;
	deliberation_rule_name?: string;
	vote_rule_uuid?: string | null;
	vote_rule_name?: string;
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
	
	// Convert body and reasoning into a single provision
	const provisions: Array<{ number: string; text: string; reasoning?: string }> = [
		{
			number: '1',
			text: input.body,
			reasoning: input.reasoning ?? undefined
		}
	];
	
	const motion = library.createMotion({
		slug,
		title: input.title,
		provisions,
		introducer_uuid: input.introduced_by_uuid,
		owner_uuid: input.body_uuid,
		body_name: input.body_name,
		deliberation_rule_uuid: input.deliberation_rule_uuid ?? undefined,
		deliberation_rule_name: input.deliberation_rule_name,
		vote_rule_uuid: input.vote_rule_uuid ?? undefined,
		vote_rule_name: input.vote_rule_name,
		discussion_thread_uuid: thread.uuid,
	});
	
	// Set status to introduced (library creates as draft)
	return library.updateMotionStatus(slug, 'introduced', {
		introduced_at: now(),
	});
}

/**
 * Advance a motion to the next status with validation
 */
export function advanceMotion(slugOrUuid: string, to: MotionStatus): MotionDocument {
	let motion = getMotionBySlug(slugOrUuid);
	if (!motion) motion = getMotionByUuid(slugOrUuid);
	if (!motion) throw new Error(`Motion not found: ${slugOrUuid}`);

	const allowed = ALLOWED_TRANSITIONS[motion.content.status] ?? [];
	if (!allowed.includes(to)) {
		throw new Error(`Cannot transition motion from '${motion.content.status}' to '${to}'`);
	}

	const resolvedAt = (to === 'withdrawn') ? now() : null;
	const introducedAt = (to === 'introduced' && !motion.content.introduced_at) ? now() : null;
	
	// Require vote rule before entering voting phase
	if (to === 'voting') {
		// Check if vote rule is set
		if (!motion.content.vote_rule_uuid) {
			throw new Error('A vote rule must be assigned before voting can begin');
		}
	}
	
	// Update motion status in library
	return library.updateMotionStatus(motion.slug, to, {
		introduced_at: introducedAt || undefined,
		vote_closed_at: resolvedAt || undefined,
	});
}

/**
 * Manually set motion status (admin override)
 * Bypasses normal transition validation - use with caution
 */
export function setMotionStatus(slugOrUuid: string, to: MotionStatus): MotionDocument {
	let motion = getMotionBySlug(slugOrUuid);
	if (!motion) motion = getMotionByUuid(slugOrUuid);
	if (!motion) throw new Error(`Motion not found: ${slugOrUuid}`);

	// Set appropriate timestamps based on status
	const updates: any = {};
	
	if (to === 'introduced' && !motion.content.introduced_at) {
		updates.introduced_at = now();
	}
	
	if (to === 'adopted' && !motion.content.adopted_at) {
		updates.adopted_at = now();
	}
	
	if (to === 'enacted' && !motion.content.enacted_at) {
		updates.enacted_at = now();
	}
	
	if (['rejected', 'withdrawn'].includes(to) && !motion.content.vote_closed_at) {
		updates.vote_closed_at = now();
	}
	
	// Update motion status in library
	return library.updateMotionStatus(motion.slug, to, updates);
}

/**
 * Set the vote rule for a motion
 */
export function setMotionVoteRule(motionSlugOrUuid: string, voteRuleUuid: string | null): MotionDocument {
	let motion = getMotionBySlug(motionSlugOrUuid);
	if (!motion) motion = getMotionByUuid(motionSlugOrUuid);
	if (!motion) throw new Error(`Motion not found: ${motionSlugOrUuid}`);
	if (motion.content.status === 'voting' || motion.content.status === 'deliberation' || motion.content.status === 'enacted' || motion.content.status === 'rejected' || motion.content.status === 'withdrawn') {
		throw new Error(`Cannot change vote rule on a motion in status '${motion.content.status}'`);
	}
	return library.updateMotion(motion.slug, { vote_rule_uuid: voteRuleUuid ?? undefined });
}

/**
 * Set the deliberation rule for a motion
 */
export function setMotionDeliberationRule(motionSlugOrUuid: string, deliberationRuleUuid: string | null): MotionDocument {
	let motion = getMotionBySlug(motionSlugOrUuid);
	if (!motion) motion = getMotionByUuid(motionSlugOrUuid);
	if (!motion) throw new Error(`Motion not found: ${motionSlugOrUuid}`);
	if (motion.content.status === 'voting' || motion.content.status === 'deliberation' || motion.content.status === 'enacted' || motion.content.status === 'rejected' || motion.content.status === 'withdrawn') {
		throw new Error(`Cannot change deliberation rule on a motion in status '${motion.content.status}'`);
	}
	return library.updateMotion(motion.slug, { deliberation_rule_uuid: deliberationRuleUuid ?? undefined });
}

/**
 * Set clerk notes for a motion
 */
export function setMotionClerkNotes(motionSlugOrUuid: string, clerkNotes: string | null): MotionDocument {
	let motion = getMotionBySlug(motionSlugOrUuid);
	if (!motion) motion = getMotionByUuid(motionSlugOrUuid);
	if (!motion) throw new Error(`Motion not found: ${motionSlugOrUuid}`);
	return library.updateMotion(motion.slug, { clerk_notes: clerkNotes ?? undefined });
}

/**
 * Set parliamentarian notes for a motion
 */
export function setMotionParliamentarianNotes(motionSlugOrUuid: string, parliamentarianNotes: string | null): MotionDocument {
	let motion = getMotionBySlug(motionSlugOrUuid);
	if (!motion) motion = getMotionByUuid(motionSlugOrUuid);
	if (!motion) throw new Error(`Motion not found: ${motionSlugOrUuid}`);
	return library.updateMotion(motion.slug, { parliamentarian_notes: parliamentarianNotes ?? undefined });
}

/**
 * Enact a motion based on a passed vote session
 * Called by vote_sessions system when outcome is 'passed'
 */
export function enactMotion(motionSlugOrUuid: string, voteSessionUuid: string): MotionDocument {
	let motion = getMotionBySlug(motionSlugOrUuid);
	if (!motion) motion = getMotionByUuid(motionSlugOrUuid);
	if (!motion) throw new Error(`Motion not found: ${motionSlugOrUuid}`);
	
	if (motion.content.status === 'adopted' || motion.content.status === 'enacted') {
		// Already adopted or enacted, no-op
		return motion;
	}
	
	const adopted_at = now();
	
	return library.updateMotion(motion.slug, {
		status: 'adopted',
		adopted_at
	});
}

/**
 * Reject a motion based on a failed vote session
 * Called by vote_sessions system when outcome is 'failed'
 */
export function rejectMotion(motionSlugOrUuid: string, voteSessionUuid: string): MotionDocument {
	let motion = getMotionBySlug(motionSlugOrUuid);
	if (!motion) motion = getMotionByUuid(motionSlugOrUuid);
	if (!motion) throw new Error(`Motion not found: ${motionSlugOrUuid}`);
	
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
