import { listCourses } from '$lib/server/courses/crud.js';
import { listEnrollmentsForCourse } from '$lib/server/enrollments/crud.js';
import { redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals }) => {
	if (!locals.user) {
		throw redirect(303, '/login');
	}

	const courses = listCourses({ instructorUuid: locals.user.uuid });
	
	// Add enrollment counts to each course
	const coursesWithData = courses.map(course => {
		const enrollments = listEnrollmentsForCourse(course.uuid);
		const activeEnrollments = enrollments.filter(e => e.status === 'enrolled').length;
		return { course, activeEnrollments };
	});

	return {
		courses: coursesWithData
	};
};
