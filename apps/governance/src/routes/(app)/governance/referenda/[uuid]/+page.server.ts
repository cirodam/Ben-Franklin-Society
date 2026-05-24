import { error, fail, redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types.js';
import {
	getReferendumWithQuestions,
	getVote,
	castVote,
	getReferendumResults,
	autoOpenScheduledReferendums,
	autoCloseOpenReferendums,
} from '$lib/server/governance/referendum/index.js';
import { getCommentCount } from '$lib/server/communications/discussions.js';

export const load: PageServerLoad = async ({ params, locals }) => {
	// Update referendum statuses based on current time
	autoOpenScheduledReferendums();
	autoCloseOpenReferendums();

	const referendum = getReferendumWithQuestions(params.uuid);
	if (!referendum) error(404, 'Referendum not found');

	const actingAs = locals.session?.acting_as_uuid ?? null;

	// If draft, redirect to edit page
	if (referendum.status === 'draft') {
		redirect(302, `/governance/referenda/${params.uuid}/edit`);
	}

	// For open referendums, load user's existing votes
	let userVotes: Record<string, string> = {};
	if (referendum.status === 'open' && actingAs) {
		for (const question of referendum.questions) {
			const vote = getVote(question.uuid, actingAs);
			if (vote) {
				userVotes[question.uuid] = vote.vote_value;
			}
		}
	}

	// For closed referendums, load results
	let results = null;
	if (referendum.status === 'closed') {
		results = getReferendumResults(params.uuid);
	}

	// Get comment counts for each question
	const commentCounts: Record<string, number> = {};
	for (const question of referendum.questions) {
		if (question.thread_uuid) {
			commentCounts[question.uuid] = getCommentCount(question.thread_uuid);
		} else {
			commentCounts[question.uuid] = 0;
		}
	}

	return {
		referendum,
		actingAs,
		userVotes,
		results,
		commentCounts,
	};
};

export const actions: Actions = {
	vote: async ({ request, params, locals }) => {
		const actingAs = locals.session?.acting_as_uuid;
		if (!actingAs) {
			return fail(401, { error: 'You must be logged in to vote' });
		}

		const referendum = getReferendumWithQuestions(params.uuid);
		if (!referendum || referendum.status !== 'open') {
			return fail(400, { error: 'This referendum is not open for voting' });
		}

		const formData = await request.formData();
		const questionUuid = formData.get('question_uuid') as string;
		let voteValue = formData.get('vote_value') as string;

		if (!questionUuid) {
			return fail(400, { error: 'Missing question UUID' });
		}

		// For ranking questions, collect all rank selections and serialize to JSON
		const question = referendum.questions.find(q => q.uuid === questionUuid);
		if (question?.question_type === 'ranking') {
			const rankings: Record<string, number> = {};
			for (const [key, value] of formData.entries()) {
				if (key.startsWith('rank_') && value) {
					const optionUuid = key.replace('rank_', '');
					rankings[optionUuid] = parseInt(value as string);
				}
			}
			voteValue = JSON.stringify(rankings);
		}

		if (!voteValue) {
			return fail(400, { error: 'Missing vote value' });
		}

		try {
			castVote({
				question_uuid: questionUuid,
				person_uuid: actingAs,
				vote_value: voteValue,
			});
			return { success: true };
		} catch (err) {
			return fail(500, { error: 'Failed to cast vote' });
		}
	},
};
