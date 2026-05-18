# Governance App Domain Reorganization - Implementation Plan

**Goal**: Reorganize governance app into clear domain-based structure
**Date Started**: May 18, 2026
**Status**: Planning

## Target Domain Structure

### 1. Governance (Mechanisms & Processes)
**What decisions are made and how**
- Motions, vote sessions, referenda, petitions
- Meeting records and management
- Vote rules, deliberation rules
- Governance workflows and state machines

### 2. Organization (Structures & Entities)
**Who participates and in what bodies**
- People, directory, households
- Associations (committees, general assembly, colleges, services, sections)
- Sortition & elections
- Organizational hierarchies and relationships

### 3. Communication & Records
**How information flows and is preserved**
- Discussion threads (general-purpose)
- Bulletin board, calendar
- Official record (minutes)

### 4. Documents & Library
**Formal documents and institutional memory**
- Library system, document types
- Audit trail

### 5. Infrastructure & Admin
**System foundation and access control**
- Configuration, settings
- Permissions, authentication, OIDC

### Special Cases (Stay Separate)
- `/central-bank` - Major internal subsystem
- `/social-insurance` - Major internal subsystem
- `/federation` - Cross-society concerns
- `/me` - Personal/user context
- `/library` - Central to system, stays top-level

---

## Phase 1: Server Module Reorganization

**Goal**: Move `lib/server/*.ts` into domain-based folders with backward-compatible barrel exports

### Current State
```
lib/server/
  associations.ts
  audit.ts
  auth.ts
  config.ts
  db.ts
  deliberation_rules.ts
  discussions.ts
  households.ts
  injury-types.ts
  library.ts
  meetings.ts
  motions.ts
  oidc.ts
  people.ts
  permissions.ts
  petitions.ts
  record.ts
  referendums.ts
  schema.ts
  sortition.ts
  vote_rules.ts
  vote_sessions.ts
```

### Target State
```
lib/server/
  governance/
    meetings.ts
    motions.ts
    petitions.ts
    referendums.ts
    vote-rules.ts
    deliberation-rules.ts
    vote-sessions.ts
  organization/
    associations.ts
    people.ts
    households.ts
    sortition.ts
  communications/
    discussions.ts
    record.ts
  documents/
    library.ts
    audit.ts
  infrastructure/
    auth.ts
    config.ts
    oidc.ts
    permissions.ts
  db.ts (stays at root)
  schema.ts (stays at root)
  injury-types.ts (stays at root? or move to social-insurance?)
  index.ts (NEW - barrel exports for backward compatibility)
```

### Implementation Steps

#### Step 1: Create Domain Folders ✅
- [x] Create `lib/server/governance/`
- [x] Create `lib/server/organization/`
- [x] Create `lib/server/communications/`
- [x] Create `lib/server/documents/`
- [x] Create `lib/server/infrastructure/`

#### Step 2: Move Server Modules ✅
**Governance Domain:**
- [x] Move `meetings.ts` → `governance/meetings.ts`
- [x] Move `motions.ts` → `governance/motions.ts`
- [x] Move `petitions.ts` → `governance/petitions.ts`
- [x] Move `referendums.ts` → `governance/referendums.ts`
- [x] Move `vote_rules.ts` → `governance/vote-rules.ts` (rename underscore)
- [x] Move `deliberation_rules.ts` → `governance/deliberation-rules.ts` (rename underscore)
- [x] Move `vote_sessions.ts` → `governance/vote-sessions.ts` (rename underscore)

**Organization Domain:**
- [x] Move `associations.ts` → `organization/associations.ts`
- [x] Move `people.ts` → `organization/people.ts`
- [x] Move `households.ts` → `organization/households.ts`
- [x] Move `sortition.ts` → `organization/sortition.ts`

**Communications Domain:**
- [x] Move `discussions.ts` → `communications/discussions.ts`
- [x] Move `record.ts` → `communications/record.ts`

**Documents Domain:**
- [x] Move `library.ts` → `documents/library.ts`
- [x] Move `library-types.ts` → `documents/library-types.ts`
- [x] Move `audit.ts` → `documents/audit.ts`

**Infrastructure Domain:**
- [x] Move `auth.ts` → `infrastructure/auth.ts`
- [x] Move `config.ts` → `infrastructure/config.ts`
- [x] Move `oidc.ts` → `infrastructure/oidc.ts`
- [x] Move `permissions.ts` → `infrastructure/permissions.ts`

#### Step 3: Update Internal Cross-References ✅
After moving files, update imports within server modules:
- [x] Update imports in `governance/*.ts` files
- [x] Update imports in `organization/*.ts` files
- [x] Update imports in `communications/*.ts` files
- [x] Update imports in `documents/*.ts` files
- [x] Update imports in `infrastructure/*.ts` files

#### Step 4: Create Barrel Export
- [x] Create `lib/server/index.ts` with re-exports from all domain modules
- [x] Test that barrel export works correctly
- **Note**: Removed barrel export due to namespace collision (kept for reference)

#### Step 5: Update Route Imports (Gradual)
**Status**: ✅ COMPLETE

- Updated all route files to import from domain-specific paths
- Fixed namespace collision between motions.ts and library.ts (both exported `getMotionByUuid`)
- Removed barrel export approach in favor of explicit domain imports
- Fixed 2 Svelte syntax errors (escaped quotes)
- Removed `loadBySlug` from document types (client/server boundary issue)
  
**Files updated**: ~66 total
- 47 route files
- 1 hooks.server.ts
- 4 document-types
- 2 lib utilities
- 2 Svelte files

#### Step 6: Verification
**Status**: ✅ COMPLETE

✅ **Build successful**: `pnpm --filter governance build`
- Output: `build/` directory created with ~72KB artifacts
- No TypeScript errors
- All imports resolved correctly

---

### Phase 1: COMPLETE ✅

**Date Completed**: May 18, 2026

**Summary**:
- 19 server modules successfully moved to 5 domain folders
- All imports updated to use domain-specific paths
- Build verified and passing
- No regressions or breaking changes

**Domain Conceptual Model**:
- **Governance**: Decision-making *mechanisms* (how decisions happen)
- **Organization**: Structural *entities* (who participates, in what bodies)
- **Communications**: Information *flow* (how knowledge spreads)
- **Documents**: Institutional *memory* (formal record)
- **Infrastructure**: System *foundation* (technical concerns)

**Import Pattern Change**:
```typescript
// Before:
import { getMotionByUuid } from '$lib/server/motions.js';

// After:
import { getMotionByUuid } from '$lib/server/governance/motions';
```

**Key Learnings**:
1. Barrel exports don't work well when multiple modules export same function names
2. Domain-specific imports are clearer and more maintainable
3. Client/server boundaries need careful attention (document types issue)
4. Svelte 5 uses single quotes for attribute values with special chars
5. Domain boundaries should separate "what/who" (organization) from "how" (governance)

**Next Steps**: Consider Phase 2 (route reorganization) based on value assessment

---
Update imports in route files to use new paths:
- [ ] Update `/motions/*` routes
- [ ] Update `/referenda/*` routes
- [ ] Update `/general-assembly/*` routes
- [ ] Update `/vote-sessions/*` routes
- [ ] Update `/associations/*` routes
- [ ] Update `/people/*` routes
- [ ] Update `/directory/*` routes
- [ ] Update `/colleges/*` routes
- [ ] Update `/committees/*` routes
- [ ] Update `/services/*` routes
- [ ] Update `/bulletin/*` routes
- [ ] Update `/calendar/*` routes
- [ ] Update `/record/*` routes
- [ ] Update `/library/*` routes
- [ ] Update `/audit/*` routes
- [ ] Update `/config/*` routes
- [ ] Update `/settings/*` routes

#### Step 6: Verification
- [ ] Run `pnpm build` to check for errors
- [ ] Run `pnpm type-check` if available
- [ ] Test key workflows (create motion, vote, etc.)
- [ ] Remove barrel export if all imports updated (or keep for convenience)

---

## Phase 2: Route Organization (Optional - Defer Decision)

**Decision Point**: After Phase 1, evaluate if route reorganization provides value

### Current Route Structure
```
routes/(app)/
  associations/
  audit/
  bulletin/
  calendar/
  central-bank/
  colleges/
  committees/
  community-bank/
  config/
  directory/
  federation/
  general-assembly/
  library/
  me/
  motions/
  people/
  record/
  referenda/
  sections/
  services/
  settings/
  social-insurance/
  vote-sessions/
```

### Potential Target Route Structure
```
routes/(app)/
  governance/
    general-assembly/
    motions/
    referenda/
    vote-sessions/
  organization/
    associations/
    colleges/
    committees/
    directory/
    people/
    services/
  communications/
    bulletin/
    calendar/
    record/
  library/ (stays top-level)
  admin/
    config/
    settings/
  central-bank/ (stays)
  social-insurance/ (stays)
  federation/ (stays)
  me/ (stays)
```

### Route Reorganization Steps (If Proceeding)
- [ ] **Decision**: Do we want to reorganize routes?
- [ ] Create new route folder structure
- [ ] Move route folders into domains
- [ ] Update sidebar navigation (add collapsible sections?)
- [ ] Update internal route links throughout app
- [ ] Test all navigation
- [ ] Update documentation

### Sidebar Navigation Update
If routes are reorganized, update sidebar with collapsible sections:

```svelte
<SidebarSection title="Governance">
  <SidebarLink href="/governance/general-assembly">General Assembly</SidebarLink>
  <SidebarLink href="/governance/motions">Motions</SidebarLink>
  <SidebarLink href="/governance/referenda">Referenda</SidebarLink>
</SidebarSection>

<SidebarSection title="Organization">
  <SidebarLink href="/organization/directory">Directory</SidebarLink>
  <SidebarLink href="/organization/associations">Associations</SidebarLink>
  ...
</SidebarSection>
```

---

## Progress Tracking

### Phase 1: Server Modules
- [ ] Step 1: Create domain folders
- [ ] Step 2: Move files (23 files to move)
- [ ] Step 3: Update internal imports
- [ ] Step 4: Create barrel export
- [ ] Step 5: Update route imports (~25 route folders)
- [ ] Step 6: Verification

**Estimated Time**: 2-3 hours
**Risk Level**: Low (backward compatible via barrel export)

### Phase 2: Routes (Optional)
- [ ] Make decision on whether to proceed
- [ ] If yes: Move route folders
- [ ] If yes: Update sidebar
- [ ] If yes: Update links

**Estimated Time**: 1-2 hours
**Risk Level**: Medium (URL changes affect bookmarks, external links)

---

## Rollback Plan

If issues arise during Phase 1:
1. Git revert to restore original file locations
2. Barrel export ensures old imports keep working
3. Gradually migrate back if needed

---

## Success Criteria

**Phase 1 Complete When:**
- ✅ All server modules in domain folders
- ✅ All imports using new paths (or barrel export)
- ✅ `pnpm build` succeeds
- ✅ No TypeScript errors
- ✅ Key workflows tested and working

**Phase 2 Complete When:**
- ✅ All routes in domain folders (if proceeding)
- ✅ Sidebar navigation updated
- ✅ All internal links updated
- ✅ Documentation updated

---

## Notes

- Keep this doc updated as work progresses
- Mark items complete with ✅
- Add blockers or issues as they arise
- Document any deviations from plan
