import { db } from '../../db.js';
import type {
	Referendum,
	ReferendumStatus,
	ReferendumQuestion,
	QuestionOption,
	ReferendumVote,
	QuestionWithOptions,
	ReferendumWithQuestions,
} from './types.js';

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
