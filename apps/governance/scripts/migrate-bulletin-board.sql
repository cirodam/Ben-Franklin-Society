-- Migration: Update bulletin board schema
-- Removes color field, adds expiration and quote support

-- Step 1: Create new bulletin_post table with updated schema
CREATE TABLE bulletin_post_new (
  uuid       TEXT PRIMARY KEY,
  author_uuid TEXT NOT NULL REFERENCES person(uuid),
  title      TEXT NOT NULL,
  body       TEXT NOT NULL,
  created_at TEXT NOT NULL,
  updated_at TEXT NULL,
  expires_at TEXT NULL,
  deleted_at TEXT NULL
);

-- Step 2: Copy data from old table (excluding color)
INSERT INTO bulletin_post_new (uuid, author_uuid, title, body, created_at, updated_at, deleted_at)
SELECT uuid, author_uuid, title, body, created_at, updated_at, deleted_at
FROM bulletin_post;

-- Step 3: Drop old table and rename new one
DROP TABLE bulletin_post;
ALTER TABLE bulletin_post_new RENAME TO bulletin_post;

-- Step 4: Create new bulletin_comment table with quote support
CREATE TABLE bulletin_comment_new (
  uuid                TEXT PRIMARY KEY,
  post_uuid           TEXT NOT NULL REFERENCES bulletin_post(uuid),
  author_uuid         TEXT NOT NULL REFERENCES person(uuid),
  body                TEXT NOT NULL,
  quoted_author_name  TEXT NULL,
  quoted_excerpt      TEXT NULL,
  quoted_reply_id     TEXT NULL,
  created_at          TEXT NOT NULL,
  deleted_at          TEXT NULL
);

-- Step 5: Copy data from old table (excluding updated_at)
INSERT INTO bulletin_comment_new (uuid, post_uuid, author_uuid, body, created_at, deleted_at)
SELECT uuid, post_uuid, author_uuid, body, created_at, deleted_at
FROM bulletin_comment;

-- Step 6: Drop old table and rename new one
DROP TABLE bulletin_comment;
ALTER TABLE bulletin_comment_new RENAME TO bulletin_comment;
