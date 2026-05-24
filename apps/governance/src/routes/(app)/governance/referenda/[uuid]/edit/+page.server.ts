import { error, fail, redirect } from '@sveltejs/kit';
import type { PageServerLoad, Actions } from './$types.js';
import {
	getReferendumWithQuestions,
	updateReferendum,
	updateReferendumStatus,
	createQuestion,
	updateQuestion,
	deleteQuestion,
	createQuestionOption,
	updateQuestionOption,
	deleteQuestionOption,
	deleteReferendum,
	type QuestionType,
} from '$lib/server/governance/referendums.js';

export const load: PageServerLoad = async ({ params, locals }) => {
	if (!locals.session) redirect(302, '/login');

	const referendum = getReferendumWithQuestions(params.uuid);
	if (!referendum) error(404, 'Referendum not found');

	// Only drafts can be edited
	if (referendum.status !== 'draft') {
		redirect(302, `/governance/referenda/${params.uuid}`);
	}

	return {
		referendum,
	};
};

export const actions: Actions = {
	update: async ({ request, params, locals }) => {
		if (!locals.session) return fail(401, { message: 'Not authenticated' });

		const data = await request.formData();
		const title = String(data.get('title') ?? '').trim();
		const description = String(data.get('description') ?? '').trim();
		const opensAt = String(data.get('opens_at') ?? '').trim();
		const closesAt = String(data.get('closes_at') ?? '').trim();

		if (!title) return fail(400, { message: 'Title is required' });
		if (!opensAt) return fail(400, { message: 'Open date is required' });
		if (!closesAt) return fail(400, { message: 'Close date is required' });

		// Validate dates
		const opensDate = new Date(opensAt);
		const closesDate = new Date(closesAt);
		if (closesDate <= opensDate) {
			return fail(400, { message: 'Close date must be after open date' });
		}

		// Update the referendum
		updateReferendum(params.uuid, {
			title,
			description: description || null,
			opens_at: opensDate.toISOString(),
			closes_at: closesDate.toISOString(),
		});

		return { success: true };
	},

	schedule: async ({ params, locals }) => {
		if (!locals.session) return fail(401, { message: 'Not authenticated' });

		// Change status from draft to scheduled
		updateReferendumStatus(params.uuid, 'scheduled');

		redirect(303, `/governance/referenda/${params.uuid}`);
	},

	deleteQuestion: async ({ request, locals }) => {
		if (!locals.session) return fail(401, { message: 'Not authenticated' });

		const data = await request.formData();
		const questionUuid = String(data.get('question_uuid') ?? '');

		if (!questionUuid) return fail(400, { message: 'Question UUID required' });

		deleteQuestion(questionUuid);

		return { success: true };
	},

	addQuestion: async ({ request, params, locals }) => {
		if (!locals.session) return fail(401, { message: 'Not authenticated' });

		const data = await request.formData();
		const questionText = String(data.get('question_text') ?? '').trim();
		const questionType = String(data.get('question_type') ?? 'yes_no') as QuestionType;
		const questionDescription = String(data.get('question_description') ?? '').trim();
		const displayOrder = parseInt(String(data.get('display_order') ?? '0'));

		if (!questionText) return fail(400, { message: 'Question text is required' });

		const question = createQuestion({
			referendum_uuid: params.uuid,
			question_text: questionText,
			question_type: questionType,
			description: questionDescription || undefined,
			display_order: displayOrder,
		});

		// If multiple choice or ranking, add options
		if (questionType === 'multiple_choice' || questionType === 'ranking') {
			const optionIndices = new Set<number>();
			for (const key of data.keys()) {
				const match = key.match(/^option_(\d+)$/);
				if (match) {
					optionIndices.add(parseInt(match[1]));
				}
			}

			const options = Array.from(optionIndices).sort((a, b) => a - b);
			for (const optIdx of options) {
				const optionText = String(data.get(`option_${optIdx}`) ?? '').trim();
				if (!optionText) continue;

				createQuestionOption({
					question_uuid: question.uuid,
					option_text: optionText,
					display_order: optIdx,
				});
			}
		}

		return { success: true };
	},

	updateQuestion: async ({ request, locals }) => {
		if (!locals.session) return fail(401, { message: 'Not authenticated' });

		const data = await request.formData();
		const questionUuid = String(data.get('question_uuid') ?? '');
		const questionText = String(data.get('question_text') ?? '').trim();
		const questionDescription = String(data.get('question_description') ?? '').trim();

		if (!questionUuid) return fail(400, { message: 'Question UUID required' });
		if (!questionText) return fail(400, { message: 'Question text is required' });

		updateQuestion(questionUuid, {
			question_text: questionText,
			description: questionDescription || null,
		});

		return { success: true };
	},

	deleteOption: async ({ request, locals }) => {
		if (!locals.session) return fail(401, { message: 'Not authenticated' });

		const data = await request.formData();
		const optionUuid = String(data.get('option_uuid') ?? '');

		if (!optionUuid) return fail(400, { message: 'Option UUID required' });

		deleteQuestionOption(optionUuid);

		return { success: true };
	},

	addOption: async ({ request, locals }) => {
		if (!locals.session) return fail(401, { message: 'Not authenticated' });

		const data = await request.formData();
		const questionUuid = String(data.get('question_uuid') ?? '');
		const optionText = String(data.get('option_text') ?? '').trim();
		const displayOrder = parseInt(String(data.get('display_order') ?? '0'));

		if (!questionUuid) return fail(400, { message: 'Question UUID required' });
		if (!optionText) return fail(400, { message: 'Option text is required' });

		createQuestionOption({
			question_uuid: questionUuid,
			option_text: optionText,
			display_order: displayOrder,
		});

		return { success: true };
	},

	updateOption: async ({ request, locals }) => {
		if (!locals.session) return fail(401, { message: 'Not authenticated' });

		const data = await request.formData();
		const optionUuid = String(data.get('option_uuid') ?? '');
		const optionText = String(data.get('option_text') ?? '').trim();

		if (!optionUuid) return fail(400, { message: 'Option UUID required' });
		if (!optionText) return fail(400, { message: 'Option text is required' });

		updateQuestionOption(optionUuid, {
			option_text: optionText,
		});

		return { success: true };
	},

	delete: async ({ params, locals }) => {
		if (!locals.session) return fail(401, { message: 'Not authenticated' });

		try {
			deleteReferendum(params.uuid);
		} catch (err) {
			return fail(400, { message: err instanceof Error ? err.message : 'Failed to delete referendum' });
		}

		redirect(303, '/governance/referenda');
	},
};
