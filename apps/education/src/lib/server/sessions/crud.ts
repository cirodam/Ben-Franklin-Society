import { db } from '../db.js';
import { nanoid } from 'nanoid';
import type { Session, SessionType } from '$lib/types.js';

export interface CreateSessionInput {
	courseUuid: string;
	scheduledAt: string; // ISO date string
	durationMinutes: number;
	location?: string;
	sessionType: SessionType;
	specificStudentUuid?: string; // for one-on-one sessions
	notes?: string;
}

export function createSession(input: CreateSessionInput): Session {
	const uuid = nanoid();
	const now = new Date().toISOString();

	const stmt = db.prepare(`
		INSERT INTO session (
			uuid, course_uuid, scheduled_at, duration_minutes,
			location, session_type, specific_student_uuid, notes, created_at
		) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
	`);

	stmt.run(
		uuid,
		input.courseUuid,
		input.scheduledAt,
		input.durationMinutes,
		input.location || null,
		input.sessionType,
		input.specificStudentUuid || null,
		input.notes || null,
		now
	);

	return getSession(uuid)!;
}

export function getSession(uuid: string): Session | undefined {
	const stmt = db.prepare(`
		SELECT * FROM session WHERE uuid = ?
	`);

	const row = stmt.get(uuid) as any;
	if (!row) return undefined;

	return {
		uuid: row.uuid,
		courseUuid: row.course_uuid,
		scheduledAt: row.scheduled_at,
		durationMinutes: row.duration_minutes,
		location: row.location,
		sessionType: row.session_type,
		specificStudentUuid: row.specific_student_uuid,
		notes: row.notes,
		createdAt: row.created_at
	};
}

export function listSessionsForCourse(courseUuid: string): Session[] {
	const stmt = db.prepare(`
		SELECT * FROM session 
		WHERE course_uuid = ?
		ORDER BY scheduled_at ASC
	`);

	const rows = stmt.all(courseUuid) as any[];

	return rows.map(row => ({
		uuid: row.uuid,
		courseUuid: row.course_uuid,
		scheduledAt: row.scheduled_at,
		durationMinutes: row.duration_minutes,
		location: row.location,
		sessionType: row.session_type,
		specificStudentUuid: row.specific_student_uuid,
		notes: row.notes,
		createdAt: row.created_at
	}));
}

export function deleteSession(uuid: string): void {
	const stmt = db.prepare(`
		DELETE FROM session WHERE uuid = ?
	`);

	stmt.run(uuid);
}

export function updateSession(uuid: string, updates: Partial<CreateSessionInput>): void {
	const fields: string[] = [];
	const values: any[] = [];

	if (updates.scheduledAt !== undefined) {
		fields.push('scheduled_at = ?');
		values.push(updates.scheduledAt);
	}

	if (updates.durationMinutes !== undefined) {
		fields.push('duration_minutes = ?');
		values.push(updates.durationMinutes);
	}

	if (updates.location !== undefined) {
		fields.push('location = ?');
		values.push(updates.location);
	}

	if (updates.notes !== undefined) {
		fields.push('notes = ?');
		values.push(updates.notes);
	}

	if (fields.length === 0) return;

	values.push(uuid);

	const stmt = db.prepare(`
		UPDATE session SET ${fields.join(', ')} WHERE uuid = ?
	`);

	stmt.run(...values);
}
