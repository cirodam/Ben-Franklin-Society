# Library System Architecture

## Overview

Refactor the governance app to use a unified **Library System** - a flexible, document-based storage system for all structured content (governing documents, motions, budgets, reports, etc.).

**Core Philosophy:** "Google Drive" model where JSON documents are the source of truth, with a database index for fast querying.

---

## Architecture

### File Storage

```
data/library/
├── governing/
│   ├── charter.json
│   ├── constitution.json
│   └── bylaws-*.json
├── motions/
│   ├── motion-2026-001.json
│   ├── motion-2026-002.json
│   └── ...
├── budgets/
│   └── 2026-q1.json
└── reports/
    └── annual-2025.json
```

**Benefits:**
- Documents are source of truth (git-friendly, easy backups)
- Human-readable/editable
- No schema migrations for new document types
- Type-specific structure lives in JSON
- Easy to version control and audit

### Database Index

```sql
CREATE TABLE library_item (
  uuid TEXT PRIMARY KEY,
  type TEXT NOT NULL,           -- 'governing', 'motion', 'budget', 'report'
  slug TEXT UNIQUE NOT NULL,
  title TEXT NOT NULL,
  owner_uuid TEXT NOT NULL,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  file_path TEXT NOT NULL,      -- relative: 'motions/motion-2026-001.json'
  
  -- Cached metadata for fast queries (extracted from content)
  metadata_json TEXT,           -- JSON string with type-specific searchable fields
  
  FOREIGN KEY (owner_uuid) REFERENCES person(uuid)
);

CREATE INDEX idx_library_item_type ON library_item(type);
CREATE INDEX idx_library_item_owner ON library_item(owner_uuid);
CREATE INDEX idx_library_item_slug ON library_item(slug);
```

**Purpose:**
- Fast querying/filtering without loading full documents
- Referential integrity
- Search index
- Sync'd on document save

---

## Type System

### Base Document Schema

Every library document conforms to this structure:

```typescript
interface LibraryDocument<TContent = unknown> {
  // Identity
  uuid: string;
  type: string;                 // 'governing' | 'motion' | 'budget' | 'report'
  slug: string;                 // URL-safe, unique identifier
  
  // Basic metadata
  title: string;
  owner_uuid: string;           // person or association UUID
  
  // Timestamps
  created_at: string;           // ISO 8601
  updated_at: string;           // ISO 8601
  
  // Type-specific content (including status)
  content: TContent;
}
```

### Type-Specific Content

Each document type defines its own content structure and lifecycle:

#### Governing Documents

```typescript
interface GoverningDocContent {
  status: 'draft' | 'adopted' | 'repealed';
  seniority: number;            // 1=charter, 2=constitution, 3=bylaw, etc.
  
  articles: Article[];
  
  adopted_at?: string;
  adopted_by_motion_uuid?: string;
  repealed_at?: string;
  repealed_by_motion_uuid?: string;
}

interface Article {
  number: string;               // "I", "II", "III"
  title: string;
  sections: Section[];
}

interface Section {
  title: string;
  body: string;
  rationale?: string;
}
```

#### Motions

```typescript
interface MotionContent {
  status: 'draft' | 'introduced' | 'deliberation' | 'enacted' | 'rejected' | 'withdrawn';
  
  // Core content
  body: string;
  introducer_uuid: string;
  
  // Lifecycle timestamps
  introduced_at?: string;
  deliberation_ends_at?: string;
  vote_opened_at?: string;
  vote_closed_at?: string;
  enacted_at?: string;
  
  // Rules
  vote_rule_uuid?: string;
  deliberation_rule_uuid?: string;
  
  // Motion metadata
  motion_number?: string;       // "M-2026-001"
  
  // Legacy compatibility (migration phase)
  // Will eventually move to separate documents
  clerk_notes?: string;
  parliamentarian_notes?: string;
}
```

#### Budgets (future)

```typescript
interface BudgetContent {
  status: 'draft' | 'proposed' | 'approved' | 'active' | 'closed';
  
  fiscal_year: number;
  period: 'annual' | 'quarterly' | 'monthly';
  
  line_items: LineItem[];
  total_revenue: number;
  total_expenses: number;
  
  approved_at?: string;
  approved_by_motion_uuid?: string;
}

interface LineItem {
  category: string;
  description: string;
  amount: number;
  type: 'revenue' | 'expense';
}
```

#### Reports (future)

```typescript
interface ReportContent {
  status: 'draft' | 'published';
  
  summary: string;
  report_date: string;
  
  sections: ReportSection[];
  
  published_at?: string;
}

interface ReportSection {
  title: string;
  body: string;
  data?: unknown;               // Flexible data structure
}
```

---

## Library Module API

### Core Operations

```typescript
// Read
function getDocument<T>(slug: string): LibraryDocument<T> | null;
function getDocumentByUuid<T>(uuid: string): LibraryDocument<T> | null;

// List/Query
function listDocuments(filters?: {
  type?: string;
  owner_uuid?: string;
  metadata_filter?: (metadata: any) => boolean;
}): LibraryDocument[];

// Write
function createDocument<T>(doc: LibraryDocument<T>): void;
function updateDocument<T>(slug: string, updates: Partial<LibraryDocument<T>>): void;
function deleteDocument(slug: string): void;

// Sync database index
function syncToDatabase(doc: LibraryDocument): void;
```

### Type-Specific Helpers

```typescript
// Governing docs
function listGoverningDocs(opts?: { status?: string }): LibraryDocument<GoverningDocContent>[];
function getCorpus(): LibraryDocument<GoverningDocContent>[];

// Motions
function listMotions(opts?: { 
  status?: MotionStatus;
  association_uuid?: string;
}): LibraryDocument<MotionContent>[];
function getActiveMotions(): LibraryDocument<MotionContent>[];

// Generic content updates
function updateContent<T>(slug: string, updates: Partial<T>): void;
```

---

## Migration Strategy

### Phase 1: Add Library Infrastructure

1. **Create library_item table**
   - Add to schema.ts
   - Migration script

2. **Refactor library.ts module**
   - Implement base document read/write
   - Add database sync logic
   - Keep existing API working

3. **Migrate existing governing docs**
   - Transform to new format
   - Sync to database
   - Update paths

### Phase 2: Migrate Motions

1. **Export motions from database to JSON**
   - Script to convert motion table → library documents
   - File structure: `data/library/motions/motion-{uuid}.json`

2. **Update motion module**
   - Refactor to use library.ts
   - Keep motion-specific logic (voting, deliberation)
   - Maintain existing routes/UI

3. **Deprecate old motion table**
   - Keep for reference/rollback
   - Remove after validation

### Phase 3: Extend System

1. **Add new document types**
   - Define BudgetContent interface
   - Create budget routes/UI
   - Implement budget-specific workflows

2. **Generic library browser**
   - `/library` - browse all types
   - `/library/{type}` - browse by type
   - `/library/{type}/{slug}` - view document

3. **Cross-document references**
   - Attachments system
   - Related documents
   - Citation tracking

---

## Routes & URLs

### Current (keep)
- `/library` - Browse all library items (governing docs)
- `/library/{slug}` - View governing document
- `/my/library` - User's documents

### Updated
- `/motions` → stays (but backed by library)
- `/motions/{uuid}` → stays (or migrate to `/library/motions/{slug}`)

### Future
- `/library/budgets` - Browse budgets
- `/library/budgets/{slug}` - View budget
- `/library/reports` - Browse reports
- `/library/reports/{slug}` - View report

---

## Permissions Model

### Existing Permissions (keep)
```typescript
LIBRARY_CREATE: 'library:create'
LIBRARY_EDIT: 'library:edit'
LIBRARY_ADOPT: 'library:adopt'
LIBRARY_REPEAL: 'library:repeal'
```

### Type-Specific Permissions (future)
```typescript
MOTIONS_CREATE: 'motions:create'      // remains
MOTIONS_ADVANCE: 'motions:advance'    // remains
BUDGETS_PROPOSE: 'budgets:propose'
BUDGETS_APPROVE: 'budgets:approve'
```

### Permission Checks
```typescript
function canEdit(person_uuid: string, doc: LibraryDocument): boolean {
  // Owner can always edit drafts
  if (doc.owner_uuid === person_uuid && isDraft(doc)) {
    return true;
  }
  
  // Type-specific permissions
  switch (doc.type) {
    case 'governing':
      return hasPermission(person_uuid, PERMISSIONS.LIBRARY_EDIT);
    case 'motion':
      return hasPermission(person_uuid, PERMISSIONS.MOTIONS_ADVANCE);
    // etc.
  }
}
```

---

## Open Questions

1. **Motion numbering**: Keep motion numbers in content, or derive from slug?
   - Current: `motion_number` field in DB
   - Proposed: Extract from slug (`motion-2026-001` → `M-2026-001`)

2. **Voting/tallies**: Store in motion document or separate table?
   - Individual votes should probably stay in DB (vote table)
   - Tally could be cached in motion.content.tally

3. **Discussion/comments**: Per-document or separate?
   - Current: comment table with motion_uuid
   - Could generalize to library_item_uuid

4. **Search**: Full-text search across all documents?
   - SQLite FTS5 on metadata_json?
   - External search index?

5. **Versioning**: Track document history?
   - Git provides this for files
   - Need in-app version viewer?

---

## Implementation Checklist

### Phase 1: Foundation
- [x] Add library_item table to schema
- [x] Create migration for library_item table
- [x] Refactor library.ts to use new structure
- [x] Add TypeScript interfaces for base + content types
- [x] Implement file I/O with database sync
- [x] Migrate existing governing docs to new format
- [x] Update governing doc routes to use new system
- [x] Test governing doc CRUD operations

### Phase 2: Motion Migration
- [x] Design MotionContent interface
- [x] Create motion export script (DB → JSON)
- [x] Update motion routes to read from library
- [x] Migrate motion write operations
- [x] Update voting system to work with library docs
- [x] Update deliberation timers
- [x] Test full motion lifecycle
- [ ] Deprecate old motion table (after validation)

### Phase 3: Enhancement
- [ ] Add budget document type
- [ ] Create budget UI/routes
- [ ] Implement budget approval workflow
- [x] Generalize library browser
- [ ] Add document attachments/references
- [x] Improve search/filtering
- [ ] Add document versioning UI

---

## Success Criteria

✅ **All existing features work**: Governing docs and motions function identically  
✅ **Performance**: No noticeable slowdown from file I/O  
✅ **Extensibility**: Can add new document type in < 1 hour  
✅ **Data integrity**: Database index stays in sync with files  
✅ **Developer experience**: Clear, type-safe API for working with documents  
✅ **User experience**: Seamless, users don't notice the change  

---

## Timeline Estimate

- **Phase 1**: 4-6 hours (foundation + governing docs)
- **Phase 2**: 6-8 hours (motion migration)
- **Phase 3**: Ongoing (new features as needed)

**Total for core migration**: ~12-14 hours
