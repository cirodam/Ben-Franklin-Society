export const schema = /* sql */ `

CREATE TABLE IF NOT EXISTS config (
  key   TEXT PRIMARY KEY,
  value TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS scheduled_transfer_group (
  uuid             TEXT PRIMARY KEY,
  name             TEXT NOT NULL,
  association_uuid TEXT NOT NULL,
  created_at       TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS account (
  uuid           TEXT PRIMARY KEY,
  principal_uuid TEXT NOT NULL,
  name           TEXT NOT NULL,
  handle_cache   TEXT NOT NULL,
  balance        INTEGER NOT NULL DEFAULT 0,
  status         TEXT NOT NULL DEFAULT 'active',
  account_type   TEXT NOT NULL DEFAULT 'standard',
  can_auto_pull  INTEGER NOT NULL DEFAULT 0,
  created_at     TEXT NOT NULL,
  UNIQUE (principal_uuid, name)
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
  group_uuid                  TEXT NULL REFERENCES scheduled_transfer_group(uuid),
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

CREATE TABLE IF NOT EXISTS collection_policy (
  uuid                   TEXT PRIMARY KEY,
  name                   TEXT NOT NULL,
  collector_uuid         TEXT NOT NULL,
  target_filter          TEXT NOT NULL,
  rate_percentage        REAL NOT NULL,
  schedule               TEXT NOT NULL,
  day_of_month           INTEGER NULL,
  status                 TEXT NOT NULL DEFAULT 'active',
  created_by_motion_uuid TEXT NULL,
  created_at             TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS collection_batch (
  uuid               TEXT PRIMARY KEY,
  policy_uuid        TEXT NOT NULL REFERENCES collection_policy(uuid),
  period_key         TEXT NOT NULL,
  status             TEXT NOT NULL DEFAULT 'pending',
  total_transactions INTEGER NOT NULL,
  total_amount       INTEGER NOT NULL,
  approved_by_uuid   TEXT NULL,
  approved_at        TEXT NULL,
  executed_at        TEXT NULL,
  created_at         TEXT NOT NULL,
  UNIQUE (policy_uuid, period_key)
);

CREATE TABLE IF NOT EXISTS collection_batch_item (
  uuid             TEXT PRIMARY KEY,
  batch_uuid       TEXT NOT NULL REFERENCES collection_batch(uuid),
  from_account_uuid TEXT NOT NULL REFERENCES account(uuid),
  amount           INTEGER NOT NULL,
  balance_snapshot INTEGER NOT NULL,
  status           TEXT NOT NULL DEFAULT 'pending',
  transaction_uuid TEXT NULL,
  error            TEXT NULL
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
