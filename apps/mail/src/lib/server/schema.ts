export const schema = /* sql */ `

CREATE TABLE IF NOT EXISTS config (
  key   TEXT PRIMARY KEY,
  value TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS mailbox (
  principal_uuid TEXT PRIMARY KEY,
  handle_cache   TEXT NOT NULL,
  status         TEXT NOT NULL DEFAULT 'active',
  signature      TEXT NULL,
  created_at     TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS mail_template (
  uuid         TEXT PRIMARY KEY,
  mailbox_uuid TEXT NOT NULL REFERENCES mailbox(principal_uuid),
  name         TEXT NOT NULL,
  subject      TEXT NOT NULL,
  body         TEXT NOT NULL,
  created_at   TEXT NOT NULL,
  UNIQUE (mailbox_uuid, name)
);

CREATE TABLE IF NOT EXISTS message (
  uuid                TEXT PRIMARY KEY,
  from_principal_uuid TEXT NOT NULL,
  from_handle_cache   TEXT NOT NULL,
  subject             TEXT NOT NULL,
  body                TEXT NOT NULL,
  content_type        TEXT NOT NULL DEFAULT 'text/plain' CHECK(content_type IN ('text/plain', 'text/markdown')),
  thread_id           TEXT NOT NULL REFERENCES message(uuid) DEFERRABLE INITIALLY DEFERRED,
  reply_to_id         TEXT NULL REFERENCES message(uuid),
  origin              TEXT NOT NULL,
  is_automated        INTEGER NOT NULL DEFAULT 0,
  status              TEXT NOT NULL DEFAULT 'draft',
  created_at          TEXT NOT NULL,
  sent_at             TEXT NULL,
  deleted_at          TEXT NULL
);

CREATE TABLE IF NOT EXISTS message_recipient (
  uuid                      TEXT PRIMARY KEY,
  message_uuid              TEXT NOT NULL REFERENCES message(uuid),
  recipient_principal_uuid  TEXT NOT NULL,
  recipient_handle_cache    TEXT NOT NULL,
  recipient_society_handle  TEXT NULL,
  type                      TEXT NOT NULL,
  read_at                   TEXT NULL,
  trashed_at                TEXT NULL,
  archived_at               TEXT NULL,
  delivery_status           TEXT NULL,
  delivery_error            TEXT NULL,
  UNIQUE (message_uuid, recipient_principal_uuid)
);

CREATE TABLE IF NOT EXISTS attachment (
  uuid         TEXT PRIMARY KEY,
  message_uuid TEXT NOT NULL REFERENCES message(uuid) ON DELETE CASCADE,
  filename     TEXT NOT NULL,
  content_type TEXT NOT NULL,
  size_bytes   INTEGER NOT NULL,
  storage_path TEXT NOT NULL,
  uploaded_at  TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_attachment_message ON attachment(message_uuid);

CREATE TABLE IF NOT EXISTS label (
  uuid         TEXT PRIMARY KEY,
  mailbox_uuid TEXT NOT NULL REFERENCES mailbox(principal_uuid),
  name         TEXT NOT NULL,
  color        TEXT NULL,
  created_at   TEXT NOT NULL,
  UNIQUE (mailbox_uuid, name)
);

CREATE INDEX IF NOT EXISTS idx_label_mailbox ON label(mailbox_uuid);

CREATE TABLE IF NOT EXISTS thread_label (
  thread_id    TEXT NOT NULL,
  label_uuid   TEXT NOT NULL REFERENCES label(uuid) ON DELETE CASCADE,
  mailbox_uuid TEXT NOT NULL,
  PRIMARY KEY (thread_id, label_uuid, mailbox_uuid)
);

CREATE INDEX IF NOT EXISTS idx_thread_label_thread ON thread_label(thread_id, mailbox_uuid);
CREATE INDEX IF NOT EXISTS idx_thread_label_label ON thread_label(label_uuid);

CREATE TABLE IF NOT EXISTS contact_group (
  uuid         TEXT PRIMARY KEY,
  mailbox_uuid TEXT NOT NULL REFERENCES mailbox(principal_uuid),
  name         TEXT NOT NULL,
  created_at   TEXT NOT NULL,
  UNIQUE (mailbox_uuid, name)
);

CREATE INDEX IF NOT EXISTS idx_contact_group_mailbox ON contact_group(mailbox_uuid);

CREATE TABLE IF NOT EXISTS contact_group_member (
  group_uuid       TEXT NOT NULL REFERENCES contact_group(uuid) ON DELETE CASCADE,
  principal_uuid   TEXT NOT NULL,
  handle_cache     TEXT NOT NULL,
  PRIMARY KEY (group_uuid, principal_uuid)
);

CREATE INDEX IF NOT EXISTS idx_contact_group_member_group ON contact_group_member(group_uuid);

CREATE TABLE IF NOT EXISTS message_report (
  uuid          TEXT PRIMARY KEY,
  message_uuid  TEXT NOT NULL REFERENCES message(uuid),
  reporter_uuid TEXT NOT NULL,
  reason        TEXT NOT NULL,
  status        TEXT NOT NULL DEFAULT 'pending',
  created_at    TEXT NOT NULL,
  reviewed_at   TEXT NULL,
  reviewed_by_uuid TEXT NULL
);

CREATE TABLE IF NOT EXISTS moderation_log (
  uuid         TEXT PRIMARY KEY,
  action       TEXT NOT NULL,
  target_uuid  TEXT NOT NULL,
  target_type  TEXT NOT NULL,
  actor_uuid   TEXT NOT NULL,
  reason       TEXT NOT NULL,
  report_uuid  TEXT NULL REFERENCES message_report(uuid),
  created_at   TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS outbox (
  id           INTEGER PRIMARY KEY AUTOINCREMENT,
  event_type   TEXT NOT NULL,
  payload_json TEXT NOT NULL,
  created_at   TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  delivered_at TEXT NULL
);

CREATE TABLE IF NOT EXISTS sync_run (
  uuid        TEXT PRIMARY KEY,
  job         TEXT NOT NULL,
  period_key  TEXT NOT NULL,
  ran_at      TEXT NOT NULL,
  result_json TEXT NOT NULL DEFAULT '{}',
  UNIQUE (job, period_key)
);

-- Full-text search index
CREATE VIRTUAL TABLE IF NOT EXISTS message_fts USING fts5(
  subject,
  body,
  from_handle,
  content='message',
  content_rowid='rowid'
);

-- Triggers to keep FTS in sync with message table
CREATE TRIGGER IF NOT EXISTS message_ai AFTER INSERT ON message BEGIN
  INSERT INTO message_fts(rowid, subject, body, from_handle)
  VALUES (new.rowid, new.subject, new.body, new.from_handle_cache);
END;

CREATE TRIGGER IF NOT EXISTS message_ad AFTER DELETE ON message BEGIN
  DELETE FROM message_fts WHERE rowid = old.rowid;
END;

CREATE TRIGGER IF NOT EXISTS message_au AFTER UPDATE ON message BEGIN
  UPDATE message_fts 
  SET subject = new.subject,
      body = new.body,
      from_handle = new.from_handle_cache
  WHERE rowid = new.rowid;
END;

`;
