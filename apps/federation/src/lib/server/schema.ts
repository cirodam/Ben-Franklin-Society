export const schema = /* sql */ `

-- Federation Society Registry
-- Discovery index for all Ben Franklin Societies
-- Note: This is NOT the source of truth - the cryptographic lineage chain is
-- The Federation provides convenient discovery and caching

CREATE TABLE IF NOT EXISTS societies (
  uuid                TEXT PRIMARY KEY,
  handle              TEXT UNIQUE NOT NULL,
  parent_uuid         TEXT NULL,
  public_key          TEXT NOT NULL,
  
  -- Multi-path connectivity (DNS independence)
  bfs_url             TEXT NULL,      -- athens.bfs
  url                 TEXT NULL,      -- https://bfsathensga.org
  ip_address          TEXT NULL,      -- 203.0.113.42
  port                INTEGER DEFAULT 5173,
  
  founding_record_json TEXT NOT NULL,  -- Contains parent's signature
  founded_at          INTEGER NOT NULL,
  registered_at       INTEGER DEFAULT (unixepoch()),
  status              TEXT DEFAULT 'active',  -- active, suspended, dissolved
  
  -- Society metrics (self-reported)
  people_count        INTEGER NULL,    -- Current member count
  person_years        INTEGER NULL,    -- Cumulative person-years metric
  
  -- Federation issuance tracking
  issued_florens      INTEGER DEFAULT 0  -- Florens issued by Federation
);

CREATE INDEX IF NOT EXISTS idx_societies_handle ON societies(handle);
CREATE INDEX IF NOT EXISTS idx_societies_parent ON societies(parent_uuid);
CREATE INDEX IF NOT EXISTS idx_societies_founded ON societies(founded_at);
CREATE INDEX IF NOT EXISTS idx_societies_status ON societies(status);

-- Floren Command Outbox: Queue of commands to be sent to Community Banks
-- Transactional outbox pattern for reliable Floren issuance delivery
CREATE TABLE IF NOT EXISTS floren_command_outbox (
  uuid                TEXT PRIMARY KEY,
  society_uuid        TEXT NOT NULL,
  command_type        TEXT NOT NULL,
  payload             TEXT NOT NULL,
  created_at          TEXT NOT NULL,
  delivered_at        TEXT NULL,
  failed_attempts     INTEGER DEFAULT 0,
  last_error          TEXT NULL,
  next_retry_after    TEXT NULL,
  FOREIGN KEY (society_uuid) REFERENCES societies(uuid)
);

CREATE INDEX IF NOT EXISTS idx_floren_outbox_delivery ON floren_command_outbox(delivered_at, next_retry_after);
CREATE INDEX IF NOT EXISTS idx_floren_outbox_society ON floren_command_outbox(society_uuid);

`;
