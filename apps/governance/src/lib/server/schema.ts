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
  session_uuid    TEXT NOT NULL REFERENCES session(uuid),
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
  abbreviation               TEXT NULL,
  type                       TEXT NOT NULL,
  status                     TEXT NOT NULL DEFAULT 'active',
  governs_app                TEXT NULL,
  governing_document_slug    TEXT NULL,
  org_chart_slug             TEXT NULL,
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

-- Organizational sections: divisions within associations
CREATE TABLE IF NOT EXISTS org_section (
  uuid                  TEXT PRIMARY KEY,
  association_uuid      TEXT NOT NULL REFERENCES association(uuid),
  parent_section_uuid   TEXT NULL REFERENCES org_section(uuid),
  name                  TEXT NOT NULL,
  description           TEXT NULL,
  created_at            TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_org_section_association ON org_section(association_uuid);
CREATE INDEX IF NOT EXISTS idx_org_section_parent ON org_section(parent_section_uuid);
CREATE UNIQUE INDEX IF NOT EXISTS idx_org_section_unique_name ON org_section(association_uuid, name);

-- Role templates: reusable role definitions
CREATE TABLE IF NOT EXISTS role_template (
  uuid              TEXT PRIMARY KEY,
  association_uuid  TEXT NOT NULL REFERENCES association(uuid),
  template_key      TEXT NOT NULL,
  title             TEXT NOT NULL,
  description       TEXT NULL,
  compensation_franks INTEGER NOT NULL DEFAULT 0,
  created_at        TEXT NOT NULL,
  UNIQUE (association_uuid, template_key)
);
CREATE INDEX IF NOT EXISTS idx_role_template_association ON role_template(association_uuid);

-- Permissions for role templates
CREATE TABLE IF NOT EXISTS role_template_permission (
  template_uuid TEXT NOT NULL REFERENCES role_template(uuid) ON DELETE CASCADE,
  app           TEXT NOT NULL,
  permission    TEXT NOT NULL,
  PRIMARY KEY (template_uuid, app, permission)
);

-- Roles: positions in the organizational chart
CREATE TABLE IF NOT EXISTS role (
  uuid                 TEXT PRIMARY KEY,
  association_uuid     TEXT NOT NULL REFERENCES association(uuid),
  section_uuid         TEXT NULL REFERENCES org_section(uuid),
  template_uuid        TEXT NULL REFERENCES role_template(uuid),
  title                TEXT NOT NULL,
  description          TEXT NULL,
  compensation_franks  INTEGER NOT NULL DEFAULT 0,
  reports_to_role_uuid TEXT NULL REFERENCES role(uuid),
  created_at           TEXT NOT NULL,
  UNIQUE (association_uuid, title)
);
CREATE INDEX IF NOT EXISTS idx_role_association ON role(association_uuid);
CREATE INDEX IF NOT EXISTS idx_role_section ON role(section_uuid);
CREATE INDEX IF NOT EXISTS idx_role_template ON role(template_uuid);
CREATE INDEX IF NOT EXISTS idx_role_reports_to ON role(reports_to_role_uuid);

-- Permissions for roles (can override template permissions)
CREATE TABLE IF NOT EXISTS role_permission (
  role_uuid  TEXT NOT NULL REFERENCES role(uuid) ON DELETE CASCADE,
  app        TEXT NOT NULL,
  permission TEXT NOT NULL,
  PRIMARY KEY (role_uuid, app, permission)
);

-- Role assignments: maps people to roles
CREATE TABLE IF NOT EXISTS role_assignment (
  uuid        TEXT PRIMARY KEY,
  role_uuid   TEXT NOT NULL REFERENCES role(uuid) ON DELETE CASCADE,
  person_uuid TEXT NOT NULL REFERENCES person(uuid),
  assigned_at TEXT NOT NULL,
  removed_at  TEXT NULL
);
CREATE INDEX IF NOT EXISTS idx_role_assignment_role ON role_assignment(role_uuid);
CREATE INDEX IF NOT EXISTS idx_role_assignment_person ON role_assignment(person_uuid);
CREATE INDEX IF NOT EXISTS idx_role_assignment_active ON role_assignment(role_uuid, removed_at);
CREATE UNIQUE INDEX IF NOT EXISTS idx_role_assignment_one_per_role ON role_assignment(role_uuid) WHERE removed_at IS NULL;

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

-- Vote Sessions: Voting processes that reference motion documents
CREATE TABLE IF NOT EXISTS vote_session (
  uuid              TEXT PRIMARY KEY,
  motion_uuid       TEXT NOT NULL,
  opened_by         TEXT NOT NULL REFERENCES person(uuid),
  meeting_uuid      TEXT NULL REFERENCES meeting(uuid),
  passing_threshold REAL NOT NULL,
  requires_quorum   INTEGER NOT NULL DEFAULT 0,
  quorum_threshold  REAL NULL,
  opens_at          TEXT NOT NULL,
  closes_at         TEXT NOT NULL,
  status            TEXT NOT NULL DEFAULT 'scheduled',
  closed_at         TEXT NULL,
  finalized_at      TEXT NULL,
  outcome           TEXT NULL,
  created_at        TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_vote_session_motion ON vote_session(motion_uuid);
CREATE INDEX IF NOT EXISTS idx_vote_session_status ON vote_session(status);

CREATE TABLE IF NOT EXISTS vote_receipt (
  uuid              TEXT PRIMARY KEY,
  vote_session_uuid TEXT NOT NULL REFERENCES vote_session(uuid),
  voter_uuid        TEXT NOT NULL REFERENCES person(uuid),
  choice            TEXT NOT NULL,
  voted_at          TEXT NOT NULL,
  UNIQUE (vote_session_uuid, voter_uuid)
);
CREATE INDEX IF NOT EXISTS idx_vote_receipt_session ON vote_receipt(vote_session_uuid);

-- Meetings: Scheduled assembly gatherings where votes are taken
CREATE TABLE IF NOT EXISTS meeting (
  uuid            TEXT PRIMARY KEY,
  body_uuid       TEXT NOT NULL REFERENCES association(uuid),
  title           TEXT NOT NULL,
  scheduled_at    TEXT NOT NULL,
  location        TEXT NULL,
  status          TEXT NOT NULL DEFAULT 'scheduled',
  created_by_uuid TEXT NOT NULL REFERENCES person(uuid),
  created_at      TEXT NOT NULL,
  started_at      TEXT NULL,
  completed_at    TEXT NULL,
  cancelled_at    TEXT NULL,
  notes           TEXT NULL
);
CREATE INDEX IF NOT EXISTS idx_meeting_body ON meeting(body_uuid);
CREATE INDEX IF NOT EXISTS idx_meeting_scheduled ON meeting(scheduled_at);
CREATE INDEX IF NOT EXISTS idx_meeting_status ON meeting(status);

CREATE TABLE IF NOT EXISTS meeting_agenda_item (
  uuid          TEXT PRIMARY KEY,
  meeting_uuid  TEXT NOT NULL REFERENCES meeting(uuid),
  motion_uuid   TEXT NOT NULL,
  display_order INTEGER NOT NULL,
  notes         TEXT NULL,
  added_at      TEXT NOT NULL,
  removed_at    TEXT NULL,
  UNIQUE (meeting_uuid, motion_uuid)
);
CREATE INDEX IF NOT EXISTS idx_agenda_item_meeting ON meeting_agenda_item(meeting_uuid);
CREATE INDEX IF NOT EXISTS idx_agenda_item_motion ON meeting_agenda_item(motion_uuid);

CREATE TABLE IF NOT EXISTS meeting_outcome (
  uuid          TEXT PRIMARY KEY,
  meeting_uuid  TEXT NOT NULL REFERENCES meeting(uuid),
  motion_uuid   TEXT NOT NULL,
  action_taken  TEXT NOT NULL,
  vote_aye      INTEGER NULL,
  vote_nay      INTEGER NULL,
  vote_abstain  INTEGER NULL,
  notes         TEXT NULL,
  recorded_at   TEXT NOT NULL,
  recorded_by_uuid TEXT NOT NULL REFERENCES person(uuid)
);
CREATE INDEX IF NOT EXISTS idx_meeting_outcome_meeting ON meeting_outcome(meeting_uuid);
CREATE INDEX IF NOT EXISTS idx_meeting_outcome_motion ON meeting_outcome(motion_uuid);

-- Petitions: Community members signal priorities/concerns to assembly
CREATE TABLE IF NOT EXISTS petition (
  uuid                TEXT PRIMARY KEY,
  title               TEXT NOT NULL,
  body                TEXT NOT NULL,
  created_by_uuid     TEXT NOT NULL REFERENCES person(uuid),
  created_at          TEXT NOT NULL,
  status              TEXT NOT NULL DEFAULT 'open',
  responded_at        TEXT NULL,
  responded_by_uuid   TEXT NULL REFERENCES person(uuid),
  response_body       TEXT NULL,
  related_motion_uuid TEXT NULL
);
CREATE INDEX IF NOT EXISTS idx_petition_status ON petition(status);
CREATE INDEX IF NOT EXISTS idx_petition_created ON petition(created_at);

CREATE TABLE IF NOT EXISTS petition_signature (
  petition_uuid TEXT NOT NULL REFERENCES petition(uuid),
  person_uuid   TEXT NOT NULL REFERENCES person(uuid),
  signed_at     TEXT NOT NULL,
  unsigned_at   TEXT NULL,
  PRIMARY KEY (petition_uuid, person_uuid)
);
CREATE INDEX IF NOT EXISTS idx_petition_signature_person ON petition_signature(person_uuid);

-- Referendums: Scheduled community-wide ballots (e.g., annual November referendum)
CREATE TABLE IF NOT EXISTS referendum (
  uuid        TEXT PRIMARY KEY,
  title       TEXT NOT NULL,
  description TEXT NULL,
  opens_at    TEXT NOT NULL,
  closes_at   TEXT NOT NULL,
  status      TEXT NOT NULL DEFAULT 'draft',
  created_by_uuid TEXT NOT NULL REFERENCES person(uuid),
  created_at  TEXT NOT NULL,
  closed_at   TEXT NULL
);
CREATE INDEX IF NOT EXISTS idx_referendum_status ON referendum(status);
CREATE INDEX IF NOT EXISTS idx_referendum_dates ON referendum(opens_at, closes_at);

CREATE TABLE IF NOT EXISTS referendum_question (
  uuid            TEXT PRIMARY KEY,
  referendum_uuid TEXT NOT NULL REFERENCES referendum(uuid),
  question_text   TEXT NOT NULL,
  question_type   TEXT NOT NULL,
  description     TEXT NULL,
  display_order   INTEGER NOT NULL,
  thread_uuid     TEXT NULL REFERENCES comment_thread(uuid),
  created_at      TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_referendum_question_ref ON referendum_question(referendum_uuid);

CREATE TABLE IF NOT EXISTS referendum_question_option (
  uuid         TEXT PRIMARY KEY,
  question_uuid TEXT NOT NULL REFERENCES referendum_question(uuid),
  option_text  TEXT NOT NULL,
  display_order INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_referendum_option_question ON referendum_question_option(question_uuid);

CREATE TABLE IF NOT EXISTS referendum_vote (
  uuid          TEXT PRIMARY KEY,
  question_uuid TEXT NOT NULL REFERENCES referendum_question(uuid),
  person_uuid   TEXT NOT NULL REFERENCES person(uuid),
  vote_value    TEXT NOT NULL,
  voted_at      TEXT NOT NULL,
  UNIQUE (question_uuid, person_uuid)
);
CREATE INDEX IF NOT EXISTS idx_referendum_vote_question ON referendum_vote(question_uuid);
CREATE INDEX IF NOT EXISTS idx_referendum_vote_person ON referendum_vote(person_uuid);

-- Library System: unified document storage index
-- Documents are stored as JSON files, this table provides fast querying
CREATE TABLE IF NOT EXISTS library_item (
  uuid          TEXT PRIMARY KEY,
  type          TEXT NOT NULL,
  slug          TEXT NOT NULL UNIQUE,
  document_id   TEXT NULL,
  version       INTEGER NOT NULL DEFAULT 1,
  title         TEXT NOT NULL,
  owner_uuid    TEXT NOT NULL,
  created_at    TEXT NOT NULL,
  updated_at    TEXT NOT NULL,
  file_path     TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_library_item_type ON library_item(type);
CREATE INDEX IF NOT EXISTS idx_library_item_owner ON library_item(owner_uuid);
CREATE INDEX IF NOT EXISTS idx_library_item_slug ON library_item(slug);

CREATE TABLE IF NOT EXISTS calendar_event (
  uuid                   TEXT PRIMARY KEY,
  title                  TEXT NOT NULL,
  description            TEXT NULL,
  organizer_uuid         TEXT NOT NULL,
  starts_at              TEXT NOT NULL,
  ends_at                TEXT NULL,
  location               TEXT NULL,
  created_by_motion_uuid TEXT NULL,
  created_at             TEXT NOT NULL,
  cancelled_at           TEXT NULL
);

CREATE TABLE IF NOT EXISTS community_config (
  key                    TEXT PRIMARY KEY,
  value                  TEXT NOT NULL,
  description            TEXT NOT NULL,
  updated_by_motion_uuid TEXT NULL,
  updated_at             TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS community_config_history (
  uuid                   TEXT PRIMARY KEY,
  key                    TEXT NOT NULL,
  value                  TEXT NOT NULL,
  updated_by_motion_uuid TEXT NOT NULL,
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
  motion_uuid      TEXT NOT NULL,
  conducted_at     TEXT NOT NULL,
  pool_size        INTEGER NOT NULL,
  notes            TEXT NULL
);

CREATE TABLE IF NOT EXISTS seat_term (
  uuid             TEXT PRIMARY KEY,
  association_uuid TEXT NOT NULL REFERENCES association(uuid),
  person_uuid      TEXT NOT NULL REFERENCES person(uuid),
  motion_uuid      TEXT NOT NULL,
  started_at       TEXT NOT NULL,
  ends_at          TEXT NOT NULL,
  vacated_at       TEXT NULL
);

CREATE TABLE IF NOT EXISTS list (
  uuid         TEXT PRIMARY KEY,
  motion_uuid  TEXT NOT NULL,
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
  action           TEXT NOT NULL,   -- e.g. 'library.update', 'member.add', 'vote_rule.set'
  target_type      TEXT NOT NULL,   -- e.g. 'library', 'person', 'association'
  target_uuid      TEXT NOT NULL,
  detail           TEXT NULL,       -- human-readable description
  motion_uuid      TEXT NULL,       -- authorizing motion UUID (references library document), if any
  created_at       TEXT NOT NULL
);

-- Bulletin Board: community threads and replies

CREATE TABLE IF NOT EXISTS bulletin_post (
  uuid       TEXT PRIMARY KEY,
  author_uuid TEXT NOT NULL REFERENCES person(uuid),
  title      TEXT NOT NULL,
  body       TEXT NOT NULL,
  created_at TEXT NOT NULL,
  updated_at TEXT NULL,
  expires_at TEXT NULL,
  deleted_at TEXT NULL
);

CREATE TABLE IF NOT EXISTS bulletin_comment (
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

-- General-purpose discussion threads and comments

CREATE TABLE IF NOT EXISTS comment_thread (
  uuid       TEXT PRIMARY KEY,
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS comment (
  uuid                TEXT PRIMARY KEY,
  thread_uuid         TEXT NOT NULL REFERENCES comment_thread(uuid),
  author_uuid         TEXT NOT NULL REFERENCES person(uuid),
  parent_comment_uuid TEXT NULL REFERENCES comment(uuid),
  body                TEXT NOT NULL,
  created_at          TEXT NOT NULL,
  edited_at           TEXT NULL,
  deleted_at          TEXT NULL
);
CREATE INDEX IF NOT EXISTS idx_comment_thread ON comment(thread_uuid);
CREATE INDEX IF NOT EXISTS idx_comment_author ON comment(author_uuid);
CREATE INDEX IF NOT EXISTS idx_comment_parent ON comment(parent_comment_uuid);

-- Society Identity: Our society's identity and lineage

CREATE TABLE IF NOT EXISTS society_identity (
  handle              TEXT PRIMARY KEY,
  uuid                TEXT UNIQUE NOT NULL,
  public_key          TEXT NOT NULL,
  private_key_encrypted TEXT NOT NULL,  -- Encrypted with master key
  parent_handle       TEXT NULL,
  founding_record_json TEXT NULL,  -- Contains parent's signature
  founded_at          INTEGER NULL,
  created_at          INTEGER DEFAULT (unixepoch())
);

CREATE TABLE IF NOT EXISTS children_societies (
  handle              TEXT PRIMARY KEY,
  uuid                TEXT UNIQUE NOT NULL,
  public_key          TEXT NOT NULL,
  founding_record_json TEXT NOT NULL,  -- Contains our signature
  founded_at          INTEGER NOT NULL,
  created_at          INTEGER DEFAULT (unixepoch())
);

-- Known Societies: Cache of other societies we know about

CREATE TABLE IF NOT EXISTS societies (
  handle              TEXT PRIMARY KEY,
  uuid                TEXT UNIQUE NOT NULL,
  endpoint            TEXT NOT NULL,  -- https://columbus.bfs/
  public_key          TEXT NOT NULL,
  lineage_json        TEXT,  -- ["columbus", "detroit", "philadelphia"]
  last_lineage_verified INTEGER,
  latitude            REAL,
  longitude           REAL,
  last_interaction    INTEGER,
  interaction_count   INTEGER DEFAULT 0,
  discovered_at       INTEGER DEFAULT (unixepoch())
);

CREATE INDEX IF NOT EXISTS idx_societies_location ON societies(latitude, longitude);
CREATE INDEX IF NOT EXISTS idx_societies_interaction ON societies(last_interaction DESC);

-- Peer Vouching: Trust relationships between societies

-- Vouches we've issued to other societies
CREATE TABLE IF NOT EXISTS vouches_issued (
  vouch_id            TEXT PRIMARY KEY,  -- UUID
  vouched_for_handle  TEXT NOT NULL,
  vouch_type          TEXT NOT NULL,  -- general, banking, governance, technical
  confidence          TEXT NOT NULL,  -- strong, moderate, weak
  statement           TEXT,
  issued_at           INTEGER NOT NULL,
  currently_valid     INTEGER DEFAULT 1,
  invalidated_at      INTEGER,
  invalidation_reason TEXT,
  signature           TEXT NOT NULL,  -- Our signature over credential
  created_at          INTEGER DEFAULT (unixepoch())
);

CREATE INDEX IF NOT EXISTS idx_vouches_issued_for ON vouches_issued(vouched_for_handle);
CREATE INDEX IF NOT EXISTS idx_vouches_issued_valid ON vouches_issued(currently_valid);

-- Vouch credentials others have given us
CREATE TABLE IF NOT EXISTS vouch_credentials (
  credential_id       TEXT PRIMARY KEY,  -- UUID
  voucher_handle      TEXT NOT NULL,
  voucher_public_key  TEXT NOT NULL,
  vouch_type          TEXT NOT NULL,
  statement           TEXT,
  issued_at           INTEGER NOT NULL,
  signature           TEXT NOT NULL,  -- Voucher's signature
  verified            INTEGER DEFAULT 0,
  created_at          INTEGER DEFAULT (unixepoch())
);

CREATE INDEX IF NOT EXISTS idx_vouch_credentials_voucher ON vouch_credentials(voucher_handle);

-- Cached verification responses
CREATE TABLE IF NOT EXISTS vouch_verifications (
  verification_id     TEXT PRIMARY KEY,
  peer_handle         TEXT NOT NULL,  -- Society we're evaluating
  voucher_handle      TEXT NOT NULL,  -- Who vouched for them
  currently_valid     INTEGER NOT NULL,
  confidence          TEXT,  -- strong, moderate, weak (if valid)
  checked_at          INTEGER NOT NULL,
  response_signature  TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_vouch_verifications_peer ON vouch_verifications(peer_handle);
CREATE INDEX IF NOT EXISTS idx_vouch_verifications_fresh ON vouch_verifications(peer_handle, checked_at);

-- Injury System: Formal records of harm for College of Conciliation

CREATE TABLE IF NOT EXISTS injury_record (
  uuid          TEXT PRIMARY KEY,
  injury_number INTEGER NOT NULL UNIQUE,
  injury_types  TEXT NOT NULL,  -- CSV: physical, material, relational, systemic, communal
  incident_start TEXT NOT NULL,
  incident_end  TEXT NULL,
  location      TEXT NULL,
  filed_at      TEXT NOT NULL,
  gravity       TEXT NULL,  -- minor, moderate, severe
  safety_risk   TEXT NULL,  -- low, moderate, high
  created_at    TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_injury_record_number ON injury_record(injury_number);
CREATE INDEX IF NOT EXISTS idx_injury_record_filed_at ON injury_record(filed_at);
CREATE INDEX IF NOT EXISTS idx_injury_record_gravity ON injury_record(gravity);
CREATE INDEX IF NOT EXISTS idx_injury_record_safety_risk ON injury_record(safety_risk);

CREATE TABLE IF NOT EXISTS injury_party (
  injury_uuid TEXT NOT NULL REFERENCES injury_record(uuid) ON DELETE CASCADE,
  party_uuid  TEXT NOT NULL,  -- person, association, or society UUID
  role        TEXT NOT NULL,  -- complainant or respondent
  PRIMARY KEY (injury_uuid, party_uuid, role)
);
CREATE INDEX IF NOT EXISTS idx_injury_party_party ON injury_party(party_uuid);
CREATE INDEX IF NOT EXISTS idx_injury_party_role ON injury_party(role);

CREATE TABLE IF NOT EXISTS incident_account (
  uuid        TEXT PRIMARY KEY,
  injury_uuid TEXT NOT NULL REFERENCES injury_record(uuid) ON DELETE CASCADE,
  author_uuid TEXT NOT NULL,  -- UUID of person providing account
  author_role TEXT NOT NULL,  -- complainant, respondent, or witness
  account     TEXT NOT NULL,
  provided_at TEXT NOT NULL,
  created_at  TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_incident_account_injury ON incident_account(injury_uuid);
CREATE INDEX IF NOT EXISTS idx_incident_account_author ON incident_account(author_uuid);

`;
