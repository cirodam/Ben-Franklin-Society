# Motion Refactor Plan

## Objective
Refactor motion content structure to separate concerns by linking to external discussion threads and voting sessions rather than embedding timestamps directly.

## Current State

### MotionContent Fields (library-types.ts)
```typescript
interface MotionContent {
  status: MotionStatus;
  provisions: Provision[];  // Structured list of provisions
  introducer_uuid: string;
  reasoning?: string;
  body_uuid?: string;
  
  // TO REMOVE - Moving to VotingSession
  thread_uuid?: string;
  introduced_at?: string;
  deliberation_ends_at?: string;
  vote_opened_at?: string;
  vote_closed_at?: string;
  adopted_at?: string;
  enacted_at?: string;
  
  // TO KEEP
  vote_rule_uuid?: string;
  deliberation_rule_uuid?: string;
  clerk_notes?: string;
  parliamentarian_notes?: string;
  
  // TO ADD
  discussion_thread_uuid?: string;
  vote_session_uuid?: string;
  signatures?: MotionSignature[];
  
  // TO REMOVE - Replaced by document_id
  motion_number?: string;
  
  // TO REMOVE - Not needed with document versioning
  adopted_by_motion_uuid?: string;
  repealed_by_motion_uuid?: string;
}
```

## Proposed Changes

### 1. Update MotionContent Interface

**Keep:**
- Core fields: `status`, `provisions`, `introducer_uuid`, `reasoning`, `body_uuid`
- Rules: `vote_rule_uuid`, `deliberation_rule_uuid`
- Metadata: `clerk_notes`, `parliamentarian_notes`

**Add:**
- `discussion_thread_uuid` - Link to discussion thread entity
- `vote_session_uuid` - Link to voting session entity
- `signatures` - Array of signatures for formal attestation/support

**Remove:**
- `thread_uuid` (replaced by `discussion_thread_uuid`)
- `introduced_at` (use created_at from LibraryDocument)
- `deliberation_ends_at` (moves to discussion thread or vote session)
- `vote_opened_at` (moves to vote session)
- `vote_closed_at` (moves to vote session)
- `adopted_at` (can derive from vote session result)
- `enacted_at` (can track separately or derive from status change)
- `motion_number` (replaced by document_id from LibraryDocument)
- `adopted_by_motion_uuid` (not needed with document versioning)
- `repealed_by_motion_uuid` (not needed with document versioning)

### 2. New/Updated Entities Needed

#### Provision
```typescript
interface Provision {
  number: string;        // "1", "1.a", "Section A", etc.
  title?: string;        // Optional section heading
  text: string;          // The provision content
}
```

#### MotionSignature
```typescript
interface MotionSignature {
  signer_uuid: string;
  signature_text: string;
  font?: string;
  signed_at: string;
}
```

#### VotingSession
```typescript
interface VotingSession {
  uuid: string;
  motion_uuid: string;
  session_type: 'motion_vote' | 'election' | 'referendum';
  
  // Timing
  opened_at: string;
  closes_at: string;
  closed_at?: string;
  
  // Rules
  vote_rule_uuid: string;
  eligible_voters_uuids: string[];
  
  // Results
  status: 'pending' | 'open' | 'closed' | 'adopted' | 'rejected';
  votes: Vote[];
  result?: VoteResult;
}
```

#### DiscussionThread
```typescript
interface DiscussionThread {
  uuid: string;
  subject_type: 'motion' | 'proposal' | 'document';
  subject_uuid: string;
  
  // Timing
  created_at: string;
  closes_at?: string;
  closed_at?: string;
  
  // Posts
  posts: DiscussionPost[];
}
```

### 3. Status Transitions

Motion status should derive from state:
- `draft` - No vote session yet
- `introduced` - Created, may have discussion
- `deliberation` - Discussion thread open
- `voting` - Vote session open (NEW status?)
- `adopted` - Vote session closed with positive result
- `enacted` - Implementation/effects completed
- `rejected` - Vote session closed with negative result
- `withdrawn` - Removed by introducer

### 4. Files to Update

#### Type Definitions
- [ ] `apps/governance/src/lib/server/documents/library-types.ts`
  - Update `MotionContent` interface
  - Add `VotingSession` and `DiscussionThread` types (or reference from elsewhere)

#### Document Type Config
- [ ] `apps/governance/src/lib/documents/types/motion.ts`
  - Update to handle new structure
  - Update getSubtitle to use new fields

#### Server Functions
- [ ] `apps/governance/src/lib/server/documents/library-motions.ts`
  - Update createMotion, updateMotion functions
  - Add functions to attach discussion/voting sessions

#### Routes
- [ ] Motion detail view pages
- [ ] Motion creation/edit forms
- [ ] Any components displaying motion timestamps

#### Database
- [ ] Verify voting_session table structure supports motion linking
- [ ] Verify discussion_thread table structure supports motion linking

### 5. Migration Strategy

**Decision: Clean Break**
- Update types now
- No existing motion data to migrate
- No backward compatibility needed
- Fresh start with new structure

### 6. Implementation Order

1. **Phase 1: Type Updates**
   - Update MotionContent interface
   - Add VotingSession and DiscussionThread types
   - Fix TypeScript errors

2. **Phase 2: Document Type Config**
   - Update motion.ts config
   - Test document creation/display

3. **Phase 3: Server Functions**
   - Update motion creation
   - Add session attachment functions

4. **Phase 4: UI Updates**
   - Update motion display components
   - Update motion forms
   - Test full flow

5. **Phase 5: Integration**
   - Connect voting system
   - Connect discussion system
   - End-to-end testing

## Benefits

1. **Separation of Concerns** - Motion is just the proposal, voting/discussion are separate processes
2. **Reusability** - VotingSession can work for elections, referendums, etc.
3. **Flexibility** - Can have multiple discussions or voting rounds
4. **Cleaner Data Model** - No redundant timestamp fields
5. **Better Queries** - Can query all open votes, all active discussions independently
6. **Structured Provisions** - Clear enumeration enables targeted amendments and partial voting
7. **Civic Recognition** - Optional signatures let community members formally attest to important decisions

## Risks

1. More complex queries (need joins)
2. Need to ensure referential integrity
3. More entities to maintain

## Questions to Resolve

- [ ] Should we add a `voting` status between `deliberation` and `adopted`?
- [ ] How do we handle the case where a motion has multiple voting rounds?
- [ ] When can signatures be added to motions? (anytime, only after adoption, etc.)
