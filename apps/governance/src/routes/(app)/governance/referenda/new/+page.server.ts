import { fail, redirect } from '@sveltejs/kit';
import type { PageServerLoad, Actions } from './$types.js';
import {
	createReferendum,
	createQuestion,
	createQuestionOption,
	type QuestionType,
} from '$lib/server/governance/referendum/index.js';

export const load: PageServerLoad = async ({ locals }) => {
	if (!locals.session) {
		redirect(302, '/login');
	}

	return {};
};

export const actions: Actions = {
	create: async ({ request, locals }) => {
		if (!locals.session) return fail(401, { message: 'Not authenticated' });
		const actingAs = locals.session.acting_as_uuid;

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

		// Create the referendum
		const referendum = createReferendum({
			title,
			description: description || undefined,
			opens_at: opensDate.toISOString(),
			closes_at: closesDate.toISOString(),
			created_by_uuid: actingAs,
		});

		// Parse questions from form data
		// Questions are submitted as: question_text_0, question_type_0, question_description_0, etc.
		const questionIndices = new Set<number>();
		for (const key of data.keys()) {
			const match = key.match(/^question_text_(\d+)$/);
			if (match) {
				questionIndices.add(parseInt(match[1]));
			}
		}

		const questions = Array.from(questionIndices).sort((a, b) => a - b);

		for (const idx of questions) {
			const questionText = String(data.get(`question_text_${idx}`) ?? '').trim();
			const questionType = String(data.get(`question_type_${idx}`) ?? 'yes_no') as QuestionType;
			const questionDescription = String(data.get(`question_description_${idx}`) ?? '').trim();

			if (!questionText) continue; // Skip empty questions

			const question = createQuestion({
				referendum_uuid: referendum.uuid,
				question_text: questionText,
				question_type: questionType,
				description: questionDescription || undefined,
				display_order: idx,
			});

			// If multiple choice or ranking, add options
			if (questionType === 'multiple_choice' || questionType === 'ranking') {
				const optionIndices = new Set<number>();
				for (const key of data.keys()) {
					const match = key.match(new RegExp(`^question_${idx}_option_(\\d+)$`));
					if (match) {
						optionIndices.add(parseInt(match[1]));
					}
				}

				const options = Array.from(optionIndices).sort((a, b) => a - b);
				for (const optIdx of options) {
					const optionText = String(data.get(`question_${idx}_option_${optIdx}`) ?? '').trim();
					if (!optionText) continue;

					createQuestionOption({
						question_uuid: question.uuid,
						option_text: optionText,
						display_order: optIdx,
					});
				}
			}
		}

		redirect(303, '/governance/referenda');
	},
};
