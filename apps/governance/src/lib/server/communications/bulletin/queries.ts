// ============================================================================
// Bulletin Query Functions
// ============================================================================

import { db } from '../../db.js';
import type { BulletinPostWithAuthor, BulletinCommentWithAuthor } from './types.js';

/**
 * Get society-wide bulletin posts (association_uuid IS NULL)
 */
export function getSocietyPosts(): BulletinPostWithAuthor[] {
	return db
		.prepare(
			`
		SELECT 
			bp.uuid,
			bp.author_uuid,
			bp.association_uuid,
			bp.title,
			bp.body,
			bp.visibility,
			bp.category,
			bp.created_at,
			bp.updated_at,
			bp.expires_at,
			bp.deleted_at,
			bp.pinned_at,
			p.given_name as author_given_name,
			p.family_name as author_family_name,
			p.handle as author_handle,
			(SELECT COUNT(*) FROM bulletin_comment WHERE post_uuid = bp.uuid AND deleted_at IS NULL) as comment_count
		FROM bulletin_post bp
		JOIN person p ON bp.author_uuid = p.uuid
		WHERE bp.association_uuid IS NULL
			AND bp.deleted_at IS NULL
			AND (bp.expires_at IS NULL OR datetime(bp.expires_at) > datetime('now'))
		ORDER BY bp.pinned_at DESC NULLS LAST, bp.created_at DESC
		LIMIT 50
	`
		)
		.all() as BulletinPostWithAuthor[];
}

/**
 * Get posts for a specific association
 * Respects visibility rules based on person_uuid
 */
export function getAssociationPosts(
	association_uuid: string,
	person_uuid: string
): BulletinPostWithAuthor[] {
	// Check if person is a member
	const isMember = db
		.prepare(
			`
		SELECT 1 FROM association_member
		WHERE association_uuid = ? AND person_uuid = ? AND removed_at IS NULL
	`
		)
		.get(association_uuid, person_uuid);

	// Check if person has a role (officer)
	const hasRole = db
		.prepare(
			`
		SELECT 1 FROM role_assignment ra
		JOIN role r ON ra.role_uuid = r.uuid
		WHERE r.association_uuid = ? AND ra.person_uuid = ? AND ra.removed_at IS NULL
	`
		)
		.get(association_uuid, person_uuid);

	// Build visibility filter
	let visibilityFilter = "bp.visibility = 'public'";
	if (isMember) {
		visibilityFilter = "(bp.visibility IN ('public', 'members_only'))";
	}
	if (hasRole) {
		visibilityFilter = "(bp.visibility IN ('public', 'members_only', 'officers_only'))";
	}

	return db
		.prepare(
			`
		SELECT 
			bp.uuid,
			bp.author_uuid,
			bp.association_uuid,
			bp.title,
			bp.body,
			bp.visibility,
			bp.category,
			bp.created_at,
			bp.updated_at,
			bp.expires_at,
			bp.deleted_at,
			bp.pinned_at,
			p.given_name as author_given_name,
			p.family_name as author_family_name,
			p.handle as author_handle,
			a.name as association_name,
			a.handle as association_handle,
			(SELECT COUNT(*) FROM bulletin_comment WHERE post_uuid = bp.uuid AND deleted_at IS NULL) as comment_count
		FROM bulletin_post bp
		JOIN person p ON bp.author_uuid = p.uuid
		JOIN association a ON bp.association_uuid = a.uuid
		WHERE bp.association_uuid = ?
			AND bp.deleted_at IS NULL
			AND (bp.expires_at IS NULL OR datetime(bp.expires_at) > datetime('now'))
			AND ${visibilityFilter}
		ORDER BY bp.pinned_at DESC NULLS LAST, bp.created_at DESC
		LIMIT 50
	`
		)
		.all(association_uuid) as BulletinPostWithAuthor[];
}

/**
 * Get a single post by UUID
 */
export function getPost(uuid: string): BulletinPostWithAuthor | null {
	const post = db
		.prepare(
			`
		SELECT 
			bp.uuid,
			bp.author_uuid,
			bp.association_uuid,
			bp.title,
			bp.body,
			bp.visibility,
			bp.category,
			bp.created_at,
			bp.updated_at,
			bp.expires_at,
			bp.deleted_at,
			bp.pinned_at,
			p.given_name as author_given_name,
			p.family_name as author_family_name,
			p.handle as author_handle,
			a.name as association_name,
			a.handle as association_handle,
			(SELECT COUNT(*) FROM bulletin_comment WHERE post_uuid = bp.uuid AND deleted_at IS NULL) as comment_count
		FROM bulletin_post bp
		JOIN person p ON bp.author_uuid = p.uuid
		LEFT JOIN association a ON bp.association_uuid = a.uuid
		WHERE bp.uuid = ? AND bp.deleted_at IS NULL
	`
		)
		.get(uuid) as BulletinPostWithAuthor | undefined;

	return post || null;
}

/**
 * Get aggregated feed for a person (posts from their associations + society posts)
 */
export function getPersonFeed(person_uuid: string): BulletinPostWithAuthor[] {
	return db
		.prepare(
			`
		SELECT 
			bp.uuid,
			bp.author_uuid,
			bp.association_uuid,
			bp.title,
			bp.body,
			bp.visibility,
			bp.category,
			bp.created_at,
			bp.updated_at,
			bp.expires_at,
			bp.deleted_at,
			bp.pinned_at,
			p.given_name as author_given_name,
			p.family_name as author_family_name,
			p.handle as author_handle,
			a.name as association_name,
			a.handle as association_handle,
			(SELECT COUNT(*) FROM bulletin_comment WHERE post_uuid = bp.uuid AND deleted_at IS NULL) as comment_count
		FROM bulletin_post bp
		JOIN person p ON bp.author_uuid = p.uuid
		LEFT JOIN association a ON bp.association_uuid = a.uuid
		WHERE bp.deleted_at IS NULL
			AND (bp.expires_at IS NULL OR datetime(bp.expires_at) > datetime('now'))
			AND (
				bp.association_uuid IS NULL  -- Society-wide posts
				OR bp.visibility = 'public'   -- Public association posts
				OR (
					bp.visibility = 'members_only' 
					AND EXISTS (
						SELECT 1 FROM association_member 
						WHERE association_uuid = bp.association_uuid 
							AND person_uuid = ? 
							AND removed_at IS NULL
					)
				)
				OR (
					bp.visibility = 'officers_only'
					AND EXISTS (
						SELECT 1 FROM role_assignment ra
						JOIN role r ON ra.role_uuid = r.uuid
						WHERE r.association_uuid = bp.association_uuid
							AND ra.person_uuid = ?
							AND ra.removed_at IS NULL
					)
				)
			)
		ORDER BY bp.created_at DESC
		LIMIT 100
	`
		)
		.all(person_uuid, person_uuid) as BulletinPostWithAuthor[];
}

/**
 * Get comments for a post
 */
export function getComments(post_uuid: string): BulletinCommentWithAuthor[] {
	return db
		.prepare(
			`
		SELECT 
			bc.uuid,
			bc.post_uuid,
			bc.author_uuid,
			bc.body,
			bc.quoted_author_name,
			bc.quoted_excerpt,
			bc.quoted_reply_id,
			bc.created_at,
			bc.deleted_at,
			p.given_name as author_given_name,
			p.family_name as author_family_name,
			p.handle as author_handle
		FROM bulletin_comment bc
		JOIN person p ON bc.author_uuid = p.uuid
		WHERE bc.post_uuid = ? AND bc.deleted_at IS NULL
		ORDER BY bc.created_at ASC
	`
		)
		.all(post_uuid) as BulletinCommentWithAuthor[];
}
