import { randomUUID } from 'crypto';
import { db } from '../db.js';

export type ReferendumStatus = 'draft' | 'open' | 'closed';
export type QuestionType = 'yes_no' | 'multiple_choice' | 'ranking';

export interface Referendum {
	uuid: string;
	title: string;
	description: string | null;
	opens_at: string;
	closes_at: string;
	status: ReferendumStatus;
	created_by_uuid: string;
	created_at: string;
	closed_at: string | null;
}

export interface ReferendumQuestion {
	uuid: string;
	referendum_uuid: string;
	question_text: string;
	question_type: QuestionType;
	description: string | null;
	display_order: number;
	created_at: string;
}

export interface QuestionOption {
	uuid: string;
	question_uuid: string;
	option_text: string;
	display_order: number;
}

export interface ReferendumVote {
	uuid: string;
	question_uuid: string;
	person_uuid: string;
	vote_value: string; // JSON string for flexibility
	voted_at: string;
}

export interface QuestionWithOptions extends ReferendumQuestion {
	options: QuestionOption[];
}

export interface ReferendumWithQuestions extends Referendum {
	questions: QuestionWithOptions[];
}

export interface VoteResult {
	question_uuid: string;
	question_text: string;
	question_type: QuestionType;
	total_votes: number;
	results: any; // Flexible based on question type
}

/**
 * Get a referendum by UUID
 */
export function getReferendumByUuid(uuid: string): Referendum | null {
	const stmt = db.prepare('SELECT * FROM referendum WHERE uuid = ?');
	return (stmt.get(uuid) as Referendum | undefined) ?? null;
}

/**
 * List all referendums with optional status filter
 */
export function listReferendums(opts: { status?: ReferendumStatus } = {}): Referendum[] {
	let sql = 'SELECT * FROM referendum WHERE 1=1';
	const params: any[] = [];

	if (opts.status) {
		sql += ' AND status = ?';
		params.push(opts.status);
	}

	sql += ' ORDER BY opens_at DESC';

	const stmt = db.prepare(sql);
	return stmt.all(...params) as Referendum[];
}

/**
 * Get referendum with all questions and options
 */
export function getReferendumWithQuestions(uuid: string): ReferendumWithQuestions | null {
	const referendum = getReferendumByUuid(uuid);
	if (!referendum) return null;

	const questions = getQuestionsByReferendum(uuid);
	const questionsWithOptions: QuestionWithOptions[] = questions.map((q) => ({
		...q,
		options: getQuestionOptions(q.uuid),
	}));

	return {
		...referendum,
		questions: questionsWithOptions,
	};
}

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
 * Get questions for a referendum
 */
export function getQuestionsByReferendum(referendumUuid: string): ReferendumQuestion[] {
	const stmt = db.prepare(`
		SELECT * FROM referendum_question 
		WHERE referendum_uuid = ? 
		ORDER BY display_order
	`);
	return stmt.all(referendumUuid) as ReferendumQuestion[];
}

/**
 * Get a single question by UUID
 */
export function getQuestionByUuid(uuid: string): ReferendumQuestion | null {
	const stmt = db.prepare('SELECT * FROM referendum_question WHERE uuid = ?');
	return (stmt.get(uuid) as ReferendumQuestion | undefined) ?? null;
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

	const stmt = db.prepare(`
		INSERT INTO referendum_question (uuid, referendum_uuid, question_text, question_type, description, display_order, created_at)
		VALUES (?, ?, ?, ?, ?, ?, ?)
	`);

	stmt.run(
		uuid,
		input.referendum_uuid,
		input.question_text,
		input.question_type,
		input.description ?? null,
		input.display_order,
		now
	);

	return getQuestionByUuid(uuid)!;
}

/**
 * Get options for a question
 */
export function getQuestionOptions(questionUuid: string): QuestionOption[] {
	const stmt = db.prepare(`
		SELECT * FROM referendum_question_option 
		WHERE question_uuid = ? 
		ORDER BY display_order
	`);
	return stmt.all(questionUuid) as QuestionOption[];
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
 * Check if a person has voted on a question
 */
export function hasVoted(questionUuid: string, personUuid: string): boolean {
	const stmt = db.prepare(`
		SELECT 1 FROM referendum_vote 
		WHERE question_uuid = ? AND person_uuid = ?
	`);
	return !!stmt.get(questionUuid, personUuid);
}

/**
 * Get vote for a person on a question
 */
export function getVote(questionUuid: string, personUuid: string): ReferendumVote | null {
	const stmt = db.prepare(`
		SELECT * FROM referendum_vote 
		WHERE question_uuid = ? AND person_uuid = ?
	`);
	return (stmt.get(questionUuid, personUuid) as ReferendumVote | undefined) ?? null;
}

/**
 * Get results for a question
 */
export function getQuestionResults(questionUuid: string): VoteResult {
	const question = getQuestionByUuid(questionUuid);
	if (!question) throw new Error('Question not found');

	const stmt = db.prepare(`
		SELECT vote_value FROM referendum_vote 
		WHERE question_uuid = ?
	`);
	const votes = stmt.all(questionUuid) as { vote_value: string }[];
	const total_votes = votes.length;

	let results: any = {};

	if (question.question_type === 'yes_no') {
		const tally = { yes: 0, no: 0, abstain: 0 };
		votes.forEach((v) => {
			const value = JSON.parse(v.vote_value);
			if (value === 'yes') tally.yes++;
			else if (value === 'no') tally.no++;
			else if (value === 'abstain') tally.abstain++;
		});
		results = tally;
	} else if (question.question_type === 'multiple_choice') {
		const options = getQuestionOptions(questionUuid);
		const tally: Record<string, number> = {};
		options.forEach((opt) => {
			tally[opt.uuid] = 0;
		});

		votes.forEach((v) => {
			const value = JSON.parse(v.vote_value);
			if (tally[value] !== undefined) {
				tally[value]++;
			}
		});
		results = tally;
	} else if (question.question_type === 'ranking') {
		// For ranking, store raw vote data for now
		results = votes.map((v) => JSON.parse(v.vote_value));
	}

	return {
		question_uuid: questionUuid,
		question_text: question.question_text,
		question_type: question.question_type,
		total_votes,
		results,
	};
}

/**
 * Get all results for a referendum
 */
export function getReferendumResults(referendumUuid: string): VoteResult[] {
	const questions = getQuestionsByReferendum(referendumUuid);
	return questions.map((q) => getQuestionResults(q.uuid));
}
