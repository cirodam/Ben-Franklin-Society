// ============================================================================
// Bulletin Mutation Functions
// ============================================================================

import { randomUUID } from 'node:crypto';
import { db } from '../../db.js';
import type { BulletinPost, BulletinComment } from './types.js';
import { getPost } from './queries.js';
import {
	canViewPost,
	canPostToAssociation,
	canPostOfficersOnly,
	canEditPost,
	canDeletePost,
	canPinPost,
} from './permissions.js';

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
