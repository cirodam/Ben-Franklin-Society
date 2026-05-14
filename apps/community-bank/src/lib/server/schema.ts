export const schema = /* sql */ `

CREATE TABLE IF NOT EXISTS config (
  key   TEXT PRIMARY KEY,
  value TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS account (
  uuid           TEXT PRIMARY KEY,
  principal_uuid TEXT NOT NULL,
  name           TEXT NOT NULL,
  handle_cache   TEXT NOT NULL,
  balance        INTEGER NOT NULL DEFAULT 0,
  status         TEXT NOT NULL DEFAULT 'active',
  account_type   TEXT NOT NULL DEFAULT 'standard',
  created_at     TEXT NOT NULL,
  UNIQUE (principal_uuid, name)
);

CREATE TABLE IF NOT EXISTS account_owner_permissions (
  principal_uuid TEXT PRIMARY KEY,
  can_auto_pull  INTEGER NOT NULL DEFAULT 0,
  created_at     TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS scheduled_transfer (
  uuid                        TEXT PRIMARY KEY,
  name                        TEXT NOT NULL,
  from_uuid                   TEXT NULL REFERENCES account(uuid),
  to_uuid                     TEXT NOT NULL REFERENCES account(uuid),
  amount                      INTEGER NULL,
  transfer_mode               TEXT NOT NULL DEFAULT 'flat',
  target_filter               TEXT NOT NULL DEFAULT 'specific',
  rate_percentage             REAL NULL,
  threshold                   INTEGER NULL,
  type                        TEXT NOT NULL,
  schedule                    TEXT NOT NULL,
  status                      TEXT NOT NULL DEFAULT 'active',
  requested_by_principal_uuid TEXT NOT NULL,
  authorized_by_principal_uuid TEXT NULL,
  created_by_motion_uuid      TEXT NULL,
  created_at                  TEXT NOT NULL,
  cancelled_at                TEXT NULL
);

CREATE TABLE IF NOT EXISTS "transaction" (
  uuid                    TEXT PRIMARY KEY,
  from_uuid               TEXT NOT NULL REFERENCES account(uuid),
  to_uuid                 TEXT NOT NULL REFERENCES account(uuid),
  amount                  INTEGER NOT NULL,
  type                    TEXT NOT NULL,
  source                  TEXT NOT NULL,
  slip_serial             TEXT NULL,
  memo                    TEXT NULL,
  scheduled_transfer_uuid TEXT NULL REFERENCES scheduled_transfer(uuid),
  entered_by_uuid         TEXT NULL,
  created_at              TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS admin_action_log (
  uuid        TEXT PRIMARY KEY,
  action      TEXT NOT NULL,
  target_uuid TEXT NOT NULL,
  target_type TEXT NOT NULL,
  actor_uuid  TEXT NOT NULL,
  memo        TEXT NOT NULL,
  created_at  TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS outbox (
  id           INTEGER PRIMARY KEY AUTOINCREMENT,
  event_type   TEXT NOT NULL,
  payload_json TEXT NOT NULL,
  created_at   TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  delivered_at TEXT NULL
);

CREATE TABLE IF NOT EXISTS scheduler_run (
  uuid        TEXT PRIMARY KEY,
  job         TEXT NOT NULL,
  period_key  TEXT NOT NULL,
  ran_at      TEXT NOT NULL,
  result_json TEXT NOT NULL DEFAULT '{}',
  UNIQUE (job, period_key)
);

`;
