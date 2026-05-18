-- Create comment_thread table
CREATE TABLE IF NOT EXISTS comment_thread (
  uuid TEXT PRIMARY KEY,
  created_at TEXT NOT NULL
);

-- Create comment table
CREATE TABLE IF NOT EXISTS comment (
  uuid TEXT PRIMARY KEY,
  thread_uuid TEXT NOT NULL REFERENCES comment_thread(uuid),
  author_uuid TEXT NOT NULL REFERENCES person(uuid),
  parent_comment_uuid TEXT NULL REFERENCES comment(uuid),
  body TEXT NOT NULL,
  created_at TEXT NOT NULL,
  edited_at TEXT NULL,
  deleted_at TEXT NULL
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_comment_thread ON comment(thread_uuid, deleted_at);
CREATE INDEX IF NOT EXISTS idx_comment_parent ON comment(parent_comment_uuid);

-- Add thread_uuid column to motion table
ALTER TABLE motion ADD COLUMN thread_uuid TEXT NULL REFERENCES comment_thread(uuid);
