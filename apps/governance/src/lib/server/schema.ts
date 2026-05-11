export const schema = /* sql */ `

CREATE TABLE IF NOT EXISTS person (
  uuid          TEXT PRIMARY KEY,
  handle        TEXT NOT NULL UNIQUE,
  given_name    TEXT NOT NULL,
  family_name   TEXT NOT NULL,
  date_of_birth TEXT NOT NULL,
  phone         TEXT NULL,
  status        TEXT NOT NULL DEFAULT 'active',
  joined_at     TEXT NOT NULL,
  revoked_at    TEXT NULL
);

CREATE TABLE IF NOT EXISTS credentials (
  person_uuid          TEXT PRIMARY KEY REFERENCES person(uuid),
  password_hash        TEXT NOT NULL,
  mfa_enabled          INTEGER NOT NULL DEFAULT 0,
  mfa_secret_encrypted TEXT NULL,
  failed_attempt_count INTEGER NOT NULL DEFAULT 0,
  locked_until         TEXT NULL,
  password_changed_at  TEXT NOT NULL,
  created_at           TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS session (
  uuid               TEXT PRIMARY KEY,
  person_uuid        TEXT NOT NULL REFERENCES person(uuid),
  refresh_token_hash TEXT NOT NULL UNIQUE,
  acting_as_uuid     TEXT NOT NULL,
  user_agent         TEXT NULL,
  ip_address         TEXT NULL,
  created_at         TEXT NOT NULL,
  last_active_at     TEXT NOT NULL,
  expires_at         TEXT NOT NULL,
  revoked_at         TEXT NULL
);

CREATE TABLE IF NOT EXISTS association (
  uuid                       TEXT PRIMARY KEY,
  handle                     TEXT NOT NULL UNIQUE,
  name                       TEXT NOT NULL,
  type                       TEXT NOT NULL,
  status                     TEXT NOT NULL DEFAULT 'active',
  established_by_motion_uuid TEXT NULL,
  created_at                 TEXT NOT NULL,
  dissolved_at               TEXT NULL
);

CREATE TABLE IF NOT EXISTS association_member (
  association_uuid TEXT NOT NULL REFERENCES association(uuid),
  person_uuid      TEXT NOT NULL REFERENCES person(uuid),
  joined_at        TEXT NOT NULL,
  removed_at       TEXT NULL,
  PRIMARY KEY (association_uuid, person_uuid)
);

CREATE TABLE IF NOT EXISTS role (
  uuid             TEXT PRIMARY KEY,
  association_uuid TEXT NOT NULL REFERENCES association(uuid),
  name             TEXT NOT NULL,
  created_at       TEXT NOT NULL,
  UNIQUE (association_uuid, name)
);

CREATE TABLE IF NOT EXISTS role_permission (
  role_uuid  TEXT NOT NULL REFERENCES role(uuid),
  app        TEXT NOT NULL,
  permission TEXT NOT NULL,
  PRIMARY KEY (role_uuid, app, permission)
);

CREATE TABLE IF NOT EXISTS person_role (
  person_uuid      TEXT NOT NULL REFERENCES person(uuid),
  role_uuid        TEXT NOT NULL REFERENCES role(uuid),
  association_uuid TEXT NOT NULL REFERENCES association(uuid),
  assigned_at      TEXT NOT NULL,
  removed_at       TEXT NULL,
  PRIMARY KEY (person_uuid, role_uuid)
);

CREATE TABLE IF NOT EXISTS motion (
  uuid               TEXT PRIMARY KEY,
  title              TEXT NOT NULL,
  body               TEXT NOT NULL,
  introduced_by_uuid TEXT NOT NULL REFERENCES person(uuid),
  body_uuid          TEXT NOT NULL REFERENCES association(uuid),
  status             TEXT NOT NULL DEFAULT 'draft',
  created_at         TEXT NOT NULL,
  enacted_at         TEXT NULL,
  resolved_at        TEXT NULL
);

CREATE TABLE IF NOT EXISTS document (
  uuid                   TEXT PRIMARY KEY,
  title                  TEXT NOT NULL,
  slug                   TEXT NOT NULL UNIQUE,
  owner_uuid             TEXT NULL REFERENCES association(uuid),
  status                 TEXT NOT NULL DEFAULT 'active',
  created_at             TEXT NOT NULL,
  created_by_motion_uuid TEXT NULL REFERENCES motion(uuid)
);

CREATE TABLE IF NOT EXISTS article (
  uuid          TEXT PRIMARY KEY,
  document_uuid TEXT NOT NULL REFERENCES document(uuid),
  number        INTEGER NOT NULL,
  title         TEXT NOT NULL,
  UNIQUE (document_uuid, number)
);

CREATE TABLE IF NOT EXISTS section (
  uuid                   TEXT PRIMARY KEY,
  article_uuid           TEXT NOT NULL REFERENCES article(uuid),
  number                 INTEGER NOT NULL,
  prose                  TEXT NOT NULL,
  rationale              TEXT NOT NULL,
  version                INTEGER NOT NULL DEFAULT 1,
  amended_by_motion_uuid TEXT NULL REFERENCES motion(uuid),
  UNIQUE (article_uuid, number)
);

CREATE TABLE IF NOT EXISTS section_history (
  uuid                   TEXT PRIMARY KEY,
  section_uuid           TEXT NOT NULL REFERENCES section(uuid),
  version                INTEGER NOT NULL,
  prose                  TEXT NOT NULL,
  rationale              TEXT NOT NULL,
  amended_by_motion_uuid TEXT NOT NULL REFERENCES motion(uuid),
  recorded_at            TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS motion_vote_tally (
  motion_uuid    TEXT PRIMARY KEY REFERENCES motion(uuid),
  eligible_count INTEGER NOT NULL,
  aye_count      INTEGER NOT NULL DEFAULT 0,
  nay_count      INTEGER NOT NULL DEFAULT 0,
  abstain_count  INTEGER NOT NULL DEFAULT 0,
  opened_at      TEXT NOT NULL,
  closed_at      TEXT NULL
);

CREATE TABLE IF NOT EXISTS motion_vote_receipt (
  uuid        TEXT PRIMARY KEY,
  motion_uuid TEXT NOT NULL REFERENCES motion(uuid),
  voter_uuid  TEXT NOT NULL REFERENCES person(uuid),
  voted_at    TEXT NOT NULL,
  UNIQUE (motion_uuid, voter_uuid)
);

CREATE TABLE IF NOT EXISTS motion_comment (
  uuid        TEXT PRIMARY KEY,
  motion_uuid TEXT NOT NULL REFERENCES motion(uuid),
  author_uuid TEXT NOT NULL REFERENCES person(uuid),
  body        TEXT NOT NULL,
  created_at  TEXT NOT NULL,
  edited_at   TEXT NULL,
  deleted_at  TEXT NULL
);

CREATE TABLE IF NOT EXISTS motion_effect (
  uuid        TEXT PRIMARY KEY,
  motion_uuid TEXT NOT NULL REFERENCES motion(uuid),
  seq         INTEGER NOT NULL,
  type        TEXT NOT NULL,
  payload     TEXT NOT NULL,
  executed_at TEXT NULL,
  error       TEXT NULL,
  UNIQUE (motion_uuid, seq)
);

CREATE TABLE IF NOT EXISTS calendar_event (
  uuid                   TEXT PRIMARY KEY,
  title                  TEXT NOT NULL,
  description            TEXT NULL,
  organizer_uuid         TEXT NOT NULL,
  starts_at              TEXT NOT NULL,
  ends_at                TEXT NULL,
  location               TEXT NULL,
  created_by_motion_uuid TEXT NULL REFERENCES motion(uuid),
  created_at             TEXT NOT NULL,
  cancelled_at           TEXT NULL
);

CREATE TABLE IF NOT EXISTS community_config (
  key                    TEXT PRIMARY KEY,
  value                  TEXT NOT NULL,
  description            TEXT NOT NULL,
  updated_by_motion_uuid TEXT NOT NULL REFERENCES motion(uuid),
  updated_at             TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS community_config_history (
  uuid                   TEXT PRIMARY KEY,
  key                    TEXT NOT NULL,
  value                  TEXT NOT NULL,
  updated_by_motion_uuid TEXT NOT NULL REFERENCES motion(uuid),
  superseded_at          TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS neighboring_society (
  uuid            TEXT PRIMARY KEY,
  society_handle  TEXT NOT NULL UNIQUE,
  name            TEXT NOT NULL,
  endpoint        TEXT NOT NULL,
  latitude        REAL NOT NULL,
  longitude       REAL NOT NULL,
  distance_km     REAL NOT NULL,
  status          TEXT NOT NULL DEFAULT 'active',
  first_seen_at   TEXT NOT NULL,
  last_checked_at TEXT NULL,
  last_seen_at    TEXT NULL
);

CREATE TABLE IF NOT EXISTS contract (
  uuid                       TEXT PRIMARY KEY,
  title                      TEXT NOT NULL,
  body                       TEXT NOT NULL,
  body_hash                  TEXT NOT NULL,
  jurisdiction               TEXT NOT NULL,
  jurisdiction_society_handle TEXT NULL,
  status                     TEXT NOT NULL DEFAULT 'draft',
  effective_date             TEXT NULL,
  expiry_date                TEXT NULL,
  created_at                 TEXT NOT NULL,
  activated_at               TEXT NULL,
  closed_at                  TEXT NULL
);

CREATE TABLE IF NOT EXISTS contract_party (
  uuid                    TEXT PRIMARY KEY,
  contract_uuid           TEXT NOT NULL REFERENCES contract(uuid),
  side                    TEXT NOT NULL,
  principal_uuid          TEXT NOT NULL,
  principal_handle        TEXT NOT NULL,
  principal_society_handle TEXT NOT NULL,
  role                    TEXT NOT NULL,
  signature               TEXT NULL,
  signed_at               TEXT NULL
);

CREATE TABLE IF NOT EXISTS contract_milestone (
  uuid                    TEXT PRIMARY KEY,
  contract_uuid           TEXT NOT NULL REFERENCES contract(uuid),
  title                   TEXT NOT NULL,
  description             TEXT NULL,
  due_date                TEXT NULL,
  transfer_amount         INTEGER NULL,
  transfer_from_party_uuid TEXT NULL REFERENCES contract_party(uuid),
  transfer_to_party_uuid  TEXT NULL REFERENCES contract_party(uuid),
  status                  TEXT NOT NULL DEFAULT 'pending',
  attested_by_party_uuid  TEXT NULL REFERENCES contract_party(uuid),
  attested_at             TEXT NULL
);

CREATE TABLE IF NOT EXISTS contract_event (
  uuid              TEXT PRIMARY KEY,
  contract_uuid     TEXT NOT NULL REFERENCES contract(uuid),
  event_type        TEXT NOT NULL,
  actor_party_uuid  TEXT NULL REFERENCES contract_party(uuid),
  detail            TEXT NULL,
  recorded_at       TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS outbox (
  id           INTEGER PRIMARY KEY AUTOINCREMENT,
  event_type   TEXT NOT NULL,
  payload_json TEXT NOT NULL,
  created_at   TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  delivered_at TEXT NULL
);

`;
