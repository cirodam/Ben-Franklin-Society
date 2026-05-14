# Deliberation-Centric Redesign

**Status:** Implemented (Phases 1-5 complete, pending user testing)  
**Date:** May 13, 2026

## Context

The governance app currently treats motions and deliberative bodies as somewhat separate concerns. This redesign centers the entire app around **deliberation as the primary activity** - making the software feel like entering deliberative chambers where decisions are being made, not browsing administrative databases.

## Design Principles

1. **Deliberation is the center of gravity** — When you visit a body, you immediately see what's being discussed and decided
2. **Status drives hierarchy** — Active deliberations and open votes are prominent; administrative details are secondary
3. **Context over catalog** — Motion creation happens in context (on body pages), not in a global form
4. **Chamber metaphor** — Each deliberative space should feel like entering the British House of Commons or a similar deliberative body

## Goals

- Make it immediately clear what decisions are actively being made
- Emphasize discussion and deliberation over administrative structure
- Create distinct, purposeful spaces for different deliberative contexts (community-wide, assembly, committees)
- Reduce cognitive load by showing what matters now, not everything at once

## Proposed Changes

### 1. Navigation Restructure

**Current:**
```
Home
People
Motions          ← Generic, doesn't emphasize deliberation
General Assembly
Committees
Services
Colleges
Documents
Record
Settings
```

**Proposed:**
```
🏛️ Home / Overview
📢 Community Referenda    ← New: Society-wide deliberation
🏛️ General Assembly        ← Primary legislative body
📋 Committees              ← Specialized deliberation
   ├─ Agricultural
   └─ Food
👥 People
🏢 Services
🎓 Colleges
📄 Documents  
📝 The Record
⚙️ Settings
```

**Key changes:**
- Add "Community Referenda" as a first-class deliberative space
- Group deliberative bodies at the top
- Remove "Motions" from primary nav (accessible via search/direct URL as archive tool)
- Make clear visual/semantic distinction between "where decisions happen" and "supporting pages"

### 2. New Page: Community Referenda

**Route:** `/referenda`

**Purpose:** 
Society-wide deliberation where any member can put a question to the entire community. This is the most direct form of democratic participation.

**Data model:**
- Already exists: motions with `body_uuid` pointing to the community association
- Need to seed a "Community" association of type `referendum` or similar in setup
- Vote rules should default to simple majority or configurable community-wide threshold

**Page structure:**
```
╔══════════════════════════════════════════╗
║  Community Referenda                      ║
║  Direct democracy for society-wide issues ║
╠══════════════════════════════════════════╣
║  🗳️  Open Votes (1)                        ║
║  • Motion Title (145/342 voted - 42% aye) ║
║                                           ║
║  📊 Active Deliberations (2)              ║
║  • Motion A (8 days, 23 comments)         ║
║  • Motion B (3 days, 12 comments)         ║
║                                           ║
║  [+ Put a Question to the Community]      ║
╠══════════════════════════════════════════╣
║  📋 Pending Questions (1)                 ║
║  ✅ Recent Decisions                      ║
║  📚 Full Archive                          ║
╚══════════════════════════════════════════╝
```

**Key features:**
- Prominent motion creation (anyone can introduce)
- Open votes most prominent (action required)
- Active deliberations second (ongoing discussion)
- Pending and historical below fold
- Clear call-to-action for participation

### 3. Redesign General Assembly Page

**Current focus:** Sortition configuration, member roster, draw history, then motions

**New focus:** What's being deliberated RIGHT NOW

**Proposed structure:**

```
╔════════════════════════════════════════════╗
║  General Assembly                          ║
║  The sovereign legislative body            ║
║  12 seats · 8 currently seated             ║
╠════════════════════════════════════════════╣
║                                            ║
║  🗳️  Open Votes (1)                         ║
║  • Motion Title                            ║
║    32 of 50 eligible voted (64%)           ║
║    18 aye · 12 nay · 2 abstain             ║
║    [View] [Vote if eligible]               ║
║                                            ║
║  📊 Active Deliberations (2)               ║
║  • Motion Title Here                       ║
║    Introduced 5 days ago · 12 comments     ║
║    [Continue Discussion]                   ║
║                                            ║
║  • Another Motion Title                    ║
║    Introduced 2 days ago · 7 comments      ║
║    [Continue Discussion]                   ║
║                                            ║
║  [+ New Motion Before the Assembly]        ║
║                                            ║
╠════════════════════════════════════════════╣
║  📋 Tabs/Sections:                         ║
║  • Pending Motions                         ║
║  • Recent Decisions                        ║
║  • Current Members                         ║
║  • Seat Configuration                      ║
║  • Draw History                            ║
║  • Full Motion Archive                     ║
╚════════════════════════════════════════════╝
```

**Information hierarchy:**
1. **Immediate action needed:** Open votes (urgent)
2. **Ongoing work:** Active deliberations (important)
3. **Easy access:** New motion creation
4. **Secondary info:** Everything else in tabs/collapsible sections

**Visual language:**
- Open votes: Yellow/urgent color, prominent vote counts, clear CTAs
- Active deliberations: Purple/discussion color, time elapsed, comment count
- Pending: Gray/muted
- Recent decisions: Green (enacted) / Red (rejected)

### 4. Redesign Committee Pages

Apply the same pattern as General Assembly:

**Current:** Mixed focus on membership, sortition, roles, and motions

**New:** Deliberation-first with supporting info below

**Template (same as GA but committee-specific):**
```
╔════════════════════════════════════════════╗
║  [Committee Name] Committee                ║
║  [Mandate/description]                     ║
║  5 seats · Source: [College Name]          ║
╠════════════════════════════════════════════╣
║  🗳️  Open Votes (if any)                    ║
║  📊 Active Deliberations (if any)          ║
║  [+ New Motion Before This Committee]      ║
╠════════════════════════════════════════════╣
║  Tabs: Pending · Decisions · Members · Config
╚════════════════════════════════════════════╝
```

**Committees affected:**
- `/committees/[uuid]/+page.svelte` (Agricultural, Food)
- Same server logic, just reordered presentation

### 5. Motion Creation Flow Changes

**Current:**
- Global `/motions` page has a "New Motion" form
- Body pages don't emphasize motion creation

**New:**
- **Remove** motion creation from Motion Archive page
- **Add** prominent "+ New Motion" buttons on:
  - Community Referenda page
  - General Assembly page
  - Each committee page
- Form automatically sets `body_uuid` to current context
- Still allow selecting target body for admins (dropdown for power users)

**Form location options:**
- **Option A:** Inline on body page (expands when clicked)
- **Option B:** Modal overlay (less page jump)
- **Option C:** Dedicated `/referenda/new`, `/general-assembly/new` routes

Recommend **Option B** (modal) for consistency and less disruption.

### 6. Motion Archive Page Redesign

**Current:** `/motions` — General list of all motions with creation form

**New:** `/motions` renamed conceptually to "Motion Archive"

**Purpose:** 
- Search and filter motions across all bodies
- Historical review
- Administrative oversight
- Personal tracking (my motions, my votes)

**No longer includes:**
- Motion creation (moved to body pages)
- "This is where you work with motions" framing

**New structure:**
```
╔════════════════════════════════════════════╗
║  Motion Archive                            ║
║  Search and review all governance decisions║
╠════════════════════════════════════════════╣
║  🔍 Filters:                               ║
║  [ Status ▼ ] [ Body ▼ ] [ Date Range ▼ ] ║
║  [ Search... ]                             ║
╠════════════════════════════════════════════╣
║  📊 Results (342 motions)                  ║
║  [Table view with sortable columns]        ║
╚════════════════════════════════════════════╝
```

**Features to add:**
- Filter by status (draft, deliberation, vote, enacted, rejected)
- Filter by body (referenda, GA, committees, services)
- Date range selector
- Search by title/content
- Export/download capabilities
- Personal views: "My motions", "Voted on", "Following"

### 7. Visual Design System

**Color coding by status:**
- `draft` — Gray (#9ca3af)
- `introduced` — Blue (#3b82f6)
- `deliberation` — Purple (#8b5cf6)
- `vote` — Yellow/Orange (#f59e0b)
- `enacted` — Green (#10b981)
- `rejected` — Red (#ef4444)
- `withdrawn` — Muted gray (#6b7280)

**Component patterns:**
- Motion cards with status badges
- Vote progress bars (visual % of eligible voters)
- Time indicators ("5 days in deliberation", "Vote closes in 2 days")
- Comment count badges
- Clear CTAs based on user permissions

**Typography hierarchy:**
- Body/chamber name: Large, bold
- Motion titles: Medium-large, prominent
- Status/metadata: Small, muted
- Comments/details: Regular body text

## Implementation Plan

### Phase 1: Foundation (Data & Routing)
- [x] Create "Community" association in seed data (type: `referendum` or use existing)
- [x] Create `/referenda` route structure
  - [x] `+page.server.ts` — Query motions for community association
  - [x] `+page.svelte` — New deliberation-centric layout
- [x] Update navigation component with new hierarchy

### Phase 2: General Assembly Redesign
- [x] Refactor `/general-assembly/+page.svelte`
  - [x] Move sortition/member data to tabs/sections
  - [x] Prominent display of open votes and active deliberations
  - [x] Add "+ New Motion" button with modal
- [x] Create reusable components:
  - [x] `MotionCard.svelte` — Consistent motion display with status
  - [x] `MotionCreationModal.svelte` — Reusable creation form

### Phase 3: Committee Pages
- [x] Apply same pattern to `/committees/[uuid]/+page.svelte`
- [x] Ensure template works for both permanent and ad hoc committees
- [x] Test with Agricultural and Food committees

### Phase 4: Motion Archive
- [x] Rename/rebrand `/motions` page as archive/search tool
- [x] Remove motion creation form entirely
- [x] Add filtering and search capabilities
- [x] Remove from primary navigation (accessible via direct URL)
- [x] Consider adding links to archive from relevant contexts (e.g., "View all motions" from body pages)

### Phase 5: Polish & Testing
- [x] Consistent color coding across all pages
- [x] Responsive design for all new layouts
- [ ] Test motion creation flow from each body
- [ ] Ensure permissions work correctly (who can create where)
- [ ] User testing with fresh eyes
- [ ] Documentation updates

## Technical Considerations

### Database
No schema changes required — all deliberative contexts already have associations that can receive motions.

May need to seed a "Community" association if it doesn't exist:
```typescript
// In setup script
const communityUuid = randomUUID();
db.prepare(
  `INSERT INTO association (uuid, name, handle, type, status, created_at)
   VALUES (?, ?, ?, ?, ?, ?)`
).run(communityUuid, 'Community', 'community', 'referendum', 'active', now());
```

### Routing
```
/referenda                    — New
/general-assembly            — Redesign
/committees/[uuid]           — Redesign
/motions                     — Rebrand as archive
/motions/[uuid]              — Unchanged (individual motion view)
```

### Components to Create
- `MotionCard.svelte` — Reusable motion display
- `VoteStatus.svelte` — Vote progress visualization
- `MotionCreationModal.svelte` — Modal form for creating motions
- `DeliberationSection.svelte` — Reusable "chamber view" component
- `BodyTabs.svelte` — Tab navigation for secondary info

### Permissions
Motion creation permissions need to be body-specific:
- Community Referenda: Any member can create
- General Assembly: Current seat holders only?
- Committees: Committee members only?
- Services: Service members with appropriate permissions

Current `PERMISSIONS.MOTIONS_CREATE` is body-scoped, so this should work.

## Open Questions

1. **Who can create motions in each context?**
   - **DECISION:** Anyone can pose a motion to any body
   - Referenda: Any member
   - General Assembly: Any member
   - Committees: Any member

2. **Should we keep the global motions list in nav at all?**
   - **DECISION:** Remove from nav, accessible via search or direct URL
   - Can still be linked from other places when relevant
   - Archive is a tool, not a destination

3. **Motion creation UI pattern:**
   - **DECISION:** Modal overlay
   - Keeps user in context of the body
   - Clear focus on motion creation form
   - Easy to dismiss and return

4. **Community association type:**
   - **DECISION:** Use existing `society` association type for community-wide deliberations
   - No schema changes needed
   - Filter by type in queries

5. **Visual design:**
   - **DECISION:** Card-based layout for motion display
   - Cards provide better visual hierarchy and status visibility
   - Mobile responsive strategy: stack cards vertically, preserve status indicators

6. **Performance:**
   - **DECISION:** Defer optimization, focus on getting the design right first
   - Can add pagination/lazy loading later if needed
   - Start with full data loads and measure actual usage

## Success Criteria

We'll know this redesign works when:

1. **New users immediately understand** where decisions are being made
2. **Active deliberations are visible** without hunting through pages
3. **Motion creation feels contextual** rather than administrative
4. **The app feels alive** — you can see what's happening now
5. **Navigation makes semantic sense** — deliberative bodies at top, supporting pages below
6. **Reduced clicks** to participate in active deliberations
7. **Clear visual hierarchy** — urgent (vote) > important (deliberation) > pending > historical

## Next Steps

1. ✅ **Review and refine** this plan
2. ✅ **Make decisions** on open questions
3. **Start with Phase 1** — Foundation work (referenda route with society association)
4. **Iterate on design** with working code rather than mockups
5. **Test and refine** based on actual usage

---

**Notes:**
- This is a significant information architecture change, not just cosmetic
- Plan to iterate — first version won't be perfect
- Focus on the deliberation experience, not administrative completeness
- Remember the goal: make people feel like they're in a deliberative body making real decisions
