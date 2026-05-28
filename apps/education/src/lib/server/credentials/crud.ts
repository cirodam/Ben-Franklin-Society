import { db } from '../db.js';
import { nanoid } from 'nanoid';
import type { Credential } from '$lib/types.js';
import { getEnrollment, updateEnrollmentStatus } from '../enrollments/crud.js';
import { getAttendanceStats } from '../attendance/crud.js';

export interface CreateCredentialInput {
	studentUuid: string;
	courseUuid: string;
	metadata?: Record<string, any>;
}

export function issueCredential(enrollmentUuid: string): Credential {
	const enrollment = getEnrollment(enrollmentUuid);
	if (!enrollment) {
		throw new Error('Enrollment not found');
	}

	if (enrollment.status !== 'enrolled') {
		throw new Error('Can only issue credential for active enrollment');
	}

	// Check if credential already exists
	const existing = getCredentialByStudentAndCourse(enrollment.studentUuid, enrollment.courseUuid);
	if (existing) {
		throw new Error('Credential already issued for this course');
	}

	// Get attendance stats
	const attendanceStats = getAttendanceStats(enrollmentUuid);

	const uuid = nanoid();
	const now = new Date().toISOString();

	const metadata = JSON.stringify({
		enrollmentUuid,
		totalSessions: attendanceStats.totalSessions,
		sessionsAttended: attendanceStats.attended,
		completedAt: now
	});

	const stmt = db.prepare(`
		INSERT INTO credential (
			uuid, student_uuid, course_uuid, issued_at, metadata
		) VALUES (?, ?, ?, ?, ?)
	`);

	stmt.run(
		uuid,
		enrollment.studentUuid,
		enrollment.courseUuid,
		now,
		metadata
	);

	// Mark enrollment as completed
	updateEnrollmentStatus(enrollmentUuid, 'completed', now);

	return getCredential(uuid)!;
}

export function getCredential(uuid: string): Credential | undefined {
	const stmt = db.prepare(`
		SELECT * FROM credential WHERE uuid = ?
	`);

	const row = stmt.get(uuid) as any;
	if (!row) return undefined;

	return {
		uuid: row.uuid,
		studentUuid: row.student_uuid,
		courseUuid: row.course_uuid,
		issuedAt: row.issued_at,
		metadata: row.metadata
	};
}

export function getCredentialByStudentAndCourse(
	studentUuid: string,
	courseUuid: string
): Credential | undefined {
	const stmt = db.prepare(`
		SELECT * FROM credential 
		WHERE student_uuid = ? AND course_uuid = ?
	`);

	const row = stmt.get(studentUuid, courseUuid) as any;
	if (!row) return undefined;

	return {
		uuid: row.uuid,
		studentUuid: row.student_uuid,
		courseUuid: row.course_uuid,
		issuedAt: row.issued_at,
		metadata: row.metadata
	};
}

export function listCredentialsForStudent(studentUuid: string): Credential[] {
	const stmt = db.prepare(`
		SELECT * FROM credential 
		WHERE student_uuid = ?
		ORDER BY issued_at DESC
	`);

	const rows = stmt.all(studentUuid) as any[];

	return rows.map(row => ({
		uuid: row.uuid,
		studentUuid: row.student_uuid,
		courseUuid: row.course_uuid,
		issuedAt: row.issued_at,
		metadata: row.metadata
	}));
}

export function listCredentialsForCourse(courseUuid: string): Credential[] {
	const stmt = db.prepare(`
		SELECT * FROM credential 
		WHERE course_uuid = ?
		ORDER BY issued_at DESC
	`);

	const rows = stmt.all(courseUuid) as any[];

	return rows.map(row => ({
		uuid: row.uuid,
		studentUuid: row.student_uuid,
		courseUuid: row.course_uuid,
		issuedAt: row.issued_at,
		metadata: row.metadata
	}));
}
