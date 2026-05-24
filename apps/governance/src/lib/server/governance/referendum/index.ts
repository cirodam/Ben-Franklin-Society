// Re-export all types
export type {
	ReferendumStatus,
	QuestionType,
	Referendum,
	ReferendumQuestion,
	QuestionOption,
	ReferendumVote,
	QuestionWithOptions,
	ReferendumWithQuestions,
	VoteResult,
} from './types.js';

// Re-export query functions
export {
	getReferendumByUuid,
	listReferendums,
	getReferendumWithQuestions,
	getQuestionsByReferendum,
	getQuestionByUuid,
	getQuestionOptions,
	hasVoted,
	getVote,
} from './queries.js';

// Re-export mutation functions
export {
	createReferendum,
	updateReferendum,
	updateReferendumStatus,
	createQuestion,
	updateQuestion,
	deleteQuestion,
	createQuestionOption,
	updateQuestionOption,
	deleteQuestionOption,
	castVote,
	deleteReferendum,
	autoOpenScheduledReferendums,
	autoCloseOpenReferendums,
} from './mutations.js';

// Re-export result functions
export { getQuestionResults, getReferendumResults } from './results.js';
