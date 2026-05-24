export type ReferendumStatus = 'draft' | 'scheduled' | 'open' | 'closed';
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
	thread_uuid: string | null;
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
