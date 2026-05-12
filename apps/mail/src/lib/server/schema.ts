export const schema = /* sql */ `

CREATE TABLE IF NOT EXISTS mailbox (
  principal_uuid TEXT PRIMARY KEY,
  handle_cache   TEXT NOT NULL,
  status         TEXT NOT NULL DEFAULT 'active',
  created_at     TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS message (
  uuid                TEXT PRIMARY KEY,
  from_principal_uuid TEXT NOT NULL,
  from_handle_cache   TEXT NOT NULL,
  subject             TEXT NOT NULL,
  body                TEXT NOT NULL,
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
  delivery_status           TEXT NULL,
  delivery_error            TEXT NULL,
  UNIQUE (message_uuid, recipient_principal_uuid)
);

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

`;
