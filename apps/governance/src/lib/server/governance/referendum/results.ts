import { db } from '../../db.js';
import { getQuestionByUuid, getQuestionOptions, getQuestionsByReferendum } from './queries.js';
import type { VoteResult } from './types.js';

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
