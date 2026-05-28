import { getCourse } from '$lib/server/courses/crud.js';
import { getSession } from '$lib/server/sessions/crud.js';
import { listEnrollmentsForCourse } from '$lib/server/enrollments/crud.js';
import { listAttendanceForSession, bulkRecordAttendance } from '$lib/server/attendance/crud.js';
import { getUser } from '$lib/server/auth.js';
import { error, fail, redirect } from '@sveltejs/kit';
import type { PageServerLoad, Actions } from './$types';

export const load: PageServerLoad = async ({ params, locals }) => {
	if (!locals.user) {
		throw redirect(303, '/login');
	}

	const session = getSession(params.sessionUuid);
	if (!session) {
		throw error(404, 'Session not found');
	}

	const course = getCourse(session.courseUuid);
	if (!course) {
		throw error(404, 'Course not found');
	}

	if (course.instructorUuid !== locals.user.uuid) {
		throw error(403, 'Only the instructor can mark attendance');
	}

	const enrollments = listEnrollmentsForCourse(course.uuid).filter(e => e.status === 'enrolled');
	const attendances = listAttendanceForSession(params.sessionUuid);

	// Combine enrollment and attendance data with user info
	const studentsWithAttendance = enrollments.map(enrollment => {
		const attendance = attendances.find(a => a.enrollmentUuid === enrollment.uuid);
		const user = getUser(enrollment.studentUuid);
		return {
			enrollment,
			attendance,
			user
		};
	});

	return {
		course,
		session,
		studentsWithAttendance
	};
};

export const actions: Actions = {
	default: async ({ request, params, locals }) => {
		if (!locals.user) {
			return fail(401, { error: 'You must be logged in' });
		}

		const session = getSession(params.sessionUuid);
		if (!session) {
			return fail(404, { error: 'Session not found' });
		}

		const course = getCourse(session.courseUuid);
		if (!course) {
			return fail(404, { error: 'Course not found' });
		}

		if (course.instructorUuid !== locals.user.uuid) {
			return fail(403, { error: 'Only the instructor can mark attendance' });
		}

		const formData = await request.formData();
		const attendedStudentUuids = formData.getAll('attended') as string[];

		try {
			bulkRecordAttendance(params.sessionUuid, course.uuid, attendedStudentUuids);
			return { success: true };
		} catch (error: any) {
			console.error('Failed to record attendance:', error);
			return fail(500, { error: 'Failed to record attendance' });
		}
	}
};
