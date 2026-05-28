export type CourseType = 'competency' | 'enrichment' | 'foundational';
export type DeliveryFormat = 'classroom' | 'one_on_one';
export type SchedulingModel = 'fixed_schedule' | 'flexible_appointments';
export type CourseStatus = 'draft' | 'published' | 'active' | 'completed' | 'cancelled';
export type EnrollmentStatus = 'enrolled' | 'completed' | 'dropped' | 'withdrawn';
export type SessionType = 'group' | 'individual';

export interface User {
	uuid: string;
	username: string;
	passwordHash: string;
	displayName: string;
	createdAt: string;
}

export interface Course {
	uuid: string;
	title: string;
	description: string;
	courseType: CourseType;
	deliveryFormat: DeliveryFormat;
	instructorUuid: string;
	durationWeeks: number | null;
	capacity: number;
	schedulingModel: SchedulingModel;
	prerequisites: string | null;
	location: string;
	status: CourseStatus;
	createdAt: string;
}

export interface Enrollment {
	uuid: string;
	courseUuid: string;
	studentUuid: string;
	enrolledAt: string;
	status: EnrollmentStatus;
	completionDate: string | null;
	notes: string | null;
}

export interface Session {
	uuid: string;
	courseUuid: string;
	scheduledAt: string;
	durationMinutes: number;
	location: string | null;
	sessionType: SessionType;
	specificStudentUuid: string | null;
	notes: string | null;
	createdAt: string;
}

export interface Attendance {
	uuid: string;
	sessionUuid: string;
	enrollmentUuid: string;
	attended: boolean;
	recordedAt: string;
}

export interface Credential {
	uuid: string;
	studentUuid: string;
	courseUuid: string;
	issuedAt: string;
	metadata: string;
}
