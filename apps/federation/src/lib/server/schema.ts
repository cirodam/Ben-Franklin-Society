export const schema = /* sql */ `

-- Federation Society Registry
-- Discovery index for all Ben Franklin Societies
-- Note: This is NOT the source of truth - the cryptographic lineage chain is
-- The Federation provides convenient discovery and caching

CREATE TABLE IF NOT EXISTS societies (
  handle              TEXT PRIMARY KEY,
  uuid                TEXT UNIQUE NOT NULL,
  parent_handle       TEXT NULL,
  public_key          TEXT NOT NULL,
  endpoint            TEXT NOT NULL,  -- https://columbus.bfs/
  founding_record_json TEXT NOT NULL,  -- Contains parent's signature
  founded_at          INTEGER NOT NULL,
  registered_at       INTEGER DEFAULT (unixepoch()),
  status              TEXT DEFAULT 'active',  -- active, suspended, dissolved
  last_updated        INTEGER,
  update_count        INTEGER DEFAULT 0,
  endpoint_type       TEXT DEFAULT 'hostname'  -- 'hostname' | 'ip'
);

CREATE INDEX IF NOT EXISTS idx_societies_parent ON societies(parent_handle);
CREATE INDEX IF NOT EXISTS idx_societies_founded ON societies(founded_at);
CREATE INDEX IF NOT EXISTS idx_societies_status ON societies(status);

-- Lineage Cache: Precomputed lineage chains for fast lookups

CREATE TABLE IF NOT EXISTS lineage_cache (
  society_handle      TEXT PRIMARY KEY,
  lineage_json        TEXT NOT NULL,  -- ["handle", "parent", "grandparent", ...]
  computed_at         INTEGER DEFAULT (unixepoch()),
  FOREIGN KEY (society_handle) REFERENCES societies(handle)
);

-- DNS Records: Multiple record types per domain

CREATE TABLE IF NOT EXISTS dns_records (
  id                  INTEGER PRIMARY KEY AUTOINCREMENT,
  society_handle      TEXT NOT NULL,
  record_type         TEXT NOT NULL,  -- A, AAAA, CNAME, TXT, MX
  record_value        TEXT NOT NULL,
  ttl                 INTEGER DEFAULT 3600,
  priority            INTEGER,  -- For MX records
  created_at          INTEGER NOT NULL DEFAULT (unixepoch()),
  updated_at          INTEGER NOT NULL DEFAULT (unixepoch()),
  FOREIGN KEY (society_handle) REFERENCES societies(handle) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_dns_records_handle ON dns_records(society_handle);
CREATE INDEX IF NOT EXISTS idx_dns_records_type ON dns_records(society_handle, record_type);
CREATE UNIQUE INDEX IF NOT EXISTS idx_dns_records_unique ON dns_records(society_handle, record_type, record_value);

-- Update Audit Log: Track all domain/DNS changes

CREATE TABLE IF NOT EXISTS update_log (
  id                  INTEGER PRIMARY KEY AUTOINCREMENT,
  society_handle      TEXT NOT NULL,
  update_type         TEXT NOT NULL,  -- 'endpoint' | 'dns_add' | 'dns_remove' | 'status'
  old_value           TEXT,
  new_value           TEXT,
  signature           TEXT NOT NULL,  -- Proof of authenticity
  updated_at          INTEGER NOT NULL DEFAULT (unixepoch()),
  updated_by_ip       TEXT,
  FOREIGN KEY (society_handle) REFERENCES societies(handle)
);

CREATE INDEX IF NOT EXISTS idx_update_log_handle ON update_log(society_handle);
CREATE INDEX IF NOT EXISTS idx_update_log_date ON update_log(updated_at);

-- WHOIS Cache: Precomputed WHOIS responses

CREATE TABLE IF NOT EXISTS whois_cache (
  society_handle      TEXT PRIMARY KEY,
  whois_json          TEXT NOT NULL,
  computed_at         INTEGER NOT NULL DEFAULT (unixepoch()),
  FOREIGN KEY (society_handle) REFERENCES societies(handle)
);

-- Status History: Track status lifecycle changes

CREATE TABLE IF NOT EXISTS status_history (
  id                  INTEGER PRIMARY KEY AUTOINCREMENT,
  society_handle      TEXT NOT NULL,
  old_status          TEXT,
  new_status          TEXT NOT NULL,
  reason              TEXT,  -- Optional reason for status change
  changed_by          TEXT,  -- Admin/system identifier
  changed_at          INTEGER NOT NULL DEFAULT (unixepoch()),
  FOREIGN KEY (society_handle) REFERENCES societies(handle)
);

CREATE INDEX IF NOT EXISTS idx_status_history_handle ON status_history(society_handle);
CREATE INDEX IF NOT EXISTS idx_status_history_date ON status_history(changed_at);

`;
