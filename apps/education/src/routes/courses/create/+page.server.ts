import { createCourse } from '$lib/server/courses/crud.js';
import { redirect, fail } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals }) => {
	if (!locals.user) {
		throw redirect(303, '/login');
	}
	return {};
};

export const actions: Actions = {
	default: async ({ request, locals }) => {
		if (!locals.user) {
			return fail(401, { error: 'You must be logged in to create a course' });
		}
		const formData = await request.formData();

		const title = formData.get('title') as string;
		const description = formData.get('description') as string;
		const courseType = formData.get('courseType') as any;
		const deliveryFormat = formData.get('deliveryFormat') as any;
		const location = formData.get('location') as string;
		const capacity = parseInt(formData.get('capacity') as string);
		const durationWeeks = formData.get('durationWeeks') ? parseInt(formData.get('durationWeeks') as string) : undefined;
		const prerequisites = formData.get('prerequisites') as string;

		if (!title || !description || !courseType || !deliveryFormat || !location) {
			return fail(400, { error: 'Missing required fields' });
		}

		try {
			const instructorUuid = locals.user.uuid;

			const schedulingModel = deliveryFormat === 'classroom' ? 'fixed_schedule' : 'flexible_appointments';

			const course = createCourse({
				title,
				description,
				courseType,
				deliveryFormat,
				instructorUuid,
				durationWeeks,
				capacity,
				schedulingModel,
				prerequisites: prerequisites || undefined,
				location
			});

			throw redirect(303, `/courses/${course.uuid}`);
		} catch (error) {
			if (error instanceof Response) throw error;
			console.error('Failed to create course:', error);
			return fail(500, { error: 'Failed to create course' });
		}
	}
};
