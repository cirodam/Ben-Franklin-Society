# Motion System Refactor Plan

**Goal**: Unify and simplify the motion lifecycle to align with traditional town hall meeting workflow

**Date Started**: May 17, 2026

## Current Problems

1. **Dual storage confusion**: Motions stored in both database AND library JSON files with unclear separation
2. **Automatic voting**: Vote opens immediately when entering deliberation (doesn't match meeting-based workflow)
3. **Readiness gate**: 15-member "mark ready" requirement adds complexity
4. **Unclear timestamps**: Multiple timestamp fields (`adopted_at`, `enacted_at`, `resolved_at`, `deliberation_opened_at`)
5. **Type confusion**: `type` and `seniority` fields mixing concerns
6. **No meeting structure**: Meetings are conceptual but not in the data model

## Target Architecture

### Storage Pattern
- **JSON files** (`data/library/motions/`): Motion text, reasoning, amendments - human-readable content
- **Database** (`motion` table): Index for querying, status tracking, workflow metadata
- **Library sync**: JSON is source of truth, database is cached index (like governing docs, contracts, prose)

### Simplified Status Flow
```
draft → introduced → deliberation → [meeting vote] → enacted/rejected
                                           ↓
                                    (updates governing doc if applicable)
```

### Key Concepts
- **Governing documents**: Society's core rules (charter, constitution, assembly-rules, etc.)
- **Motions**: Proposals that can create policy or amend existing governing docs
- **Meetings**: Scheduled decision checkpoints where votes are taken
- **Deliberation**: Async comment period between introduction and meeting vote

## Implementation Plan

### Phase 1: Clean Up Motion Schema ✅ COMPLETE
**Remove complexity, clarify fields**

- [x] Drop `motion_readiness` table entirely
- [x] Simplify motion table fields:
  - Removed: `seniority`, `type`, `deliberation_opened_at`, `adopted_at`
  - Added: `introduced_at`
  - Kept: `adopted_by_motion_uuid`, `repealed_by_motion_uuid`, `deliberation_rule_uuid`, `vote_rule_uuid`
- [x] Update schema.ts
- [x] Update motions.ts to remove readiness functions
- [x] Remove readiness UI from motion detail page
- [x] Update TypeScript types
- [x] Fix metadata extraction in library.ts

**Status**: Complete (May 17, 2026)

### Phase 2: Integrate Motions with Library System ✅ COMPLETE
**Make motions first-class library documents**

- [x] Motion document type config already exists (`src/lib/document-types/types/motion.ts`)
- [x] Motion library functions already implemented in `library.ts`:
  - `loadMotion(slug)`, `saveMotion(doc)`, `listMotions(opts)`
  - `createMotion()`, `updateMotion()`, `updateMotionStatus()`
- [x] Motion JSON schema defined in library-types.ts
- [x] sync-library.ts handles motions directory
- [x] Existing motion already in JSON format
- [x] Motion CRUD uses library pattern (verified in motions.ts)
- [x] Motion type registered in document registry

**Status**: Complete (May 17, 2026) - Library integration was already fully implemented!

### Phase 3: Add Meeting Structure ✅ COMPLETE
**Meetings as decision checkpoints**

Database tables:
- [x] `meeting` table - uuid, body_uuid, title, scheduled_at, location, status, created_by_uuid, created_at, started_at, completed_at, cancelled_at, notes
- [x] `meeting_agenda_item` table - uuid, meeting_uuid, motion_uuid, display_order, notes, added_at, removed_at
- [x] `meeting_outcome` table - uuid, meeting_uuid, motion_uuid, action_taken, vote_aye, vote_nay, vote_abstain, notes, recorded_at, recorded_by_uuid

Server functions:
- [x] Created meetings.ts module
- [x] CRUD operations for meetings (create, get, list, update, delete)
- [x] Agenda builder functions (add, remove, reorder)
- [x] Record outcome functions (updates motion status based on vote result)
- [x] Meeting status transitions (scheduled → in_progress → completed)

UI:
- [x] `/general-assembly/meetings` page - list view with upcoming/past meetings
- [x] Meeting detail page (`/general-assembly/meetings/[uuid]`) - agenda display
- [x] "Add to agenda" functionality for introducing motions to meetings
- [x] "Record outcome" form with vote tallies and action types
- [x] Meeting status management (start/complete meeting)

**Status**: Complete (May 17, 2026)

### Phase 4: Clarify Voting Mechanics ✅ COMPLETE
**Meeting-gated voting: votes cast in-app during active meetings**

Decision: **Hybrid approach** - Individual members cast votes through the app, but only during active meetings.

Implementation:
- [x] Keep `motion_vote_tally` and `motion_vote_receipt` tables for individual vote tracking
- [x] Modified `castVote()` to require motion be on agenda of an active (in_progress) meeting
- [x] Removed `closeVote()` function - votes finalized via meeting outcome recording
- [x] Removed automatic vote tally creation from `advanceMotion()`
- [x] Vote tally created automatically on first vote cast during meeting
- [x] Updated `recordOutcome()` to pull from vote tally if votes were cast, otherwise accept manual entry
- [x] Updated motion detail UI to show voting buttons only during active meetings
- [x] Added meeting links and status notices to voting UI

Benefits:
- Individual vote tracking (who voted, vote tallies)
- Votes can only be cast during official meetings
- Works for both physical meetings (members vote via phones/laptops) and digital meetings
- Secretary can manually enter vote counts if needed (offline fallback)
- Vote rules properly evaluated when recording outcomes

**Status**: Complete (May 17, 2026)

### Phase 5: Governing Document Amendment Workflow ⏳ TODO
**Manual clerk-driven process for updating governing docs**

Decision: **Clerk manually updates documents** after motion is enacted, rather than automatic updates.

Workflow:
- [ ] Motion references a governing document it's amending (via slug or reference field)
- [ ] Motion goes through deliberation and voting at meeting
- [ ] When motion is enacted, clerk manually edits the governing document JSON file
- [ ] Clerk runs sync-library.ts to update database
- [ ] Motion serves as historical record of why/when change was made

Benefits:
- Clerk has full control and can review changes
- No complex automatic document patching needed
- Simpler, more reliable
- Motion history provides audit trail
- Works with existing library system (JSON as source of truth)

Optional enhancements:
- [ ] Add `amends_document_slug` field to motion schema
- [ ] UI link from motion to document it amends (and vice versa)
- [ ] Governing document page shows "amended by" motion list

## Code Cleanup (May 17, 2026)

Removed dead code from old async voting system:
- ✅ Removed `isDeliberationPeriodComplete()` and `getDaysRemainingInDeliberation()` from deliberation_rules.ts (no longer needed)
- ✅ Removed `VOTES_OPEN` and `VOTES_CLOSE` permissions (votes now managed via meeting system)
- ✅ Added clarifying comment to deliberation_rules.ts about their new purpose (guidelines, not enforcement)
- ✅ Marked migrate-library-phase2.ts as historical (references old schema fields)

Current system is clean - all async voting code removed, meeting-gated voting fully implemented.

## Questions to Resolve

1. ~~**Motion types**: Do we need motion types (regular, amendment, repeal) or just tags/fields?~~ → Decision: Use optional reference fields instead of rigid types
2. ~~**Voting location**: Meetings-only, async-only, or hybrid?~~ → ✅ Decision: Hybrid - votes cast in app during active meetings (Phase 4)
3. **Quorum**: Do we track attendance at meetings for quorum purposes?
4. **Minutes**: Should meetings generate a library document (minutes) automatically?
5. **Digital meetings**: Voice/video integration or just scheduling?
6. ~~**Amendment workflow**: Automatic or manual document updates?~~ → ✅ Decision: Manual clerk-driven updates (Phase 5)

## Migration Strategy

Since this is early development:
- [ ] Can we just reset the database and start fresh?
- [ ] Or do we need to preserve existing motions?
- [ ] If preserving, need migration script to convert to new schema

## Success Criteria

- ✅ Clear separation: JSON for content, DB for index
- ✅ Simple status flow matches town hall workflow
- ✅ Meetings are first-class entities
- ✅ Easy to add motion to agenda, record outcome
- ✅ Governing docs can be amended through motion process
- ✅ No confusing/unused fields in schema

## Notes

- Keep this doc updated as we make decisions
- Track blockers and questions here
- Link to related docs/issues
