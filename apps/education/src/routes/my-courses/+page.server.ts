import { listEnrollmentsForStudent } from '$lib/server/enrollments/crud.js';
import { getCourse } from '$lib/server/courses/crud.js';
import { redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals }) => {
	if (!locals.user) {
		throw redirect(303, '/login');
	}

	const enrollments = listEnrollmentsForStudent(locals.user.uuid);
	
	// Fetch course details for each enrollment
	const enrolledCourses = enrollments
		.filter(e => e.status === 'enrolled' || e.status === 'completed')
		.map(enrollment => {
			const course = getCourse(enrollment.courseUuid);
			return course ? { enrollment, course } : null;
		})
		.filter(item => item !== null);

	return {
		enrolledCourses
	};
};
