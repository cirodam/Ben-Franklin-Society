import { listCredentialsForStudent } from '$lib/server/credentials/crud.js';
import { getCourse } from '$lib/server/courses/crud.js';
import { redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals }) => {
	if (!locals.user) {
		throw redirect(303, '/login');
	}

	const credentials = listCredentialsForStudent(locals.user.uuid);
	
	// Fetch course details for each credential
	const credentialsWithCourses = credentials.map(credential => {
		const course = getCourse(credential.courseUuid);
		const metadata = JSON.parse(credential.metadata);
		return course ? { credential, course, metadata } : null;
	}).filter(item => item !== null);

	return {
		credentials: credentialsWithCourses
	};
};
