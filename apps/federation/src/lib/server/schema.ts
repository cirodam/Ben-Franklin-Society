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
  status              TEXT DEFAULT 'active'  -- active, suspended, dissolved
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

`;
