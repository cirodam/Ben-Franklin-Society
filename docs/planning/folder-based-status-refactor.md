# Folder-Based Status Refactor

**Date:** May 28, 2026

## Overview

Refactor document storage to use folder structure for status tracking instead of properties. Remove database indexing in favor of direct filesystem operations.

## Motivation

- **Scalability:** Tens of thousands of motions anticipated - folder structure is more efficient
- **Self-documenting:** Status is immediately visible from file location
- **Simpler queries:** List files in folder instead of DB queries with WHERE clauses
- **Less redundancy:** Location IS the status, no duplicate information

## Proposed Structure

### Society Code (Governing Documents)
```
data/society-code/
  inbox/           # under consideration (was status='draft')
  enacted/         # active governing documents (was status='enacted')
  repealed/        # explicitly repealed (was status='repealed')
  sunsetted/       # expired by sunset clause (was status='sunsetted')
```

### Motions (by Body)
```
data/motions/
  general-assembly/
    inbox/         # newly created, not yet queued
    queued/        # scheduled for deliberation
    deliberating/  # currently being discussed
    rejected/      # voted down or withdrawn
    adopted/       # passed but not yet effectuated
    enacted/       # effectuated by clerk/responsible party
  [body-slug]/     # each body has same folder structure
    inbox/
    queued/
    ...
```

## Changes Required

### 1. Type Definitions (`packages/types/src/documents.ts`)

**Remove:**
- `status` property from `GoverningDocument`
- `status` property from `MotionDocument`
- `body_introduced_before` property from `MotionContent`

**Keep:**
- All other properties remain unchanged
- Status is now determined by folder location

### 2. File Operations

**New utility functions needed:**
- `getDocumentStatus(filePath)` - extract status from folder path
- `moveDocument(slug, fromStatus, toStatus)` - atomic move between folders
- `listDocumentsByStatus(status)` - list files in status folder
- `listMotionsByBody(bodySlug, status?)` - list motions for a body

**Update existing functions:**
- `saveGoverningDocument()` - determine target folder, ensure folder exists
- `loadGoverningDocument()` - search across all status folders or accept status param
- `saveMotion()` - save to body/status folder, ensure body folder structure exists
- `getMotionBySlug()` - search across body folders

### 3. Database Changes

**Remove entirely:**
- `library_item` table
- All sync logic (`syncToDatabase()` calls)
- Database imports from document operations

**Impact:**
- No more DB queries for listing/filtering
- All queries become filesystem operations
- No indexing overhead

### 4. Core File Updates

#### `apps/governance/src/lib/server/documents/society-core.ts`
- Remove `syncToDatabase()` function
- Remove database imports
- Update `SOCIETY_CODE_DIR` to return base path
- Add `SOCIETY_CODE_INBOX_DIR`, `SOCIETY_CODE_ENACTED_DIR`, etc.
- Add `MOTIONS_DIR` function that takes body slug
- Add utility to get all body slugs from filesystem

#### `apps/governance/src/lib/server/documents/society-governing.ts`
- Remove status from document operations
- Update `loadGoverningDocument()` to search folders or accept status param
- Update `saveGoverningDocument()` to save to appropriate folder based on context
- Add `moveGoverningDocument(slug, toStatus)` for status transitions
- Add `listGoverningDocuments(status)` for folder listing

#### `apps/governance/src/lib/server/documents/society-motions.ts`
- Remove status and body from document operations  
- Update `saveMotion()` to accept body slug and determine folder
- Update `getMotionBySlug()` to search across bodies/folders
- Add `moveMotion(slug, body, fromStatus, toStatus)`
- Add `listMotions(bodySlug, status?)` for folder listing
- Add `getAllBodies()` to list body folders

### 5. API Route Updates

#### Create new document (`/library/new/+page.server.ts`)
- Governing docs save to `inbox/` folder by default
- Remove status='draft' from document creation

#### Edit document (`/library/[slug]/edit/+page.server.ts`)
- Remove status checks (only draft editable) - replace with folder check
- Only allow editing documents in `inbox/` folder
- Moving out of inbox means "enacting" or "considering complete"

#### Document detail (`/library/[slug]/+page.server.ts`)
- Update to search across folders to find document
- Extract status from file path for display
- Update canEdit logic to check folder location

#### Society Code listing (`/library/+page.server.ts`)
- Replace DB queries with folder listing
- List `inbox/` for "Under Consideration"
- List `enacted/` for "Enacted"
- List `repealed/` + `sunsetted/` for "Archived"

#### Motion operations
- Update any motion creation to specify body slug
- Motion transitions = folder moves
- General Assembly motion listing queries `motions/general-assembly/` folders

### 6. UI Updates

#### Society Code Page (`/library/+page.svelte`)
- Tabs remain same: "Enacted", "Under Consideration", "Archived"
- Data now comes from folder listings instead of status grouping

#### Document Detail (`/library/[slug]/+page.svelte`)
- Display status derived from folder location
- Show different actions based on folder (e.g., "Enact" button for inbox docs)

#### Edit Protection
- Only show "Edit Document" button if in inbox folder
- Enacted/repealed/sunsetted are read-only

### 7. Status Transition Operations (New)

**Governing Documents:**
- `inbox → enacted`: Enact a governing document
- `enacted → repealed`: Explicitly repeal
- `enacted → sunsetted`: Mark as expired by sunset clause

**Motions:**
- `inbox → queued`: Schedule for deliberation
- `queued → deliberating`: Begin discussion
- `deliberating → adopted`: Motion passes vote
- `deliberating → rejected`: Motion fails or withdrawn
- `adopted → enacted`: Motion effectuated by clerk

These should be implemented as:
- Form actions or API endpoints
- Atomic file moves with error handling
- Audit trail in document metadata (updated_at, transitions array?)

### 8. Migration

**Current state check:**
```bash
find /home/tyler/Desktop/Programming/BFS/apps/governance/data -name "*.json" -type f
```

If no files exist (fresh start):
- Just create folder structure
- No migration needed

If files exist:
- Create folder structure
- Move files based on status property
- Remove status property from JSON
- Remove body_introduced_before from motion JSON

### 9. Search Considerations (Future)

Without `library_item` table, search options:
1. **Scan JSON files** - Fast enough for thousands of docs
2. **SQLite FTS** - If full-text search needed later
3. **grep/ripgrep** - CLI-style search
4. **In-memory index** - Build on app start for very fast queries

Start with option 1, optimize if needed.

## Implementation Order

1. ✅ Create this planning doc
2. Update type definitions (remove status properties)
3. Create folder structure utilities
4. Update document operations (load/save with folders)
5. Add status transition operations (file moves)
6. Remove database table and sync logic
7. Update API routes to use filesystem
8. Update UI to display folder-derived status
9. Test create/edit/transition workflows
10. Handle any existing files (migration if needed)

## Testing Checklist

- [ ] Create new governing document → saves to inbox/
- [ ] Edit governing document in inbox/ → works
- [ ] Edit governing document in enacted/ → blocked
- [ ] Move governing document inbox → enacted
- [ ] List governing documents by status (all tabs work)
- [ ] Create motion for body → saves to body/inbox/
- [ ] List motions by body and status
- [ ] Move motion through statuses (queue, deliberate, adopt, enact)
- [ ] No TypeScript errors
- [ ] All routes work without database queries

## Rollback Plan

If issues arise:
1. Git revert to before refactor
2. Restore `library_item` table
3. Restore status properties to types
4. Re-sync files to database

## Notes

- Folder structure is more scalable for large document counts
- Atomic file moves prevent inconsistent state
- Status is always single source of truth (location)
- Bodies can be added dynamically (just create folder)
- No DB migrations needed since we're removing the table
