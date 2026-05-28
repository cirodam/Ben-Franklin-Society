import { listCourses } from '$lib/server/courses/crud.js';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async () => {
	const courses = listCourses();

	return {
		courses
	};
};
