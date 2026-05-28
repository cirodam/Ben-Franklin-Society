import { db } from '../db.js';
import { nanoid } from 'nanoid';
import type { Attendance } from '$lib/types.js';
import { listEnrollmentsForCourse } from '../enrollments/crud.js';

export interface CreateAttendanceInput {
	sessionUuid: string;
	enrollmentUuid: string;
	attended: boolean;
}

export function recordAttendance(input: CreateAttendanceInput): Attendance {
	// Check if attendance already recorded
	const existing = getAttendance(input.sessionUuid, input.enrollmentUuid);
	if (existing) {
		// Update existing record
		updateAttendance(existing.uuid, input.attended);
		return getAttendanceById(existing.uuid)!;
	}

	const uuid = nanoid();
	const now = new Date().toISOString();

	const stmt = db.prepare(`
		INSERT INTO attendance (
			uuid, session_uuid, enrollment_uuid, attended, recorded_at
		) VALUES (?, ?, ?, ?, ?)
	`);

	stmt.run(
		uuid,
		input.sessionUuid,
		input.enrollmentUuid,
		input.attended ? 1 : 0,
		now
	);

	return getAttendanceById(uuid)!;
}

export function getAttendanceById(uuid: string): Attendance | undefined {
	const stmt = db.prepare(`
		SELECT * FROM attendance WHERE uuid = ?
	`);

	const row = stmt.get(uuid) as any;
	if (!row) return undefined;

	return {
		uuid: row.uuid,
		sessionUuid: row.session_uuid,
		enrollmentUuid: row.enrollment_uuid,
		attended: Boolean(row.attended),
		recordedAt: row.recorded_at
	};
}

export function getAttendance(sessionUuid: string, enrollmentUuid: string): Attendance | undefined {
	const stmt = db.prepare(`
		SELECT * FROM attendance 
		WHERE session_uuid = ? AND enrollment_uuid = ?
	`);

	const row = stmt.get(sessionUuid, enrollmentUuid) as any;
	if (!row) return undefined;

	return {
		uuid: row.uuid,
		sessionUuid: row.session_uuid,
		enrollmentUuid: row.enrollment_uuid,
		attended: Boolean(row.attended),
		recordedAt: row.recorded_at
	};
}

export function listAttendanceForSession(sessionUuid: string): Attendance[] {
	const stmt = db.prepare(`
		SELECT * FROM attendance 
		WHERE session_uuid = ?
		ORDER BY recorded_at DESC
	`);

	const rows = stmt.all(sessionUuid) as any[];

	return rows.map(row => ({
		uuid: row.uuid,
		sessionUuid: row.session_uuid,
		enrollmentUuid: row.enrollment_uuid,
		attended: Boolean(row.attended),
		recordedAt: row.recorded_at
	}));
}

export function listAttendanceForEnrollment(enrollmentUuid: string): Attendance[] {
	const stmt = db.prepare(`
		SELECT * FROM attendance 
		WHERE enrollment_uuid = ?
		ORDER BY recorded_at DESC
	`);

	const rows = stmt.all(enrollmentUuid) as any[];

	return rows.map(row => ({
		uuid: row.uuid,
		sessionUuid: row.session_uuid,
		enrollmentUuid: row.enrollment_uuid,
		attended: Boolean(row.attended),
		recordedAt: row.recorded_at
	}));
}

export function updateAttendance(uuid: string, attended: boolean): void {
	const stmt = db.prepare(`
		UPDATE attendance SET attended = ? WHERE uuid = ?
	`);

	stmt.run(attended ? 1 : 0, uuid);
}

export function bulkRecordAttendance(sessionUuid: string, courseUuid: string, attendedStudentUuids: string[]): void {
	const enrollments = listEnrollmentsForCourse(courseUuid).filter(e => e.status === 'enrolled');
	
	for (const enrollment of enrollments) {
		const attended = attendedStudentUuids.includes(enrollment.studentUuid);
		recordAttendance({
			sessionUuid,
			enrollmentUuid: enrollment.uuid,
			attended
		});
	}
}

export function getAttendanceStats(enrollmentUuid: string): { totalSessions: number; attended: number } {
	const attendances = listAttendanceForEnrollment(enrollmentUuid);
	return {
		totalSessions: attendances.length,
		attended: attendances.filter(a => a.attended).length
	};
}
