/**
 * General-purpose discussion thread system
 * Provides comment threads that can be attached to any entity (motions, referenda, etc.)
 */

import { randomUUID } from 'crypto';
import { db } from '../db.js';

// --- Types ---

export interface CommentThread {
	uuid: string;
	created_at: string;
}

export interface Comment {
	uuid: string;
	thread_uuid: string;
	author_uuid: string;
	parent_comment_uuid: string | null;
	body: string;
	created_at: string;
	edited_at: string | null;
	deleted_at: string | null;
}

function now(): string {
	return new Date().toISOString();
}

// --- Thread Management ---

/**
 * Create a new comment thread
 */
export function createThread(): CommentThread {
	const uuid = randomUUID();
	const created_at = now();
	
	db.prepare(
		'INSERT INTO comment_thread (uuid, created_at) VALUES (?, ?)'
	).run(uuid, created_at);
	
	return { uuid, created_at };
}

/**
 * Get a comment thread by UUID
 */
export function getThread(uuid: string): CommentThread | null {
	return db.prepare('SELECT * FROM comment_thread WHERE uuid = ?')
		.get(uuid) as CommentThread | null;
}

/**
 * Delete a thread and all its comments (soft delete on comments)
 */
export function deleteThread(threadUuid: string): void {
	// Soft delete all comments in the thread
	db.prepare('UPDATE comment SET deleted_at = ? WHERE thread_uuid = ? AND deleted_at IS NULL')
		.run(now(), threadUuid);
	
	// Hard delete the thread itself (or could soft delete thread too)
	db.prepare('DELETE FROM comment_thread WHERE uuid = ?').run(threadUuid);
}

// --- Comment Functions ---

/**
 * Add a comment to a thread
 */
export function addComment(input: {
	thread_uuid: string;
	author_uuid: string;
	body: string;
	parent_comment_uuid?: string;
}): Comment {
	const uuid = randomUUID();
	const created_at = now();
	const parent_comment_uuid = input.parent_comment_uuid ?? null;
	
	db.prepare(`
		INSERT INTO comment (uuid, thread_uuid, author_uuid, parent_comment_uuid, body, created_at)
		VALUES (?, ?, ?, ?, ?, ?)
	`).run(uuid, input.thread_uuid, input.author_uuid, parent_comment_uuid, input.body, created_at);
	
	return db.prepare('SELECT * FROM comment WHERE uuid = ?').get(uuid) as Comment;
}

/**
 * Edit a comment
 */
export function editComment(commentUuid: string, body: string): void {
	db.prepare(
		'UPDATE comment SET body = ?, edited_at = ? WHERE uuid = ? AND deleted_at IS NULL'
	).run(body, now(), commentUuid);
}

/**
 * Delete a comment (soft delete)
 */
export function deleteComment(commentUuid: string): void {
	db.prepare(
		'UPDATE comment SET deleted_at = ? WHERE uuid = ? AND deleted_at IS NULL'
	).run(now(), commentUuid);
}

/**
 * Get a single comment by UUID
 */
export function getComment(uuid: string): Comment | null {
	return db.prepare('SELECT * FROM comment WHERE uuid = ?').get(uuid) as Comment | null;
}

/**
 * Get all comments in a thread (excluding deleted, in chronological order)
 */
export function getComments(threadUuid: string): Comment[] {
	return db.prepare(`
		SELECT * FROM comment 
		WHERE thread_uuid = ? AND deleted_at IS NULL 
		ORDER BY created_at ASC
	`).all(threadUuid) as Comment[];
}

/**
 * Get all replies to a specific comment (excluding deleted)
 */
export function getReplies(parentCommentUuid: string): Comment[] {
	return db.prepare(`
		SELECT * FROM comment 
		WHERE parent_comment_uuid = ? AND deleted_at IS NULL 
		ORDER BY created_at ASC
	`).all(parentCommentUuid) as Comment[];
}

/**
 * Get total comment count for a thread (excluding deleted)
 */
export function getCommentCount(threadUuid: string): number {
	const result = db.prepare(
		'SELECT COUNT(*) as count FROM comment WHERE thread_uuid = ? AND deleted_at IS NULL'
	).get(threadUuid) as { count: number };
	return result.count;
}

// --- Helper Functions ---

/**
 * Check if a person is the author of a comment
 */
export function isCommentAuthor(commentUuid: string, personUuid: string): boolean {
	const comment = db.prepare(
		'SELECT author_uuid FROM comment WHERE uuid = ?'
	).get(commentUuid) as { author_uuid: string } | undefined;
	
	return comment?.author_uuid === personUuid;
}

/**
 * Get comments with author information (for display purposes)
 */
export function getCommentsWithAuthors(threadUuid: string) {
	return db.prepare(`
		SELECT 
			c.*,
			p.given_name,
			p.family_name,
			p.handle
		FROM comment c
		JOIN person p ON c.author_uuid = p.uuid
		WHERE c.thread_uuid = ? AND c.deleted_at IS NULL
		ORDER BY c.created_at ASC
	`).all(threadUuid);
}
