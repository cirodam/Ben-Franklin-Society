# The Ben Franklin Society
## Data Model — Governance App

---

## `person`

The authoritative identity record for a member of the society. Created when membership is granted; the UUID is assigned at that moment and never changes. No auth fields live here — credentials are in a separate auth-subsystem table linked by UUID.

| Column | Type | Constraints | Description |
|---|---|---|---|
| `uuid` | TEXT | PRIMARY KEY | Permanent identifier, assigned at creation, never changes |
| `handle` | TEXT | NOT NULL, UNIQUE | Local part of the handle only — full handle is `handle@societyhandle` |
| `given_name` | TEXT | NOT NULL | |
| `family_name` | TEXT | NOT NULL | |
| `date_of_birth` | DATE | NOT NULL | Required for birthday issuance |
| `status` | TEXT | NOT NULL, DEFAULT `active` | `active`, `suspended`, `revoked` |
| `joined_at` | DATETIME | NOT NULL | When membership was granted |
| `revoked_at` | DATETIME | NULL | Set when status transitions to `revoked` |

### Notes

- `handle` uniqueness is enforced within the society. The full handle `handle@societyhandle` is globally unique across the federation by construction — the Federation enforces society handle uniqueness, and this table enforces local part uniqueness.
- `suspended` is a temporary state — the member's OIDC credential remains provisioned but access is blocked at the Governance layer. Used during disciplinary processes.
- `revoked` is permanent. On transition to `revoked`, Governance revokes the OIDC credential and sets `revoked_at`. The record is retained for ledger integrity — transactions reference this UUID and must remain resolvable.
- There is no `deleted` state. Person records are never deleted.

---

## `credentials`

Auth-subsystem only. Holds authentication state for a person. Never read outside the OIDC subsystem within Governance. One row per person.

| Column | Type | Constraints | Description |
|---|---|---|---|
| `person_uuid` | TEXT | PRIMARY KEY, FK → `person.uuid` | |
| `password_hash` | TEXT | NOT NULL | Argon2id hash |
| `mfa_enabled` | INTEGER | NOT NULL, DEFAULT 0 | Boolean |
| `mfa_secret_encrypted` | TEXT | NULL | TOTP secret, encrypted at rest. NULL if MFA not enabled |
| `failed_attempt_count` | INTEGER | NOT NULL, DEFAULT 0 | Resets to 0 on successful login |
| `locked_until` | DATETIME | NULL | Set on excessive failed attempts; NULL if not locked |
| `password_changed_at` | DATETIME | NOT NULL | Timestamp of last password change |
| `created_at` | DATETIME | NOT NULL | |

### Notes

- Argon2id is used for password hashing. bcrypt and PBKDF2 are not acceptable alternatives.
- `mfa_secret_encrypted` is encrypted with a server-side key held outside the database. The database never contains the plaintext secret.
- Lockout is enforced at the auth layer before any credential comparison is attempted — failed attempts are counted regardless of whether the password was correct.
- This table has no `updated_at` — individual fields carry their own timestamps where needed (`password_changed_at`, `locked_until`).

---

## `session`

Auth-subsystem only. One row per active session. A person may have multiple concurrent sessions (different devices). Sessions are created on login and revoked on logout, credential change, or membership revocation.

| Column | Type | Constraints | Description |
|---|---|---|---|
| `uuid` | TEXT | PRIMARY KEY | Session ID |
| `person_uuid` | TEXT | NOT NULL, FK → `person.uuid` | |
| `refresh_token_hash` | TEXT | NOT NULL, UNIQUE | Argon2id hash of the refresh token — raw token is never stored |
| `acting_as_uuid` | TEXT | NOT NULL | The principal UUID currently active for this session — defaults to `person_uuid`, may be an association UUID |
| `user_agent` | TEXT | NULL | For display in active-session management UI |
| `ip_address` | TEXT | NULL | At session creation only; not updated |
| `created_at` | DATETIME | NOT NULL | |
| `last_active_at` | DATETIME | NOT NULL | Updated on each token refresh |
| `expires_at` | DATETIME | NOT NULL | Hard expiry regardless of activity |
| `revoked_at` | DATETIME | NULL | Set on explicit revocation; NULL if still valid |

### Notes

- The raw refresh token is issued to the client and never stored. Only the hash is retained. If the hash cannot be matched, the session is invalid.
- `acting_as_uuid` records the current acting-as context. When a member switches context (e.g. from themselves to an association), the session row is updated and a new access token is issued with the updated claims.
- `ip_address` is stored at creation for session display purposes only — it is not used for ongoing validation. Sessions are not invalidated by IP change.
- On `person.status` transitioning to `suspended` or `revoked`, all session rows for that person have `revoked_at` set immediately. Outstanding access tokens expire naturally (they are short-lived); refresh attempts against revoked sessions are rejected.

---

## `association`

A group of persons acting together for a defined purpose. Associations are first-class principals — they share the handle namespace with persons, can hold bank accounts, have a mailbox, and operate in the marketplace.

| Column | Type | Constraints | Description |
|---|---|---|---|
| `uuid` | TEXT | PRIMARY KEY | Permanent identifier, assigned at creation, never changes |
| `handle` | TEXT | NOT NULL, UNIQUE | Local part of the handle. Shares the namespace with `person.handle` — uniqueness across both tables is enforced at the application layer |
| `name` | TEXT | NOT NULL | Display name — separate from the handle |
| `type` | TEXT | NOT NULL | `association`, `service`, `college`, `committee`, `assembly` |
| `status` | TEXT | NOT NULL, DEFAULT `active` | `active`, `dissolved` |
| `established_by_motion_uuid` | TEXT | NULL | The motion whose structured effect created this association. Only set for Assembly-established associations (services, colleges, committees). NULL for self-organized associations (clubs, churches, private groups) |
| `created_at` | DATETIME | NOT NULL | |
| `dissolved_at` | DATETIME | NULL | Set when status transitions to `dissolved` |

### Notes

- Handle uniqueness spans both `person` and `association`. The application checks both tables before inserting a new handle in either. The full handle `handle@societyhandle` is globally unique across the federation by the same construction as for persons.
- `established_by_motion_uuid` is NULL for self-organized associations — clubs, churches, community groups that members create directly without Assembly action. It is only set for Assembly-established associations: services, colleges, and committees.
- `type` has no effect on how the rest of the system treats the association. Satellite apps see no distinction. Type is a Governance concern only — it determines how membership is populated and what governance rules apply.
- Dissolved associations are retained. Their UUIDs remain resolvable for ledger and document history.
- There is exactly one row with `type = assembly` at any time. The Assembly is an association like any other in the data model.

---

## `association_member`

The membership roster of an association. A person may belong to many associations; an association has many members.

| Column | Type | Constraints | Description |
|---|---|---|---|
| `association_uuid` | TEXT | NOT NULL, FK → `association.uuid` | |
| `person_uuid` | TEXT | NOT NULL, FK → `person.uuid` | |
| `joined_at` | DATETIME | NOT NULL | |
| `removed_at` | DATETIME | NULL | Set when the person leaves or is removed. NULL if currently a member |

Primary key: `(association_uuid, person_uuid)`

### Notes

- Rows are never deleted — the history of who belonged to an association is part of the governance record.
- A person is a current member of an association if their row has `removed_at IS NULL`.

---

## `role`

A named role defined by an association, composed of permissions from one or more satellite apps. Roles are the mechanism through which associations grant access to satellite app functions.

| Column | Type | Constraints | Description |
|---|---|---|---|
| `uuid` | TEXT | PRIMARY KEY | |
| `association_uuid` | TEXT | NOT NULL, FK → `association.uuid` | The association that owns this role |
| `name` | TEXT | NOT NULL | Human-readable role name, unique within the association |
| `created_at` | DATETIME | NOT NULL | |

Unique constraint: `(association_uuid, name)`

---

## `role_permission`

The permissions that make up a role. Each row grants one named permission in one app.

| Column | Type | Constraints | Description |
|---|---|---|---|
| `role_uuid` | TEXT | NOT NULL, FK → `role.uuid` | |
| `app` | TEXT | NOT NULL | The app that defines this permission: `governance`, `community_bank`, `mail`, `marketplace` |
| `permission` | TEXT | NOT NULL | The permission name as published by the app |

Primary key: `(role_uuid, app, permission)`

### Notes

- The set of valid permissions per app is defined by the app, not by this table. The app validates on session resolution — if a stored permission name is no longer recognized by the app, it is silently ignored.
- The `act-as` permission is a valid value for `permission`. It is what grants a person the ability to act as the association in satellite apps.

---

## `person_role`

Which persons hold which roles within an association.

| Column | Type | Constraints | Description |
|---|---|---|---|
| `person_uuid` | TEXT | NOT NULL, FK → `person.uuid` | |
| `role_uuid` | TEXT | NOT NULL, FK → `role.uuid` | |
| `association_uuid` | TEXT | NOT NULL, FK → `association.uuid` | Denormalized from `role` for query convenience |
| `assigned_at` | DATETIME | NOT NULL | |
| `removed_at` | DATETIME | NULL | NULL if currently held |

Primary key: `(person_uuid, role_uuid)`

### Notes

- Rows are never deleted — role assignment history is part of the governance record.
- A person currently holds a role if their row has `removed_at IS NULL`.
- When the OIDC session is issued, the app resolves the person's current roles in the `acting_as` association and unions all `role_permission` rows for those roles into the `permissions` claim.

---

## `document`

A structured governing or operational document in the Document Library.

| Column | Type | Constraints | Description |
|---|---|---|---|
| `uuid` | TEXT | PRIMARY KEY | |
| `title` | TEXT | NOT NULL | |
| `slug` | TEXT | NOT NULL, UNIQUE | URL-safe identifier, unique across all documents |
| `owner_uuid` | TEXT | NULL, FK → `association.uuid` | The association that owns this document. NULL if owned by the society at large |
| `status` | TEXT | NOT NULL, DEFAULT `active` | `active`, `superseded`, `withdrawn` |
| `created_at` | DATETIME | NOT NULL | |
| `created_by_motion_uuid` | TEXT | NULL, FK → `motion.uuid` | The motion that established this document, if any |

### Notes

- Documents are never deleted. `superseded` means replaced by a newer document; `withdrawn` means retired without replacement.
- Governing documents (charter, constitution, bylaws, standing rules, ordinances) are unowned (`owner_uuid IS NULL`).
- Association-owned documents are published under that association's authority — College standards, Service operating procedures, etc.

---

## `article`

A top-level division of a document. Documents are composed of articles; articles are composed of sections.

| Column | Type | Constraints | Description |
|---|---|---|---|
| `uuid` | TEXT | PRIMARY KEY | |
| `document_uuid` | TEXT | NOT NULL, FK → `document.uuid` | |
| `number` | INTEGER | NOT NULL | Display ordering within the document |
| `title` | TEXT | NOT NULL | |

Unique constraint: `(document_uuid, number)`

---

## `section`

The atomic unit of a document. Each section has operative prose and a rationale.

| Column | Type | Constraints | Description |
|---|---|---|---|
| `uuid` | TEXT | PRIMARY KEY | |
| `article_uuid` | TEXT | NOT NULL, FK → `article.uuid` | |
| `number` | INTEGER | NOT NULL | Display ordering within the article — displayed as `article.number`.`section.number` |
| `prose` | TEXT | NOT NULL | The operative text |
| `rationale` | TEXT | NOT NULL | The reasoning behind it |
| `version` | INTEGER | NOT NULL, DEFAULT 1 | Incremented on each amendment |
| `amended_by_motion_uuid` | TEXT | NULL, FK → `motion.uuid` | The most recent motion that amended this section |

Unique constraint: `(article_uuid, number)`

### Notes

- When a section is amended, the existing row is updated in place (`prose`, `rationale`, `version`, `amended_by_motion_uuid`) and a `section_history` row is inserted capturing the prior state.
- Section numbers are stable — they do not renumber when other sections are amended.

---

## `section_history`

Immutable record of prior versions of a section. Inserted on every amendment.

| Column | Type | Constraints | Description |
|---|---|---|---|
| `uuid` | TEXT | PRIMARY KEY | |
| `section_uuid` | TEXT | NOT NULL, FK → `section.uuid` | |
| `version` | INTEGER | NOT NULL | The version number this row captures |
| `prose` | TEXT | NOT NULL | |
| `rationale` | TEXT | NOT NULL | |
| `amended_by_motion_uuid` | TEXT | NOT NULL, FK → `motion.uuid` | The motion that replaced this version |
| `recorded_at` | DATETIME | NOT NULL | |

---

## `motion`

A governance decision moving through the deliberative process.

| Column | Type | Constraints | Description |
|---|---|---|---|
| `uuid` | TEXT | PRIMARY KEY | |
| `title` | TEXT | NOT NULL | |
| `body` | TEXT | NOT NULL | Full text of the motion (Markdown) |
| `introduced_by_uuid` | TEXT | NOT NULL, FK → `person.uuid` | The person who introduced the motion |
| `body_uuid` | TEXT | NOT NULL, FK → `association.uuid` | The association before which the motion is placed — Committee, Assembly, or a dedicated referendum association |
| `status` | TEXT | NOT NULL, DEFAULT `draft` | `draft`, `introduced`, `deliberation`, `vote`, `enacted`, `rejected`, `withdrawn` |
| `created_at` | DATETIME | NOT NULL | |
| `enacted_at` | DATETIME | NULL | Set when status transitions to `enacted` |
| `resolved_at` | DATETIME | NULL | Set when status reaches any terminal state (`enacted`, `rejected`, `withdrawn`) |

### Notes

- Any person may introduce a motion (`introduced_by_uuid`). The `body_uuid` determines who may advance it and who may vote.
- Motions are never deleted. The full history of every motion — including withdrawn and rejected ones — is part of the governance record.
- When a motion is enacted, any attached `motion_effect` rows are executed atomically with the status update. If any effect fails, the motion does not advance to `enacted`.

---

## `motion_vote_tally`

The vote count for a motion. Created when a motion enters `vote` status; closed when the vote concludes. Voting is secret ballot — the tally stores counts only, not how any individual voted.

| Column | Type | Constraints | Description |
|---|---|---|---|
| `motion_uuid` | TEXT | PRIMARY KEY, FK → `motion.uuid` | |
| `eligible_count` | INTEGER | NOT NULL | Snapshot of the number of eligible voters at the time the vote opened |
| `aye_count` | INTEGER | NOT NULL, DEFAULT 0 | |
| `nay_count` | INTEGER | NOT NULL, DEFAULT 0 | |
| `abstain_count` | INTEGER | NOT NULL, DEFAULT 0 | |
| `opened_at` | DATETIME | NOT NULL | When the vote was opened |
| `closed_at` | DATETIME | NULL | When the vote was closed; NULL while open |

### Notes

- `eligible_count` is a snapshot taken when the vote opens — the current membership of the `body_uuid` association. It is not recomputed as members are added or removed during the vote.
- `aye_count + nay_count + abstain_count` ≤ `eligible_count` at all times.
- When the vote closes, `closed_at` is set and the motion status advances to `enacted` or `rejected` based on the outcome. The determination rule (simple majority, supermajority, etc.) is a governance concern applied at vote-close time, not encoded in this table.

---

## `motion_vote_receipt`

Records that a specific person has cast a ballot on a motion. Does not record how they voted — that is irrecoverably lost by design.

| Column | Type | Constraints | Description |
|---|---|---|---|
| `uuid` | TEXT | PRIMARY KEY | |
| `motion_uuid` | TEXT | NOT NULL, FK → `motion.uuid` | |
| `voter_uuid` | TEXT | NOT NULL, FK → `person.uuid` | |
| `voted_at` | DATETIME | NOT NULL | |

Unique constraint: `(motion_uuid, voter_uuid)`

### Notes

- Used to enforce one-vote-per-member: before accepting a vote, the app checks that no receipt exists for `(motion_uuid, voter_uuid)`.
- The receipt insert and the tally increment are executed in a single atomic transaction. A receipt without a corresponding tally increment, or vice versa, is a data integrity error.
- Turnout is computable as `COUNT(receipts for motion) / tally.eligible_count`.
- Receipts cannot be deleted. Once cast, a vote cannot be retracted.

---

## `motion_comment`

Comments posted on a motion by members during any stage.

| Column | Type | Constraints | Description |
|---|---|---|---|
| `uuid` | TEXT | PRIMARY KEY | |
| `motion_uuid` | TEXT | NOT NULL, FK → `motion.uuid` | |
| `author_uuid` | TEXT | NOT NULL, FK → `person.uuid` | |
| `body` | TEXT | NOT NULL | (Markdown) |
| `created_at` | DATETIME | NOT NULL | |
| `edited_at` | DATETIME | NULL | |
| `deleted_at` | DATETIME | NULL | Soft delete — body replaced with a tombstone message |

---

## `motion_effect`

A machine-readable structured effect attached to a motion. Executed automatically when the motion is enacted.

| Column | Type | Constraints | Description |
|---|---|---|---|
| `uuid` | TEXT | PRIMARY KEY | |
| `motion_uuid` | TEXT | NOT NULL, FK → `motion.uuid` | |
| `type` | TEXT | NOT NULL | `amend_section`, `create_association`, `add_association_member`, `remove_association_member`, `create_scheduled_transfer`, `modify_scheduled_transfer`, `cancel_scheduled_transfer`, `create_calendar_event`, `update_config` |
| `payload` | TEXT | NOT NULL | JSON — the parameters for the effect, specific to each type |
| `executed_at` | DATETIME | NULL | Set when the effect is successfully executed |
| `error` | TEXT | NULL | Set if execution failed — for diagnostic purposes |

### Notes

- A motion may carry zero or more effects. A motion with no effects is declaratory — binding on the community but executed by humans.
- Effects are executed in insertion order.
- The `payload` schema is defined per `type` and validated before the motion advances to `vote` status — effects with invalid payloads are caught early, not at enactment.

---

## `calendar_event`

An event on the community calendar.

| Column | Type | Constraints | Description |
|---|---|---|---|
| `uuid` | TEXT | PRIMARY KEY | |
| `title` | TEXT | NOT NULL | |
| `description` | TEXT | NULL | (Markdown) |
| `organizer_uuid` | TEXT | NOT NULL | Principal UUID of the organizer — person or association |
| `starts_at` | DATETIME | NOT NULL | |
| `ends_at` | DATETIME | NULL | |
| `location` | TEXT | NULL | Free text |
| `created_by_motion_uuid` | TEXT | NULL, FK → `motion.uuid` | Set if this event was created as a structured motion effect |
| `created_at` | DATETIME | NOT NULL | |
| `cancelled_at` | DATETIME | NULL | |

---

## `community_config`

Key/value store for society-wide configuration. One row per key; updated in place. All changes are authored by a motion effect.

| Column | Type | Constraints | Description |
|---|---|---|---|
| `key` | TEXT | PRIMARY KEY | Identifier for the config value — e.g. `dues_rate_monthly`, `demurrage_rate`, `demurrage_threshold`, `demurrage_type` |
| `value` | TEXT | NOT NULL | The current value. Interpretation is application-defined per key |
| `description` | TEXT | NOT NULL | Human-readable explanation of what this key controls |
| `updated_by_motion_uuid` | TEXT | NOT NULL, FK → `motion.uuid` | The motion whose effect last changed this value |
| `updated_at` | DATETIME | NOT NULL | |

### Notes

- Keys are strings by convention. The application is responsible for parsing and validating the value for each key.
- Known keys at launch:

| Key | Description |
|---|---|
| `dues_rate_monthly` | Monthly dues amount in Franks |
| `demurrage_rate` | Demurrage rate as a decimal fraction, e.g. `0.02` for 2% |
| `demurrage_threshold` | Balance above which demurrage applies, in Franks |
| `demurrage_type` | `recirculation` (→ Treasury) or `contraction` (→ Central Bank account) |
| `demurrage_schedule` | Cron expression for demurrage runs |
| `birthday_issuance_amount` | Franks issued per member per birthday |
| `society_latitude` | Decimal latitude of the society's primary location, e.g. `42.3601` |
| `society_longitude` | Decimal longitude of the society's primary location, e.g. `-71.0589` |
| `federation_radius_km` | Default radius in kilometers for browsing neighboring societies, e.g. `50` |

- The table is read at runtime by the Community Bank's scheduled jobs and the Central Bank module. Satellite apps that need config values receive them via events or API calls to Governance — they do not hold a copy.
- There is no default row. Every key must be explicitly set by a motion before it is used. A missing key is a configuration error.

---

## `community_config_history`

Immutable log of every past value for every config key. Inserted before each update to `community_config`.

| Column | Type | Constraints | Description |
|---|---|---|---|
| `uuid` | TEXT | PRIMARY KEY | |
| `key` | TEXT | NOT NULL | The config key |
| `value` | TEXT | NOT NULL | The value that was replaced |
| `updated_by_motion_uuid` | TEXT | NOT NULL, FK → `motion.uuid` | The motion that replaced this value |
| `superseded_at` | DATETIME | NOT NULL | When the replacement occurred |

### Notes

- The full history of any key is `SELECT * FROM community_config_history WHERE key = ? ORDER BY superseded_at` plus the current row in `community_config`.
- History rows are never deleted.

---

## `neighboring_society`

A registry of other Ben Franklin Society communities known to this society. Neighbors are discovered via the Federation, which introduces communities within proximity of each other. Once introduced, communities check in with each other directly on a periodic basis to confirm reachability — the Federation is not involved in ongoing health checks.

Satellite apps (primarily Marketplace) query this table to discover neighbor endpoints for pull-based federation.

| Column | Type | Constraints | Description |
|---|---|---|---|
| `uuid` | TEXT | PRIMARY KEY | This society's local identifier for the neighbor record |
| `society_handle` | TEXT | NOT NULL, UNIQUE | The neighbor's society handle |
| `name` | TEXT | NOT NULL | The neighbor's display name |
| `endpoint` | TEXT | NOT NULL | Base URL of the neighbor's app stack — used by satellite apps to pull data |
| `latitude` | REAL | NOT NULL | |
| `longitude` | REAL | NOT NULL | |
| `distance_km` | REAL | NOT NULL | Distance from this society, calculated by the Federation at introduction time |
| `status` | TEXT | NOT NULL, DEFAULT `active` | `active`, `unreachable` — updated by direct peer health checks |
| `first_seen_at` | DATETIME | NOT NULL | When the Federation first introduced this neighbor |
| `last_checked_at` | DATETIME | NULL | When this society last attempted a direct health check |
| `last_seen_at` | DATETIME | NULL | When the neighbor last responded successfully to a direct health check |

### Notes

- Rows are created in three ways:
  - **Proximity introduction** — the Federation introduces nearby societies at registration time and periodically as new societies join the federation
  - **On-demand discovery** — when this society needs to reach a society not yet in this table, it queries the Federation for that society's contact details and inserts a row
  - **Peer gossip (fallback)** — if the Federation is unreachable during on-demand discovery, this society may ask a known neighbor for the contact details. Peer-provided rows are accepted provisionally and their public key is verified against the Federation when it is next reachable.
- Subsequent updates to `status`, `last_checked_at`, and `last_seen_at` are made by this society's own periodic peer health checks, not by the Federation.
- `distance_km` is computed by the Federation using the Haversine formula from each society's registered lat/long. It is a snapshot — it does not update if a society moves its registered location until re-synced.
- `status = unreachable` is set locally when health checks fail consistently. The Marketplace app suppresses unreachable neighbors from the browse UI rather than showing an error on every pull attempt.
- The health check mechanism is a simple liveness ping against the neighbor's `endpoint`. It does not require authentication.
