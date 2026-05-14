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

-- Households: optional organizational units for members and dependents
CREATE TABLE IF NOT EXISTS household (
  uuid           TEXT PRIMARY KEY,
  created_at     TEXT NOT NULL,
  dissolved_at   TEXT NULL
);

-- Household membership: full members can optionally join/leave households
CREATE TABLE IF NOT EXISTS household_member (
  household_uuid TEXT NOT NULL REFERENCES household(uuid),
  person_uuid    TEXT NOT NULL REFERENCES person(uuid),
  joined_at      TEXT NOT NULL,
  left_at        TEXT NULL,
  PRIMARY KEY (household_uuid, person_uuid)
);
CREATE INDEX IF NOT EXISTS idx_household_member_person ON household_member(person_uuid);
CREATE INDEX IF NOT EXISTS idx_household_member_active ON household_member(household_uuid, left_at);

-- Dependents: non-members who must belong to a household
CREATE TABLE IF NOT EXISTS dependent (
  uuid             TEXT PRIMARY KEY,
  household_uuid   TEXT NOT NULL REFERENCES household(uuid),
  given_name       TEXT NOT NULL,
  family_name      TEXT NOT NULL,
  date_of_birth    TEXT NOT NULL,
  relationship     TEXT NOT NULL,
  eligibility_date TEXT NULL,
  notes            TEXT NULL,
  created_at       TEXT NOT NULL,
  removed_at       TEXT NULL
);
CREATE INDEX IF NOT EXISTS idx_dependent_household ON dependent(household_uuid);
CREATE INDEX IF NOT EXISTS idx_dependent_eligibility ON dependent(eligibility_date);
CREATE INDEX IF NOT EXISTS idx_dependent_active ON dependent(removed_at);

CREATE TABLE IF NOT EXISTS oidc_client (
  uuid           TEXT PRIMARY KEY,
  client_id      TEXT NOT NULL UNIQUE,
  client_secret_hash TEXT NULL,
  name           TEXT NOT NULL,
  redirect_uris  TEXT NOT NULL,
  created_at     TEXT NOT NULL,
  created_by     TEXT NOT NULL REFERENCES person(uuid)
);

CREATE TABLE IF NOT EXISTS oidc_refresh_token (
  token_hash      TEXT PRIMARY KEY,
  client_id       TEXT NOT NULL REFERENCES oidc_client(client_id),
  person_uuid     TEXT NOT NULL REFERENCES person(uuid),
  acting_as_uuid  TEXT NOT NULL,
  scope           TEXT NOT NULL,
  issued_at       TEXT NOT NULL,
  expires_at      TEXT NOT NULL,
  revoked_at      TEXT NULL
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

CREATE TABLE IF NOT EXISTS org_section (
  uuid                  TEXT PRIMARY KEY,
  association_uuid      TEXT NOT NULL REFERENCES association(uuid),
  parent_section_uuid   TEXT NULL REFERENCES org_section(uuid),
  name                  TEXT NOT NULL,
  mandate               TEXT NULL,
  created_at            TEXT NOT NULL,
  removed_at            TEXT NULL
);
CREATE INDEX IF NOT EXISTS idx_org_section_association ON org_section(association_uuid);
CREATE INDEX IF NOT EXISTS idx_org_section_parent ON org_section(parent_section_uuid);

CREATE TABLE IF NOT EXISTS role (
  uuid             TEXT PRIMARY KEY,
  association_uuid TEXT NOT NULL REFERENCES association(uuid),
  section_uuid     TEXT NULL REFERENCES org_section(uuid),
  name             TEXT NOT NULL,
  level            INTEGER NULL,
  parent_role_uuid TEXT NULL REFERENCES role(uuid),
  term_days        INTEGER NULL,
  description      TEXT NULL,
  salary_monthly   INTEGER NULL,
  daily_rate       INTEGER NULL,
  created_at       TEXT NOT NULL,
  UNIQUE (association_uuid, name)
);
CREATE INDEX IF NOT EXISTS idx_role_parent ON role(parent_role_uuid);
CREATE INDEX IF NOT EXISTS idx_role_level ON role(association_uuid, level);
CREATE INDEX IF NOT EXISTS idx_role_section ON role(section_uuid);

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
  assignment_type  TEXT NULL,
  days_worked      INTEGER NULL DEFAULT 0,
  PRIMARY KEY (person_uuid, role_uuid, association_uuid)
);

CREATE TABLE IF NOT EXISTS deliberation_rule (
  uuid             TEXT PRIMARY KEY,
  association_uuid TEXT NOT NULL REFERENCES association(uuid),
  name             TEXT NOT NULL,
  minimum_days     INTEGER NOT NULL DEFAULT 7,
  created_at       TEXT NOT NULL,
  UNIQUE (association_uuid, name)
);

CREATE TABLE IF NOT EXISTS vote_rule (
  uuid             TEXT PRIMARY KEY,
  association_uuid TEXT NOT NULL REFERENCES association(uuid),
  name             TEXT NOT NULL,
  -- threshold: fraction of aye / (aye + nay) required to pass
  -- stored as numerator/denominator so e.g. simple majority = 1/2, two-thirds = 2/3
  numerator        INTEGER NOT NULL DEFAULT 1,
  denominator      INTEGER NOT NULL DEFAULT 2,
  -- minimum participation: fraction of eligible voters who must cast a vote
  -- 0 means no minimum (default)
  quorum_numerator   INTEGER NOT NULL DEFAULT 0,
  quorum_denominator INTEGER NOT NULL DEFAULT 1,
  created_at       TEXT NOT NULL,
  UNIQUE (association_uuid, name)
);

CREATE TABLE IF NOT EXISTS motion (
  uuid                   TEXT PRIMARY KEY,
  title                  TEXT NOT NULL,
  body                   TEXT NOT NULL,
  reasoning              TEXT NULL,
  introduced_by_uuid     TEXT NOT NULL REFERENCES person(uuid),
  body_uuid              TEXT NOT NULL REFERENCES association(uuid),
  deliberation_rule_uuid TEXT NULL REFERENCES deliberation_rule(uuid),
  vote_rule_uuid         TEXT NULL REFERENCES vote_rule(uuid),
  status                 TEXT NOT NULL DEFAULT 'draft',
  clerk_notes            TEXT NULL,
  created_at             TEXT NOT NULL,
  deliberation_opened_at TEXT NULL,
  enacted_at             TEXT NULL,
  resolved_at            TEXT NULL
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

CREATE TABLE IF NOT EXISTS procedural_vote (
  uuid         TEXT PRIMARY KEY,
  motion_uuid  TEXT NOT NULL REFERENCES motion(uuid),
  called_by_uuid TEXT NOT NULL REFERENCES person(uuid),
  vote_type    TEXT NOT NULL,
  status       TEXT NOT NULL,
  created_at   TEXT NOT NULL,
  closes_at    TEXT NOT NULL,
  closed_at    TEXT NULL
);

CREATE TABLE IF NOT EXISTS procedural_ballot (
  uuid                 TEXT PRIMARY KEY,
  procedural_vote_uuid TEXT NOT NULL REFERENCES procedural_vote(uuid),
  voter_uuid           TEXT NOT NULL REFERENCES person(uuid),
  position             TEXT NOT NULL,
  cast_at              TEXT NOT NULL,
  UNIQUE(procedural_vote_uuid, voter_uuid)
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
  updated_by_motion_uuid TEXT NULL REFERENCES motion(uuid),
  updated_at             TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS community_config_history (
  uuid                   TEXT PRIMARY KEY,
  key                    TEXT NOT NULL,
  value                  TEXT NOT NULL,
  updated_by_motion_uuid TEXT NOT NULL REFERENCES motion(uuid),
  superseded_at          TEXT NOT NULL
);

-- Sortition system

CREATE TABLE IF NOT EXISTS sortition_body_config (
  association_uuid    TEXT PRIMARY KEY REFERENCES association(uuid),
  seat_count          INTEGER NOT NULL,
  term_days           INTEGER NOT NULL,
  is_permanent        INTEGER NOT NULL DEFAULT 1,
  source_college_uuid TEXT NULL REFERENCES association(uuid)
);

CREATE TABLE IF NOT EXISTS sortition (
  uuid             TEXT PRIMARY KEY,
  association_uuid TEXT NOT NULL REFERENCES association(uuid),
  motion_uuid      TEXT NOT NULL REFERENCES motion(uuid),
  conducted_at     TEXT NOT NULL,
  pool_size        INTEGER NOT NULL,
  notes            TEXT NULL
);

CREATE TABLE IF NOT EXISTS seat_term (
  uuid             TEXT PRIMARY KEY,
  association_uuid TEXT NOT NULL REFERENCES association(uuid),
  person_uuid      TEXT NOT NULL REFERENCES person(uuid),
  motion_uuid      TEXT NOT NULL REFERENCES motion(uuid),
  started_at       TEXT NOT NULL,
  ends_at          TEXT NOT NULL,
  vacated_at       TEXT NULL
);

CREATE TABLE IF NOT EXISTS list (
  uuid         TEXT PRIMARY KEY,
  motion_uuid  TEXT NOT NULL REFERENCES motion(uuid),
  name         TEXT NOT NULL,
  created_at   TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS list_item (
  uuid          TEXT PRIMARY KEY,
  list_uuid     TEXT NOT NULL REFERENCES list(uuid),
  position      INTEGER NOT NULL,
  item_type     TEXT NOT NULL,
  item_data     TEXT NOT NULL,
  status        TEXT NOT NULL DEFAULT 'called',
  status_reason TEXT NULL,
  UNIQUE (list_uuid, position)
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

-- The Record: permanent, public, append-only chronicle of official governance acts

CREATE TABLE IF NOT EXISTS record_entry (
  uuid             TEXT PRIMARY KEY,
  association_uuid TEXT NOT NULL REFERENCES association(uuid),
  recorded_by      TEXT NOT NULL REFERENCES person(uuid),
  action           TEXT NOT NULL,
  target_type      TEXT NOT NULL,
  target_uuid      TEXT NOT NULL,
  body             TEXT NOT NULL,
  detail           TEXT NULL,
  created_at       TEXT NOT NULL,
  edited_at        TEXT NULL,
  deleted_at       TEXT NULL
);

-- Audit log: append-only trail of every write in the application
-- Links the action to the person who performed it and optionally the authorizing motion

CREATE TABLE IF NOT EXISTS audit_log (
  id               INTEGER PRIMARY KEY AUTOINCREMENT,
  actor_uuid       TEXT NOT NULL REFERENCES person(uuid),
  action           TEXT NOT NULL,   -- e.g. 'document.update', 'member.add', 'vote_rule.set'
  target_type      TEXT NOT NULL,   -- e.g. 'document', 'person', 'association'
  target_uuid      TEXT NOT NULL,
  detail           TEXT NULL,       -- human-readable description
  motion_uuid      TEXT NULL REFERENCES motion(uuid), -- authorizing motion, if any
  created_at       TEXT NOT NULL
);

-- Bulletin Board: community notices and discussion

CREATE TABLE IF NOT EXISTS bulletin_post (
  uuid       TEXT PRIMARY KEY,
  author_uuid TEXT NOT NULL REFERENCES person(uuid),
  title      TEXT NOT NULL,
  body       TEXT NOT NULL,
  color      TEXT NOT NULL,  -- hex color chosen by author
  created_at TEXT NOT NULL,
  updated_at TEXT NULL,
  deleted_at TEXT NULL
);

CREATE TABLE IF NOT EXISTS bulletin_comment (
  uuid       TEXT PRIMARY KEY,
  post_uuid  TEXT NOT NULL REFERENCES bulletin_post(uuid),
  author_uuid TEXT NOT NULL REFERENCES person(uuid),
  body       TEXT NOT NULL,
  created_at TEXT NOT NULL,
  updated_at TEXT NULL,
  deleted_at TEXT NULL
);

`;
