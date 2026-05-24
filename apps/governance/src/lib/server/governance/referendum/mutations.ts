import { randomUUID } from 'crypto';
import { db } from '../../db.js';
import { createThread } from '../../communications/discussions.js';
import {
	getReferendumByUuid,
	getQuestionByUuid,
} from './queries.js';
import type {
	Referendum,
	ReferendumStatus,
	ReferendumQuestion,
	QuestionType,
	QuestionOption,
	ReferendumVote,
} from './types.js';

/**
 * Create a new referendum
 */
export function createReferendum(input: {
	title: string;
	description?: string;
	opens_at: string;
	closes_at: string;
	created_by_uuid: string;
}): Referendum {
	const uuid = randomUUID();
	const now = new Date().toISOString();

	const stmt = db.prepare(`
		INSERT INTO referendum (uuid, title, description, opens_at, closes_at, status, created_by_uuid, created_at)
		VALUES (?, ?, ?, ?, ?, 'draft', ?, ?)
	`);

	stmt.run(
		uuid,
		input.title,
		input.description ?? null,
		input.opens_at,
		input.closes_at,
		input.created_by_uuid,
		now
	);

	return getReferendumByUuid(uuid)!;
}

/**
 * Update referendum basic info (only for drafts)
 */
export function updateReferendum(
	uuid: string,
	input: {
		title?: string;
		description?: string | null;
		opens_at?: string;
		closes_at?: string;
	}
): Referendum {
	const updates: string[] = [];
	const params: any[] = [];

	if (input.title !== undefined) {
		updates.push('title = ?');
		params.push(input.title);
	}
	if (input.description !== undefined) {
		updates.push('description = ?');
		params.push(input.description);
	}
	if (input.opens_at !== undefined) {
		updates.push('opens_at = ?');
		params.push(input.opens_at);
	}
	if (input.closes_at !== undefined) {
		updates.push('closes_at = ?');
		params.push(input.closes_at);
	}

	if (updates.length === 0) return getReferendumByUuid(uuid)!;

	params.push(uuid);
	const stmt = db.prepare(`
		UPDATE referendum 
		SET ${updates.join(', ')}
		WHERE uuid = ?
	`);

	stmt.run(...params);
	return getReferendumByUuid(uuid)!;
}

/**
 * Update referendum status
 */
export function updateReferendumStatus(uuid: string, status: ReferendumStatus): Referendum {
	const now = new Date().toISOString();
	const closed_at = status === 'closed' ? now : null;

	const stmt = db.prepare(`
		UPDATE referendum 
		SET status = ?, closed_at = ?
		WHERE uuid = ?
	`);

	stmt.run(status, closed_at, uuid);

	return getReferendumByUuid(uuid)!;
}

/**
 * Create a question for a referendum
 */
export function createQuestion(input: {
	referendum_uuid: string;
	question_text: string;
	question_type: QuestionType;
	description?: string;
	display_order: number;
}): ReferendumQuestion {
	const uuid = randomUUID();
	const now = new Date().toISOString();

	// Create a comment thread for this question
	const thread = createThread();

	const stmt = db.prepare(`
		INSERT INTO referendum_question (uuid, referendum_uuid, question_text, question_type, description, display_order, thread_uuid, created_at)
		VALUES (?, ?, ?, ?, ?, ?, ?, ?)
	`);

	stmt.run(
		uuid,
		input.referendum_uuid,
		input.question_text,
		input.question_type,
		input.description ?? null,
		input.display_order,
		thread.uuid,
		now
	);

	return getQuestionByUuid(uuid)!;
}

/**
 * Update a question (only for draft referendums)
 */
export function updateQuestion(
	uuid: string,
	input: {
		question_text?: string;
		question_type?: QuestionType;
		description?: string | null;
		display_order?: number;
	}
): ReferendumQuestion {
	const updates: string[] = [];
	const params: any[] = [];

	if (input.question_text !== undefined) {
		updates.push('question_text = ?');
		params.push(input.question_text);
	}
	if (input.question_type !== undefined) {
		updates.push('question_type = ?');
		params.push(input.question_type);
	}
	if (input.description !== undefined) {
		updates.push('description = ?');
		params.push(input.description);
	}
	if (input.display_order !== undefined) {
		updates.push('display_order = ?');
		params.push(input.display_order);
	}

	if (updates.length === 0) return getQuestionByUuid(uuid)!;

	params.push(uuid);
	const stmt = db.prepare(`
		UPDATE referendum_question 
		SET ${updates.join(', ')}
		WHERE uuid = ?
	`);

	stmt.run(...params);
	return getQuestionByUuid(uuid)!;
}

/**
 * Delete a question and its options
 */
export function deleteQuestion(uuid: string): void {
	// Delete votes first
	db.prepare('DELETE FROM referendum_vote WHERE question_uuid = ?').run(uuid);
	// Delete options
	db.prepare('DELETE FROM referendum_question_option WHERE question_uuid = ?').run(uuid);
	// Delete question
	db.prepare('DELETE FROM referendum_question WHERE uuid = ?').run(uuid);
}

/**
 * Create an option for a question (used for multiple choice/ranking)
 */
export function createQuestionOption(input: {
	question_uuid: string;
	option_text: string;
	display_order: number;
}): QuestionOption {
	const uuid = randomUUID();

	const stmt = db.prepare(`
		INSERT INTO referendum_question_option (uuid, question_uuid, option_text, display_order)
		VALUES (?, ?, ?, ?)
	`);

	stmt.run(uuid, input.question_uuid, input.option_text, input.display_order);

	const getStmt = db.prepare('SELECT * FROM referendum_question_option WHERE uuid = ?');
	return getStmt.get(uuid) as QuestionOption;
}

/**
 * Update a question option
 */
export function updateQuestionOption(
	uuid: string,
	input: {
		option_text?: string;
		display_order?: number;
	}
): QuestionOption {
	const updates: string[] = [];
	const params: any[] = [];

	if (input.option_text !== undefined) {
		updates.push('option_text = ?');
		params.push(input.option_text);
	}
	if (input.display_order !== undefined) {
		updates.push('display_order = ?');
		params.push(input.display_order);
	}

	if (updates.length === 0) {
		const getStmt = db.prepare('SELECT * FROM referendum_question_option WHERE uuid = ?');
		return getStmt.get(uuid) as QuestionOption;
	}

	params.push(uuid);
	const stmt = db.prepare(`
		UPDATE referendum_question_option 
		SET ${updates.join(', ')}
		WHERE uuid = ?
	`);

	stmt.run(...params);

	const getStmt = db.prepare('SELECT * FROM referendum_question_option WHERE uuid = ?');
	return getStmt.get(uuid) as QuestionOption;
}

/**
 * Delete a question option
 */
export function deleteQuestionOption(uuid: string): void {
	db.prepare('DELETE FROM referendum_question_option WHERE uuid = ?').run(uuid);
}

/**
 * Cast a vote on a question
 */
export function castVote(input: {
	question_uuid: string;
	person_uuid: string;
	vote_value: any; // Will be JSON stringified
}): ReferendumVote {
	const uuid = randomUUID();
	const now = new Date().toISOString();
	const vote_value_json = JSON.stringify(input.vote_value);

	// Check if already voted
	const checkStmt = db.prepare(`
		SELECT uuid FROM referendum_vote 
		WHERE question_uuid = ? AND person_uuid = ?
	`);
	const existing = checkStmt.get(input.question_uuid, input.person_uuid) as
		| { uuid: string }
		| undefined;

	if (existing) {
		// Update existing vote
		const updateStmt = db.prepare(`
			UPDATE referendum_vote 
			SET vote_value = ?, voted_at = ?
			WHERE uuid = ?
		`);
		updateStmt.run(vote_value_json, now, existing.uuid);

		const getStmt = db.prepare('SELECT * FROM referendum_vote WHERE uuid = ?');
		return getStmt.get(existing.uuid) as ReferendumVote;
	} else {
		// Create new vote
		const insertStmt = db.prepare(`
			INSERT INTO referendum_vote (uuid, question_uuid, person_uuid, vote_value, voted_at)
			VALUES (?, ?, ?, ?, ?)
		`);
		insertStmt.run(uuid, input.question_uuid, input.person_uuid, vote_value_json, now);

		const getStmt = db.prepare('SELECT * FROM referendum_vote WHERE uuid = ?');
		return getStmt.get(uuid) as ReferendumVote;
	}
}

/**
 * Delete a draft referendum and all associated data
 */
export function deleteReferendum(uuid: string): void {
	const referendum = getReferendumByUuid(uuid);
	if (!referendum) throw new Error('Referendum not found');
	if (referendum.status !== 'draft') {
		throw new Error('Only draft referendums can be deleted');
	}

	// Get all questions to delete their threads and options
	const questions = db.prepare('SELECT * FROM referendum_question WHERE referendum_uuid = ?')
		.all(uuid) as ReferendumQuestion[];

	// Delete in reverse dependency order
	for (const question of questions) {
		// Delete votes
		db.prepare('DELETE FROM referendum_vote WHERE question_uuid = ?').run(question.uuid);
		
		// Delete options
		db.prepare('DELETE FROM referendum_question_option WHERE question_uuid = ?').run(question.uuid);
		
		// Delete thread and comments if exists
		if (question.thread_uuid) {
			db.prepare('UPDATE comment SET deleted_at = ? WHERE thread_uuid = ? AND deleted_at IS NULL')
				.run(new Date().toISOString(), question.thread_uuid);
			db.prepare('DELETE FROM comment_thread WHERE uuid = ?').run(question.thread_uuid);
		}
	}

	// Delete questions
	db.prepare('DELETE FROM referendum_question WHERE referendum_uuid = ?').run(uuid);
	
	// Delete referendum
	db.prepare('DELETE FROM referendum WHERE uuid = ?').run(uuid);
}

/**
 * Automatically open scheduled referendums that have reached their opens_at time
 */
export function autoOpenScheduledReferendums(): number {
	const now = new Date().toISOString();
	const result = db.prepare(`
		UPDATE referendum 
		SET status = 'open' 
		WHERE status = 'scheduled' AND opens_at <= ?
	`).run(now);
	
	return result.changes;
}

/**
 * Automatically close open referendums that have reached their closes_at time
 */
export function autoCloseOpenReferendums(): number {
	const now = new Date().toISOString();
	const result = db.prepare(`
		UPDATE referendum 
		SET status = 'closed', closed_at = ?
		WHERE status = 'open' AND closes_at <= ?
	`).run(now, now);
	
	return result.changes;
}
