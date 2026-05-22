export const schema = /* sql */ `

CREATE TABLE IF NOT EXISTS config (
  key   TEXT PRIMARY KEY,
  value TEXT NOT NULL
);

-- Buckets: One per user, one per association
CREATE TABLE IF NOT EXISTS buckets (
  id INTEGER PRIMARY KEY,
  bucket_key TEXT UNIQUE NOT NULL,  -- 'user-{uuid}' or 'association-{handle}'
  owner_type TEXT NOT NULL,         -- 'user' or 'association'
  owner_id TEXT NOT NULL,           -- user_uuid or association_handle
  created_at TEXT NOT NULL,
  UNIQUE(owner_type, owner_id)
);

CREATE INDEX IF NOT EXISTS idx_buckets_owner ON buckets(owner_type, owner_id);

-- Folders: Hierarchical organization within buckets
CREATE TABLE IF NOT EXISTS folders (
  id INTEGER PRIMARY KEY,
  bucket_id INTEGER NOT NULL,
  parent_folder_id INTEGER,         -- NULL for root folders
  name TEXT NOT NULL,
  path TEXT NOT NULL,               -- Full path: /budgets/2026
  created_at TEXT NOT NULL,
  created_by TEXT NOT NULL,         -- user_uuid
  FOREIGN KEY (bucket_id) REFERENCES buckets(id) ON DELETE CASCADE,
  FOREIGN KEY (parent_folder_id) REFERENCES folders(id) ON DELETE CASCADE,
  UNIQUE(bucket_id, path)
);

CREATE INDEX IF NOT EXISTS idx_folders_bucket ON folders(bucket_id);
CREATE INDEX IF NOT EXISTS idx_folders_parent ON folders(parent_folder_id);

-- Files: Actual file metadata
CREATE TABLE IF NOT EXISTS files (
  id INTEGER PRIMARY KEY,
  bucket_id INTEGER NOT NULL,
  folder_id INTEGER,                -- NULL for root files
  filename TEXT NOT NULL,
  path TEXT NOT NULL,               -- Full path: /budgets/2026/Q1-budget.pdf
  storage_path TEXT NOT NULL,       -- Physical path on disk: data/buckets/{bucket_id}/{hash}.ext
  mime_type TEXT,
  size_bytes INTEGER NOT NULL,
  uploaded_at TEXT NOT NULL,
  uploaded_by TEXT NOT NULL,        -- user_uuid
  FOREIGN KEY (bucket_id) REFERENCES buckets(id) ON DELETE CASCADE,
  FOREIGN KEY (folder_id) REFERENCES folders(id) ON DELETE CASCADE,
  UNIQUE(bucket_id, path)
);

CREATE INDEX IF NOT EXISTS idx_files_bucket ON files(bucket_id);
CREATE INDEX IF NOT EXISTS idx_files_folder ON files(folder_id);
CREATE INDEX IF NOT EXISTS idx_files_uploaded_at ON files(uploaded_at);

`;

export const migrations: string[] = [
	// Future migrations go here
];
