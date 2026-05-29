/**
 * Query functions for the motion system (read operations)
 */

import * as library from '../../documents/society-docs.js';
import * as discussions from '../../communications/discussions.js';
import { db } from '../../db.js';
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
	// If bodyUuid is provided, look up the body's handle to use as slug
	if (opts.bodyUuid) {
		const body = db
			.prepare('SELECT handle FROM association WHERE uuid = ?')
			.get(opts.bodyUuid) as { handle: string } | undefined;
		
		if (!body) {
			console.warn(`Body not found for UUID: ${opts.bodyUuid}`);
			return [];
		}
		
		// Map old status values to new folder-based statuses
		let folderStatus: typeof library.MOTION_STATUSES[number] | undefined;
		if (opts.status) {
			const statusMap: Record<string, typeof library.MOTION_STATUSES[number]> = {
				draft: 'inbox',
				introduced: 'queued',
				deliberation: 'deliberating',
				voting: 'deliberating',
				adopted: 'adopted',
				enacted: 'enacted',
				rejected: 'rejected',
				withdrawn: 'rejected',
			};
			folderStatus = statusMap[opts.status];
		}
		
		return library.listMotions(body.handle, folderStatus);
	}
	
	// If no bodyUuid, need to search all bodies
	const allBodies = library.getAllBodySlugs();
	const allMotions: MotionDocument[] = [];
	
	for (const bodySlug of allBodies) {
		const motions = library.listMotions(bodySlug, opts.status as any);
		allMotions.push(...motions);
	}
	
	return allMotions;
}

/**
 * List enacted motions
 */
export function listEnactedMotions(): MotionDocument[] {
	// Search all bodies for enacted motions
	const allBodies = library.getAllBodySlugs();
	const enactedMotions: MotionDocument[] = [];
	
	for (const bodySlug of allBodies) {
		const motions = library.listMotions(bodySlug, 'enacted');
		enactedMotions.push(...motions);
	}
	
	return enactedMotions;
}

/**
 * Get all comments for a motion
 */
export function getMotionComments(motionUuid: string) {
	const motion = getMotionByUuid(motionUuid);
	if (!motion?.content.discussion_thread_uuid) return [];
	
	return discussions.getCommentsWithAuthors(motion.content.discussion_thread_uuid);
}

/**
 * Check if person is author of a comment
 */
export function isMotionCommentAuthor(commentUuid: string, personUuid: string): boolean {
	return discussions.isCommentAuthor(commentUuid, personUuid);
}
