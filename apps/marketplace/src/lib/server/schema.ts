export const schema = /* sql */ `

CREATE TABLE IF NOT EXISTS config (
  key   TEXT PRIMARY KEY,
  value TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS classified_listing (
  uuid                 TEXT PRIMARY KEY,
  seller_uuid          TEXT NOT NULL,
  seller_handle_cache  TEXT NOT NULL,
  seller_society_handle TEXT NOT NULL,
  title                TEXT NOT NULL,
  description          TEXT NOT NULL,
  category             TEXT NOT NULL,
  price                INTEGER NOT NULL,
  price_negotiable     INTEGER NOT NULL DEFAULT 0,
  scope                TEXT NOT NULL DEFAULT 'local',
  status               TEXT NOT NULL DEFAULT 'active',
  expires_at           TEXT NULL,
  created_at           TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS service_listing (
  uuid                   TEXT PRIMARY KEY,
  provider_uuid          TEXT NOT NULL,
  provider_handle_cache  TEXT NOT NULL,
  provider_society_handle TEXT NOT NULL,
  title                  TEXT NOT NULL,
  description            TEXT NOT NULL,
  category               TEXT NOT NULL,
  rate                   INTEGER NOT NULL,
  rate_unit              TEXT NOT NULL,
  service_area           TEXT NULL,
  scope                  TEXT NOT NULL DEFAULT 'local',
  status                 TEXT NOT NULL DEFAULT 'active',
  created_at             TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS physical_marketplace (
  uuid             TEXT PRIMARY KEY,
  name             TEXT NOT NULL,
  description      TEXT NULL,
  location         TEXT NOT NULL,
  default_schedule TEXT NULL,
  status           TEXT NOT NULL DEFAULT 'active',
  created_at       TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS market_session (
  uuid             TEXT PRIMARY KEY,
  marketplace_uuid TEXT NOT NULL REFERENCES physical_marketplace(uuid),
  starts_at        TEXT NOT NULL,
  ends_at          TEXT NOT NULL,
  notes            TEXT NULL,
  status           TEXT NOT NULL DEFAULT 'scheduled',
  created_at       TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS stall (
  uuid             TEXT PRIMARY KEY,
  marketplace_uuid TEXT NOT NULL REFERENCES physical_marketplace(uuid),
  name             TEXT NOT NULL,
  description      TEXT NULL,
  status           TEXT NOT NULL DEFAULT 'active',
  created_at       TEXT NOT NULL,
  UNIQUE (marketplace_uuid, name)
);

CREATE TABLE IF NOT EXISTS stall_assignment (
  uuid                  TEXT PRIMARY KEY,
  stall_uuid            TEXT NOT NULL REFERENCES stall(uuid),
  session_uuid          TEXT NOT NULL REFERENCES market_session(uuid),
  assignee_uuid         TEXT NOT NULL,
  assignee_handle_cache TEXT NOT NULL,
  notes                 TEXT NULL,
  created_at            TEXT NOT NULL,
  UNIQUE (stall_uuid, session_uuid)
);

CREATE TABLE IF NOT EXISTS listing_report (
  uuid          TEXT PRIMARY KEY,
  listing_uuid  TEXT NOT NULL,
  listing_type  TEXT NOT NULL,
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
  report_uuid  TEXT NULL REFERENCES listing_report(uuid),
  created_at   TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS seller_suspension (
  principal_uuid TEXT PRIMARY KEY,
  actor_uuid     TEXT NOT NULL,
  reason         TEXT NOT NULL,
  suspended_at   TEXT NOT NULL,
  lifted_at      TEXT NULL
);

CREATE TABLE IF NOT EXISTS outbox (
  id           INTEGER PRIMARY KEY AUTOINCREMENT,
  event_type   TEXT NOT NULL,
  payload_json TEXT NOT NULL,
  created_at   TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  delivered_at TEXT NULL
);

`;
