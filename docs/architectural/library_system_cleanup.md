# Library System Cleanup Plan

## Current State: Base Document Fields

### All Documents Have (Top-Level)

**In JSON files AND TypeScript interface:**
- `uuid` - Unique identifier (string)
- `type` - Document type ('governing', 'motion', 'prose', 'contract', etc.)
- `slug` - URL-safe unique identifier
- `title` - Display name
- `owner_uuid` - FK to person or association
- `created_at` - ISO 8601 timestamp
- `updated_at` - ISO 8601 timestamp
- `content` - Type-specific content object (varies by document type)

**In database `library_item` table only:**
- `file_path` - Where to find the JSON file (e.g., 'governing/charter.json')
- `metadata_json` - Cached searchable metadata (currently stores status, seniority for governing docs)

### Status: ✅ Consistent

The base structure is consistent across:
- TypeScript types (`LibraryDocument<TContent>`)
- Actual JSON files (charter, motions, prose all match)
- Database schema (mirrors base fields + adds indexing fields)

### Example Documents

**Charter:**
```json
{
  "uuid": "4d3c4de1-d96f-478d-98bd-86276d7be30e",
  "type": "governing",
  "slug": "charter",
  "title": "Charter of the Benjamin Franklin Societies",
  "owner_uuid": "SOCIETY",
  "created_at": "2026-01-01T00:00:00Z",
  "updated_at": "2026-01-01T00:00:00Z",
  "content": { ...governing-specific content... }
}
```

**Motion:**
```json
{
  "uuid": "6ab829e5-29e0-4cce-85e2-1e8157e20532",
  "type": "motion",
  "slug": "motion-1fce3c59",
  "title": "test",
  "owner_uuid": "3638afd2-8099-4e8b-8331-2fcd0418069c",
  "created_at": "2026-05-19T20:49:20.795Z",
  "updated_at": "2026-05-19T20:49:20.795Z",
  "content": { ...motion-specific content... }
}
```

---

## Proposed Changes: Add Universal Fields

### New Fields for All Documents

**`document_id`** (string, optional)
- User-assignable identifier for their own purposes
- Not used by system for lookups (slug remains the URL identifier)
- Allows users to maintain their own numbering/coding schemes
- Examples: "BFS-2026-001", "CHARTER-v1", "POLICY-HR-001"
- Nullable/optional - not required

**`version`** (number or string?)
- Version number for tracking document revisions
- Question: Semantic versioning (1.0.0) or simple integer (1, 2, 3)?
- Question: Auto-increment on update or manually set?
- Question: Should version history be tracked separately?

### Location in Structure

Both fields would be top-level (alongside uuid, slug, title):

```json
{
  "uuid": "...",
  "type": "governing",
  "slug": "charter",
  "document_id": "BFS-CHARTER-2026",  // NEW
  "version": 1,                        // NEW
  "title": "Charter of the Benjamin Franklin Societies",
  "owner_uuid": "...",
  "created_at": "...",
  "updated_at": "...",
  "content": { ... }
}
```

### Database Impact

Add to `library_item` table:
```sql
document_id TEXT NULL,
version INTEGER NOT NULL DEFAULT 1
```

Optional: Add index on document_id if used for searching
```sql
CREATE INDEX idx_library_item_document_id ON library_item(document_id);
```

### Questions to Resolve

1. Should `document_id` be unique globally? Per type? Or not enforced?
2. Version numbering scheme: integer vs semantic versioning?
3. Auto-increment version on save, or user-controlled?
4. Display version in UI? In listings or only detail view?

---

## Decisions Made

### Add to Database Schema

**Add:**
- `document_id TEXT NULL` - User-assignable identifier (not unique, optional)
- `version INTEGER NOT NULL DEFAULT 1` - Simple integer versioning

**Remove:**
- `metadata_json TEXT NULL` - Removing cached metadata approach

**Rationale for removing metadata_json:**
- Adds complexity to keep in sync
- Not clear what should be cached vs loaded from file
- Can query by fields already in the table (type, owner, title)
- For full-text search of document content, better to load files or use dedicated search index

### Updated Schema

```sql
CREATE TABLE library_item (
  uuid          TEXT PRIMARY KEY,
  type          TEXT NOT NULL,
  slug          TEXT NOT NULL UNIQUE,
  document_id   TEXT NULL,              -- NEW: User-assignable ID
  version       INTEGER NOT NULL DEFAULT 1,  -- NEW: Version number
  title         TEXT NOT NULL,
  owner_uuid    TEXT NOT NULL,
  created_at    TEXT NOT NULL,
  updated_at    TEXT NOT NULL,
  file_path     TEXT NOT NULL
  -- REMOVED: metadata_json
);

CREATE INDEX idx_library_item_type ON library_item(type);
CREATE INDEX idx_library_item_owner ON library_item(owner_uuid);
CREATE INDEX idx_library_item_slug ON library_item(slug);
-- Optional: CREATE INDEX idx_library_item_document_id ON library_item(document_id);
```

### Migration Steps

**Since recreating database from scratch:**

1. ✅ **Update schema definition** - scripts/migrate-library-add-document-id-version.sql now has the canonical schema
2. **Update TypeScript types** - Add document_id and version to LibraryDocument interface
3. **Update library.ts functions** - Handle new fields in save/load/sync operations
4. **Update all JSON files** - Add document_id (null for now) and version (1) to existing documents
5. **Update UI** - Add fields to creation/edit forms, display in detail views
6. **Recreate database** - Run the new schema, re-sync all documents from JSON files

---

## Implementation Checklist

### Phase 1: Schema & Types
- [ ] Database schema updated (in migrate-library-add-document-id-version.sql)
- [ ] TypeScript LibraryDocument interface updated
- [ ] TypeScript LibraryItemRow interface updated (for DB queries)

### Phase 2: Backend
- [ ] Update syncLibraryItem() to include document_id and version
- [ ] Update searchLibrary() to return new fields
- [ ] Update document loaders (loadGoverningDocument, etc.) to expect new fields
- [ ] Update document savers to write new fields

### Phase 3: Documents
- [ ] Add document_id: null and version: 1 to charter.json
- [ ] Add to other governing documents
- [ ] Add to motion documents
- [ ] Add to prose documents

### Phase 4: UI
- [ ] Display document_id and version in document detail views
- [ ] Add document_id field to document creation forms (optional)
- [ ] Show version in library listings?
- [ ] Version increment UI (manual or automatic?)

---

