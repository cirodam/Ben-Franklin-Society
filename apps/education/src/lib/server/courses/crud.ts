import { db } from '../db.js';
import { nanoid } from 'nanoid';
import type { Course, CourseType, DeliveryFormat, SchedulingModel, CourseStatus } from '$lib/types.js';

export interface CreateCourseInput {
	title: string;
	description: string;
	courseType: CourseType;
	deliveryFormat: DeliveryFormat;
	instructorUuid: string;
	durationWeeks?: number;
	capacity: number;
	schedulingModel: SchedulingModel;
	prerequisites?: string;
	location: string;
}

export function createCourse(input: CreateCourseInput): Course {
	const uuid = nanoid();
	const now = new Date().toISOString();

	const stmt = db.prepare(`
		INSERT INTO course (
			uuid, title, description, course_type, delivery_format,
			instructor_uuid, duration_weeks, capacity, scheduling_model,
			prerequisites, location, status, created_at
		) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
	`);

	stmt.run(
		uuid,
		input.title,
		input.description,
		input.courseType,
		input.deliveryFormat,
		input.instructorUuid,
		input.durationWeeks || null,
		input.capacity,
		input.schedulingModel,
		input.prerequisites || null,
		input.location,
		'draft',
		now
	);

	return getCourse(uuid)!;
}

export function getCourse(uuid: string): Course | undefined {
	const stmt = db.prepare(`
		SELECT * FROM course WHERE uuid = ?
	`);

	const row = stmt.get(uuid) as any;
	if (!row) return undefined;

	return {
		uuid: row.uuid,
		title: row.title,
		description: row.description,
		courseType: row.course_type,
		deliveryFormat: row.delivery_format,
		instructorUuid: row.instructor_uuid,
		durationWeeks: row.duration_weeks,
		capacity: row.capacity,
		schedulingModel: row.scheduling_model,
		prerequisites: row.prerequisites,
		location: row.location,
		status: row.status,
		createdAt: row.created_at
	};
}

export function listCourses(filters?: {
	status?: CourseStatus;
	courseType?: CourseType;
	instructorUuid?: string;
}): Course[] {
	let query = 'SELECT * FROM course WHERE 1=1';
	const params: any[] = [];

	if (filters?.status) {
		query += ' AND status = ?';
		params.push(filters.status);
	}

	if (filters?.courseType) {
		query += ' AND course_type = ?';
		params.push(filters.courseType);
	}

	if (filters?.instructorUuid) {
		query += ' AND instructor_uuid = ?';
		params.push(filters.instructorUuid);
	}

	query += ' ORDER BY created_at DESC';

	const stmt = db.prepare(query);
	const rows = stmt.all(...params) as any[];

	return rows.map(row => ({
		uuid: row.uuid,
		title: row.title,
		description: row.description,
		courseType: row.course_type,
		deliveryFormat: row.delivery_format,
		instructorUuid: row.instructor_uuid,
		durationWeeks: row.duration_weeks,
		capacity: row.capacity,
		schedulingModel: row.scheduling_model,
		prerequisites: row.prerequisites,
		location: row.location,
		status: row.status,
		createdAt: row.created_at
	}));
}

export function updateCourseStatus(uuid: string, status: CourseStatus): void {
	const stmt = db.prepare(`
		UPDATE course SET status = ? WHERE uuid = ?
	`);

	stmt.run(status, uuid);
}

export function deleteCourse(uuid: string): void {
	const stmt = db.prepare(`
		DELETE FROM course WHERE uuid = ?
	`);

	stmt.run(uuid);
}
