#!/usr/bin/env node
import Database from 'better-sqlite3';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const dbPath = process.env.DB_PATH || join(__dirname, '..', '..', 'dev.sqlite');
const db = new Database(dbPath);

console.log(`Initializing database at: ${dbPath}`);

// Enable foreign keys
db.pragma('foreign_keys = ON');

// Create tables
db.exec(`
  CREATE TABLE IF NOT EXISTS user (
    uuid TEXT PRIMARY KEY,
    username TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    display_name TEXT NOT NULL,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE INDEX IF NOT EXISTS idx_user_username ON user(username);

  CREATE TABLE IF NOT EXISTS course (
    uuid TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    course_type TEXT NOT NULL CHECK(course_type IN ('competency', 'enrichment', 'foundational')),
    delivery_format TEXT NOT NULL CHECK(delivery_format IN ('classroom', 'one_on_one')),
    instructor_uuid TEXT NOT NULL,
    duration_weeks INTEGER,
    capacity INTEGER NOT NULL,
    scheduling_model TEXT NOT NULL CHECK(scheduling_model IN ('fixed_schedule', 'flexible_appointments')),
    prerequisites TEXT,
    location TEXT NOT NULL,
    status TEXT NOT NULL CHECK(status IN ('draft', 'published', 'active', 'completed', 'cancelled')),
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE INDEX IF NOT EXISTS idx_course_instructor ON course(instructor_uuid);
  CREATE INDEX IF NOT EXISTS idx_course_status ON course(status);

  CREATE TABLE IF NOT EXISTS enrollment (
    uuid TEXT PRIMARY KEY,
    course_uuid TEXT NOT NULL,
    student_uuid TEXT NOT NULL,
    enrolled_at TEXT NOT NULL DEFAULT (datetime('now')),
    status TEXT NOT NULL CHECK(status IN ('enrolled', 'completed', 'dropped', 'withdrawn')),
    completion_date TEXT,
    notes TEXT,
    FOREIGN KEY (course_uuid) REFERENCES course(uuid)
  );

  CREATE INDEX IF NOT EXISTS idx_enrollment_course ON enrollment(course_uuid);
  CREATE INDEX IF NOT EXISTS idx_enrollment_student ON enrollment(student_uuid);

  CREATE TABLE IF NOT EXISTS session (
    uuid TEXT PRIMARY KEY,
    course_uuid TEXT NOT NULL,
    scheduled_at TEXT NOT NULL,
    duration_minutes INTEGER NOT NULL,
    location TEXT,
    session_type TEXT NOT NULL CHECK(session_type IN ('group', 'individual')),
    specific_student_uuid TEXT,
    notes TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY (course_uuid) REFERENCES course(uuid)
  );

  CREATE INDEX IF NOT EXISTS idx_session_course ON session(course_uuid);
  CREATE INDEX IF NOT EXISTS idx_session_scheduled ON session(scheduled_at);

  CREATE TABLE IF NOT EXISTS attendance (
    uuid TEXT PRIMARY KEY,
    session_uuid TEXT NOT NULL,
    enrollment_uuid TEXT NOT NULL,
    attended BOOLEAN NOT NULL,
    recorded_at TEXT NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY (session_uuid) REFERENCES session(uuid),
    FOREIGN KEY (enrollment_uuid) REFERENCES enrollment(uuid)
  );

  CREATE INDEX IF NOT EXISTS idx_attendance_session ON attendance(session_uuid);
  CREATE INDEX IF NOT EXISTS idx_attendance_enrollment ON attendance(enrollment_uuid);

  CREATE TABLE IF NOT EXISTS credential (
    uuid TEXT PRIMARY KEY,
    student_uuid TEXT NOT NULL,
    course_uuid TEXT NOT NULL,
    issued_at TEXT NOT NULL DEFAULT (datetime('now')),
    metadata TEXT NOT NULL,
    FOREIGN KEY (course_uuid) REFERENCES course(uuid)
  );

  CREATE INDEX IF NOT EXISTS idx_credential_student ON credential(student_uuid);
`);

console.log('Database initialized successfully!');
db.close();
