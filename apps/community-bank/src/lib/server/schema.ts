export const schema = /* sql */ `

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
  created_at     TEXT NOT NULL,
  UNIQUE (principal_uuid, name)
);

CREATE TABLE IF NOT EXISTS scheduled_transfer (
  uuid                   TEXT PRIMARY KEY,
  name                   TEXT NOT NULL,
  from_uuid              TEXT NOT NULL REFERENCES account(uuid),
  to_uuid                TEXT NOT NULL REFERENCES account(uuid),
  amount                 INTEGER NOT NULL,
  type                   TEXT NOT NULL,
  schedule               TEXT NOT NULL,
  group_uuid             TEXT NULL REFERENCES scheduled_transfer_group(uuid),
  status                 TEXT NOT NULL DEFAULT 'active',
  created_by_motion_uuid TEXT NULL,
  created_at             TEXT NOT NULL,
  cancelled_at           TEXT NULL
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

`;
