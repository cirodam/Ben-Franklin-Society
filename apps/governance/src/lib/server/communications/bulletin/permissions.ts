// ============================================================================
// Bulletin Permission Functions
// ============================================================================

import { db } from '../../db.js';
import type { BulletinPost } from './types.js';

/**
 * Check if a person can view a specific post
 */
export function canViewPost(post: BulletinPost, person_uuid: string): boolean {
	// Society-wide posts: all members can view
	if (!post.association_uuid) return true;

	// Public posts: all members can view
	if (post.visibility === 'public') return true;

	// Check association membership
	const isMember = db
		.prepare(
			`
		SELECT 1 FROM association_member
		WHERE association_uuid = ? AND person_uuid = ? AND removed_at IS NULL
	`
		)
		.get(post.association_uuid, person_uuid);

	if (post.visibility === 'members_only') return !!isMember;

	// Officers only: check for role
	if (post.visibility === 'officers_only') {
		const hasRole = db
			.prepare(
				`
			SELECT 1 FROM role_assignment ra
			JOIN role r ON ra.role_uuid = r.uuid
			WHERE r.association_uuid = ? AND ra.person_uuid = ? AND ra.removed_at IS NULL
		`
			)
			.get(post.association_uuid, person_uuid);
		return !!hasRole;
	}

	return false;
}

/**
 * Check if a person can post to an association
 */
export function canPostToAssociation(
	association_uuid: string | null,
	person_uuid: string
): boolean {
	// Society-wide: any member can post
	if (!association_uuid) return true;

	// Association-specific: must be a member
	const isMember = db
		.prepare(
			`
		SELECT 1 FROM association_member
		WHERE association_uuid = ? AND person_uuid = ? AND removed_at IS NULL
	`
		)
		.get(association_uuid, person_uuid);

	return !!isMember;
}

/**
 * Check if a person can set visibility to officers_only
 */
export function canPostOfficersOnly(association_uuid: string, person_uuid: string): boolean {
	const hasRole = db
		.prepare(
			`
		SELECT 1 FROM role_assignment ra
		JOIN role r ON ra.role_uuid = r.uuid
		WHERE r.association_uuid = ? AND ra.person_uuid = ? AND ra.removed_at IS NULL
	`
		)
		.get(association_uuid, person_uuid);

	return !!hasRole;
}

/**
 * Check if a person can edit a post
 */
export function canEditPost(post: BulletinPost, person_uuid: string): boolean {
	// Author can edit their own post within 24 hours
	if (post.author_uuid === person_uuid) {
		const created = new Date(post.created_at);
		const now = new Date();
		const hoursSince = (now.getTime() - created.getTime()) / (1000 * 60 * 60);
		return hoursSince < 24;
	}

	// Officers can edit posts in their association
	if (post.association_uuid) {
		const hasRole = db
			.prepare(
				`
			SELECT 1 FROM role_assignment ra
			JOIN role r ON ra.role_uuid = r.uuid
			WHERE r.association_uuid = ? AND ra.person_uuid = ? AND ra.removed_at IS NULL
		`
			)
			.get(post.association_uuid, person_uuid);
		return !!hasRole;
	}

	return false;
}

/**
 * Check if a person can delete a post
 */
export function canDeletePost(post: BulletinPost, person_uuid: string): boolean {
	// Author can delete their own post
	if (post.author_uuid === person_uuid) return true;

	// Officers can delete posts in their association
	if (post.association_uuid) {
		const hasRole = db
			.prepare(
				`
			SELECT 1 FROM role_assignment ra
			JOIN role r ON ra.role_uuid = r.uuid
			WHERE r.association_uuid = ? AND ra.person_uuid = ? AND ra.removed_at IS NULL
		`
			)
			.get(post.association_uuid, person_uuid);
		return !!hasRole;
	}

	return false;
}

/**
 * Check if a person can pin posts (officers only)
 */
export function canPinPost(association_uuid: string | null, person_uuid: string): boolean {
	if (!association_uuid) return false; // Society posts can't be pinned

	const hasRole = db
		.prepare(
			`
		SELECT 1 FROM role_assignment ra
		JOIN role r ON ra.role_uuid = r.uuid
		WHERE r.association_uuid = ? AND ra.person_uuid = ? AND ra.removed_at IS NULL
	`
		)
		.get(association_uuid, person_uuid);

	return !!hasRole;
}
