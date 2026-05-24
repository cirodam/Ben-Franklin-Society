// ============================================================================
// Bulletin Board Module
// ============================================================================
// Server functions for managing bulletin posts, comments, reactions, and flags

import { db } from '../db.js';
import { randomUUID } from 'node:crypto';

// ============================================================================
// Types
// ============================================================================

export interface BulletinPost {
	uuid: string;
	author_uuid: string;
	association_uuid: string | null;
	title: string;
	body: string;
	visibility: 'public' | 'members_only' | 'officers_only';
	category: 'announcement' | 'discussion' | 'question' | 'event' | 'policy' | null;
	created_at: string;
	updated_at: string | null;
	expires_at: string | null;
	deleted_at: string | null;
	pinned_at: string | null;
}

export interface BulletinPostWithAuthor extends BulletinPost {
	author_given_name: string;
	author_family_name: string;
	author_handle: string;
	comment_count: number;
	association_name?: string;
	association_handle?: string;
}

export interface BulletinComment {
	uuid: string;
	post_uuid: string;
	author_uuid: string;
	body: string;
	created_at: string;
	deleted_at: string | null;
}

export interface BulletinCommentWithAuthor extends BulletinComment {
	author_given_name: string;
	author_family_name: string;
	author_handle: string;
}

// ============================================================================
// Query Functions
// ============================================================================

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

// ============================================================================
// Permission Functions
// ============================================================================

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

// ============================================================================
// Mutation Functions
// ============================================================================

/**
 * Create a new bulletin post
 */
export function createPost(opts: {
	author_uuid: string;
	association_uuid: string | null;
	title: string;
	body: string;
	visibility?: 'public' | 'members_only' | 'officers_only';
	category?: 'announcement' | 'discussion' | 'question' | 'event' | 'policy' | null;
	expires_at?: string | null;
}): string {
	const uuid = randomUUID();
	const now = new Date().toISOString();
	// Default to members_only for association posts (privacy-first), public for society posts
	const visibility = opts.visibility || (opts.association_uuid ? 'members_only' : 'public');
	const category = opts.category || null;
	const expires_at = opts.expires_at || null;

	// Validate posting permission
	if (!canPostToAssociation(opts.association_uuid, opts.author_uuid)) {
		throw new Error('Not authorized to post to this association');
	}

	// Validate officers_only permission
	if (visibility === 'officers_only' && opts.association_uuid) {
		if (!canPostOfficersOnly(opts.association_uuid, opts.author_uuid)) {
			throw new Error('Only officers can create officers_only posts');
		}
	}

	db.prepare(
		`
		INSERT INTO bulletin_post (
			uuid, author_uuid, association_uuid, title, body, 
			visibility, category, created_at, expires_at
		)
		VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
	`
	).run(
		uuid,
		opts.author_uuid,
		opts.association_uuid,
		opts.title.trim(),
		opts.body.trim(),
		visibility,
		category,
		now,
		expires_at
	);

	return uuid;
}

/**
 * Update an existing post
 */
export function updatePost(
	uuid: string,
	person_uuid: string,
	updates: {
		title?: string;
		body?: string;
		visibility?: 'public' | 'members_only' | 'officers_only';
		category?: 'announcement' | 'discussion' | 'question' | 'event' | 'policy' | null;
	}
): void {
	const post = db
		.prepare('SELECT * FROM bulletin_post WHERE uuid = ? AND deleted_at IS NULL')
		.get(uuid) as BulletinPost | undefined;

	if (!post) {
		throw new Error('Post not found');
	}

	if (!canEditPost(post, person_uuid)) {
		throw new Error('Not authorized to edit this post');
	}

	const now = new Date().toISOString();
	const setClauses: string[] = ['updated_at = ?'];
	const values: any[] = [now];

	if (updates.title !== undefined) {
		setClauses.push('title = ?');
		values.push(updates.title.trim());
	}
	if (updates.body !== undefined) {
		setClauses.push('body = ?');
		values.push(updates.body.trim());
	}
	if (updates.visibility !== undefined) {
		// Validate officers_only permission
		if (updates.visibility === 'officers_only' && post.association_uuid) {
			if (!canPostOfficersOnly(post.association_uuid, person_uuid)) {
				throw new Error('Only officers can set officers_only visibility');
			}
		}
		setClauses.push('visibility = ?');
		values.push(updates.visibility);
	}
	if (updates.category !== undefined) {
		setClauses.push('category = ?');
		values.push(updates.category);
	}

	values.push(uuid);

	db.prepare(`UPDATE bulletin_post SET ${setClauses.join(', ')} WHERE uuid = ?`).run(...values);
}

/**
 * Delete a post (soft delete)
 */
export function deletePost(uuid: string, person_uuid: string): void {
	const post = db
		.prepare('SELECT * FROM bulletin_post WHERE uuid = ? AND deleted_at IS NULL')
		.get(uuid) as BulletinPost | undefined;

	if (!post) {
		throw new Error('Post not found');
	}

	if (!canDeletePost(post, person_uuid)) {
		throw new Error('Not authorized to delete this post');
	}

	const now = new Date().toISOString();
	db.prepare('UPDATE bulletin_post SET deleted_at = ? WHERE uuid = ?').run(now, uuid);
}

/**
 * Pin a post (officers only)
 */
export function pinPost(uuid: string, person_uuid: string): void {
	const post = db
		.prepare('SELECT * FROM bulletin_post WHERE uuid = ? AND deleted_at IS NULL')
		.get(uuid) as BulletinPost | undefined;

	if (!post) {
		throw new Error('Post not found');
	}

	if (!canPinPost(post.association_uuid, person_uuid)) {
		throw new Error('Not authorized to pin posts');
	}

	const now = new Date().toISOString();
	db.prepare('UPDATE bulletin_post SET pinned_at = ? WHERE uuid = ?').run(now, uuid);
}

/**
 * Unpin a post
 */
export function unpinPost(uuid: string, person_uuid: string): void {
	const post = db
		.prepare('SELECT * FROM bulletin_post WHERE uuid = ? AND deleted_at IS NULL')
		.get(uuid) as BulletinPost | undefined;

	if (!post) {
		throw new Error('Post not found');
	}

	if (!canPinPost(post.association_uuid, person_uuid)) {
		throw new Error('Not authorized to unpin posts');
	}

	db.prepare('UPDATE bulletin_post SET pinned_at = NULL WHERE uuid = ?').run(uuid);
}

/**
 * Create a comment on a post
 */
export function createComment(opts: {
	post_uuid: string;
	author_uuid: string;
	body: string;
	quoted_author_name?: string | null;
	quoted_excerpt?: string | null;
	quoted_reply_id?: string | null;
}): string {
	const uuid = randomUUID();
	const now = new Date().toISOString();

	// Verify post exists and person can view it
	const post = getPost(opts.post_uuid);
	if (!post) {
		throw new Error('Post not found');
	}

	if (!canViewPost(post, opts.author_uuid)) {
		throw new Error('Not authorized to view this post');
	}

	db.prepare(
		`
		INSERT INTO bulletin_comment (
			uuid, post_uuid, author_uuid, body,
			quoted_author_name, quoted_excerpt, quoted_reply_id, created_at
		)
		VALUES (?, ?, ?, ?, ?, ?, ?, ?)
	`
	).run(
		uuid,
		opts.post_uuid,
		opts.author_uuid,
		opts.body.trim(),
		opts.quoted_author_name || null,
		opts.quoted_excerpt || null,
		opts.quoted_reply_id || null,
		now
	);

	return uuid;
}

/**
 * Delete a comment (soft delete)
 */
export function deleteComment(uuid: string, person_uuid: string): void {
	const comment = db
		.prepare('SELECT * FROM bulletin_comment WHERE uuid = ? AND deleted_at IS NULL')
		.get(uuid) as BulletinComment | undefined;

	if (!comment) {
		throw new Error('Comment not found');
	}

	// Author can delete their own comment
	// TODO: Officers can delete comments in their association
	if (comment.author_uuid !== person_uuid) {
		throw new Error('Not authorized to delete this comment');
	}

	const now = new Date().toISOString();
	db.prepare('UPDATE bulletin_comment SET deleted_at = ? WHERE uuid = ?').run(now, uuid);
}
