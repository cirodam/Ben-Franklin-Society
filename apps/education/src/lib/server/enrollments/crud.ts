import { db } from '../db.js';
import { nanoid } from 'nanoid';
import type { Enrollment, EnrollmentStatus } from '$lib/types.js';
import { getCourse } from '../courses/crud.js';

export interface CreateEnrollmentInput {
	courseUuid: string;
	studentUuid: string;
	notes?: string;
}

export function createEnrollment(input: CreateEnrollmentInput): Enrollment {
	// Check capacity
	const course = getCourse(input.courseUuid);
	if (!course) {
		throw new Error('Course not found');
	}

	const currentEnrollments = countEnrollments(input.courseUuid);
	if (currentEnrollments >= course.capacity) {
		throw new Error('Course is at capacity');
	}

	// Check if already enrolled
	const existing = getEnrollmentByStudentAndCourse(input.studentUuid, input.courseUuid);
	if (existing && existing.status === 'enrolled') {
		throw new Error('Already enrolled in this course');
	}

	const uuid = nanoid();
	const now = new Date().toISOString();

	const stmt = db.prepare(`
		INSERT INTO enrollment (
			uuid, course_uuid, student_uuid, enrolled_at,
			status, notes
		) VALUES (?, ?, ?, ?, ?, ?)
	`);

	stmt.run(
		uuid,
		input.courseUuid,
		input.studentUuid,
		now,
		'enrolled',
		input.notes || null
	);

	return getEnrollment(uuid)!;
}

export function getEnrollment(uuid: string): Enrollment | undefined {
	const stmt = db.prepare(`
		SELECT * FROM enrollment WHERE uuid = ?
	`);

	const row = stmt.get(uuid) as any;
	if (!row) return undefined;

	return {
		uuid: row.uuid,
		courseUuid: row.course_uuid,
		studentUuid: row.student_uuid,
		enrolledAt: row.enrolled_at,
		status: row.status,
		completionDate: row.completion_date,
		notes: row.notes
	};
}

export function getEnrollmentByStudentAndCourse(
	studentUuid: string,
	courseUuid: string
): Enrollment | undefined {
	const stmt = db.prepare(`
		SELECT * FROM enrollment 
		WHERE student_uuid = ? AND course_uuid = ?
		ORDER BY enrolled_at DESC
		LIMIT 1
	`);

	const row = stmt.get(studentUuid, courseUuid) as any;
	if (!row) return undefined;

	return {
		uuid: row.uuid,
		courseUuid: row.course_uuid,
		studentUuid: row.student_uuid,
		enrolledAt: row.enrolled_at,
		status: row.status,
		completionDate: row.completion_date,
		notes: row.notes
	};
}

export function listEnrollmentsForCourse(courseUuid: string): Enrollment[] {
	const stmt = db.prepare(`
		SELECT * FROM enrollment 
		WHERE course_uuid = ?
		ORDER BY enrolled_at DESC
	`);

	const rows = stmt.all(courseUuid) as any[];

	return rows.map(row => ({
		uuid: row.uuid,
		courseUuid: row.course_uuid,
		studentUuid: row.student_uuid,
		enrolledAt: row.enrolled_at,
		status: row.status,
		completionDate: row.completion_date,
		notes: row.notes
	}));
}

export function listEnrollmentsForStudent(studentUuid: string): Enrollment[] {
	const stmt = db.prepare(`
		SELECT * FROM enrollment 
		WHERE student_uuid = ?
		ORDER BY enrolled_at DESC
	`);

	const rows = stmt.all(studentUuid) as any[];

	return rows.map(row => ({
		uuid: row.uuid,
		courseUuid: row.course_uuid,
		studentUuid: row.student_uuid,
		enrolledAt: row.enrolled_at,
		status: row.status,
		completionDate: row.completion_date,
		notes: row.notes
	}));
}

export function countEnrollments(courseUuid: string, status: EnrollmentStatus = 'enrolled'): number {
	const stmt = db.prepare(`
		SELECT COUNT(*) as count 
		FROM enrollment 
		WHERE course_uuid = ? AND status = ?
	`);

	const row = stmt.get(courseUuid, status) as any;
	return row.count;
}

export function updateEnrollmentStatus(
	uuid: string,
	status: EnrollmentStatus,
	completionDate?: string
): void {
	const stmt = db.prepare(`
		UPDATE enrollment 
		SET status = ?, completion_date = ?
		WHERE uuid = ?
	`);

	stmt.run(status, completionDate || null, uuid);
}

export function withdrawEnrollment(uuid: string): void {
	updateEnrollmentStatus(uuid, 'withdrawn');
}
