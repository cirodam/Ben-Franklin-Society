import { getCourse } from '$lib/server/courses/crud.js';
import { listSessionsForCourse, createSession, deleteSession } from '$lib/server/sessions/crud.js';
import {
	listEnrollmentsForCourse,
	createEnrollment,
	getEnrollmentByStudentAndCourse,
	withdrawEnrollment
} from '$lib/server/enrollments/crud.js';
import { issueCredential } from '$lib/server/credentials/crud.js';
import { error, fail, redirect } from '@sveltejs/kit';
import type { PageServerLoad, Actions } from './$types';

export const load: PageServerLoad = async ({ params, locals }) => {
	const course = getCourse(params.uuid);

	if (!course) {
		throw error(404, 'Course not found');
	}

	const sessions = listSessionsForCourse(params.uuid);
	const enrollments = listEnrollmentsForCourse(params.uuid);
	
	let userEnrollment = undefined;
	if (locals.user) {
		userEnrollment = getEnrollmentByStudentAndCourse(locals.user.uuid, params.uuid);
	}

	return {
		course,
		sessions,
		enrollments,
		userEnrollment,
		isInstructor: locals.user?.uuid === course.instructorUuid
	};
};

export const actions: Actions = {
	scheduleSession: async ({ request, params, locals }) => {
		if (!locals.user) {
			return fail(401, { error: 'You must be logged in' });
		}

		const course = getCourse(params.uuid);
		if (!course) {
			return fail(404, { error: 'Course not found' });
		}

		if (course.instructorUuid !== locals.user.uuid) {
			return fail(403, { error: 'Only the instructor can schedule sessions' });
		}

		const formData = await request.formData();
		const scheduledAt = formData.get('scheduledAt') as string;
		const durationMinutes = parseInt(formData.get('durationMinutes') as string);
		const location = formData.get('location') as string;
		const notes = formData.get('notes') as string;

		if (!scheduledAt || !durationMinutes) {
			return fail(400, { error: 'Date/time and duration are required' });
		}

		try {
			createSession({
				courseUuid: params.uuid,
				scheduledAt: new Date(scheduledAt).toISOString(),
				durationMinutes,
				location: location || undefined,
				sessionType: 'group',
				notes: notes || undefined
			});

			return { success: true };
		} catch (error: any) {
			console.error('Failed to schedule session:', error);
			return fail(500, { error: 'Failed to schedule session' });
		}
	},

	deleteSession: async ({ request, params, locals }) => {
		if (!locals.user) {
			return fail(401, { error: 'You must be logged in' });
		}

		const course = getCourse(params.uuid);
		if (!course) {
			return fail(404, { error: 'Course not found' });
		}

		if (course.instructorUuid !== locals.user.uuid) {
			return fail(403, { error: 'Only the instructor can delete sessions' });
		}

		const formData = await request.formData();
		const sessionUuid = formData.get('sessionUuid') as string;

		if (!sessionUuid) {
			return fail(400, { error: 'Session UUID required' });
		}

		try {
			deleteSession(sessionUuid);
			return { success: true };
		} catch (error: any) {
			console.error('Failed to delete session:', error);
			return fail(500, { error: 'Failed to delete session' });
		}
	},

	enroll: async ({ params, locals }) => {
		if (!locals.user) {
			return fail(401, { error: 'You must be logged in to enroll' });
		}

		const course = getCourse(params.uuid);
		if (!course) {
			return fail(404, { error: 'Course not found' });
		}

		if (course.instructorUuid === locals.user.uuid) {
			return fail(400, { error: 'Instructors cannot enroll in their own courses' });
		}

		try {
			createEnrollment({
				courseUuid: params.uuid,
				studentUuid: locals.user.uuid
			});

			return { success: true, message: 'Successfully enrolled!' };
		} catch (error: any) {
			console.error('Failed to enroll:', error);
			return fail(400, { error: error.message || 'Failed to enroll' });
		}
	},

	withdraw: async ({ params, locals }) => {
		if (!locals.user) {
			return fail(401, { error: 'You must be logged in' });
		}

		const enrollment = getEnrollmentByStudentAndCourse(locals.user.uuid, params.uuid);
		if (!enrollment) {
			return fail(404, { error: 'Enrollment not found' });
		}

		try {
			withdrawEnrollment(enrollment.uuid);
			return { success: true, message: 'Successfully withdrawn' };
		} catch (error: any) {
			console.error('Failed to withdraw:', error);
			return fail(500, { error: 'Failed to withdraw' });
		}
	},

	issueCredential: async ({ request, params, locals }) => {
		if (!locals.user) {
			return fail(401, { error: 'You must be logged in' });
		}

		const course = getCourse(params.uuid);
		if (!course) {
			return fail(404, { error: 'Course not found' });
		}

		if (course.instructorUuid !== locals.user.uuid) {
			return fail(403, { error: 'Only the instructor can issue credentials' });
		}

		const formData = await request.formData();
		const enrollmentUuid = formData.get('enrollmentUuid') as string;

		if (!enrollmentUuid) {
			return fail(400, { error: 'Enrollment UUID required' });
		}

		try {
			issueCredential(enrollmentUuid);
			return { success: true, message: 'Credential issued!' };
		} catch (error: any) {
			console.error('Failed to issue credential:', error);
			return fail(400, { error: error.message || 'Failed to issue credential' });
		}
	}
};
