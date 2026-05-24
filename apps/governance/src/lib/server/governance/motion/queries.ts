/**
 * Query functions for the motion system (read operations)
 */

import * as library from '../../documents/society-docs.js';
import * as discussions from '../../communications/discussions.js';
import type { MotionDocument, MotionStatus } from './types.js';

/**
 * Get a motion by UUID
 */
export function getMotionByUuid(uuid: string): MotionDocument | null {
	return library.getMotionByUuid(uuid);
}

/**
 * Get a motion by slug
 */
export function getMotionBySlug(slug: string): MotionDocument | null {
	return library.getMotionBySlug(slug);
}

/**
 * List motions with optional filters
 */
export function listMotions(opts: {
	bodyUuid?: string;
	status?: MotionStatus;
} = {}): MotionDocument[] {
	return library.listMotions({
		owner_uuid: opts.bodyUuid,
		status: opts.status,
	});
}

/**
 * List enacted motions
 */
export function listEnactedMotions(): MotionDocument[] {
	return library.listMotions({ status: 'enacted' });
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
