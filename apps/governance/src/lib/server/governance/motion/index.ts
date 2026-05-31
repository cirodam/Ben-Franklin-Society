/**
 * Motion system - public API
 * 
 * This module provides functions for managing legislative motions and their discussion.
 */

// Re-export types
export type {
	MotionDocument,
	MotionContent,
	MotionStatus,
	VoteChoice,
} from './types.js';

export { ALLOWED_TRANSITIONS } from './types.js';

// Re-export query functions
export {
	getMotionByUuid,
	getMotionBySlug,
	listMotions,
	listEnactedMotions,
	getMotionComments,
	isMotionCommentAuthor,
} from './queries.js';

// Re-export mutation functions
export {
	createMotion,
	advanceMotion,
	setMotionStatus,
	setMotionVoteRule,
	setMotionDeliberationRule,
	enactMotion,
	rejectMotion,
	addMotionComment,
	editMotionComment,
	deleteMotionComment,
} from './mutations.js';
