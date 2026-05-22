# Association Bulletin Boards Implementation Plan

**Created:** May 21, 2026  
**Status:** ✅ Phase 1-2 Complete, 📋 Phase 3+ Planning  
**Target:** Focused communication spaces for associations while maintaining society cohesion

---

## Implementation Progress

### ✅ Phase 1: Schema & Backend (COMPLETE)
- [x] Updated `bulletin_post` table with association_uuid, visibility, category, pinned_at
- [x] Created `bulletin_reaction`, `bulletin_flag`, `bulletin_subscription` tables
- [x] Created comprehensive `bulletin.ts` module (823 lines)
- [x] Implemented all query, permission, and mutation functions
- [x] Refactored existing society bulletin routes to use new module
- [x] Zero compilation errors, all routes functional

### ✅ Phase 2: UI Components & Polish (COMPLETE)
- [x] Created `CategoryBadge.svelte` component (5 category types with colors)
- [x] Created `VisibilitySelector.svelte` component (public/members/officers)
- [x] Created `BulletinPostCard.svelte` component (reusable post display)
- [x] Created `BulletinPostForm.svelte` component (reusable form with all fields)
- [x] Created `Tabs.svelte` component for navigation
- [x] Added tab navigation to association pages (Overview | Bulletin)
- [x] Refactored all bulletin pages to use new components
- [x] Association bulletin routes functional at `/organization/associations/[uuid]/bulletin`
- [x] Post detail pages with category badges and visibility indicators
- [x] **ANTI-DARK-PATTERN IMPLEMENTATIONS:**
  - [x] Added bounded lists (LIMIT 50) to prevent infinite scroll
  - [x] Default visibility: members_only for associations (privacy-first)
  - [x] Chronological ordering only (newest first, pinned at top)
  - [x] Removed relative time ("5 mins ago") → absolute dates only
  - [x] Removed FOMO language from empty states
  - [x] Reactions limited to positive only (heart, celebrate) - NO voting
  - [x] Notifications default to OFF (fully opt-in)
  - [x] Pinning restricted to officers only, society posts cannot be pinned
- [x] Zero compilation errors

### 📋 Phase 3: Aggregated Feed (PENDING)
- [ ] Create `/communications/feed` route
- [ ] Implement personalized feed algorithm
- [ ] Add filtering by association and category
- [ ] Display posts from user's associations + society-wide

### 📋 Phase 4: Reactions & Moderation (PENDING)
- [ ] Implement post reactions (up/down/heart/celebrate)
- [ ] Add post flagging/reporting
- [ ] Create moderation interface for officers
- [ ] Add notification preferences

---

## Design Principles

**Core Value: Maximize Human Flourishing**

This bulletin system is designed to foster genuine community connection and meaningful communication, **not** to maximize engagement metrics or attention capture.

### Anti-Dark-Pattern Commitments

❌ **NO Infinite Scroll** - Bounded lists encourage intentional browsing  
❌ **NO Algorithmic Feeds** - Chronological sorting (newest first), no manipulation  
❌ **NO Anxiety-Inducing Badges** - No unread counts, no urgency manipulation  
❌ **NO Engagement Bait** - No "most controversial" or outrage amplification  
❌ **NO Hidden Controls** - All settings visible and accessible  
❌ **NO Auto-Play** - User initiates all actions  
❌ **NO Tracking** - No behavioral analytics or profiling

### Positive Design Choices

✅ **Chronological Display** - Latest posts first, predictable and transparent  
✅ **Clear Information Hierarchy** - Title, preview, metadata visible at a glance  
✅ **Intentional Boundaries** - Pagination or reasonable limits (50-100 posts)  
✅ **Easy Opt-Out** - Members can choose not to participate, no pressure  
✅ **Privacy by Default** - Visibility controls default to most restrictive (members_only for associations)  
✅ **Respectful of Time** - No notifications unless explicitly requested  
✅ **Community Building** - Features that encourage thoughtful discussion, not hot takes  
✅ **Accessible Controls** - All actions clearly labeled and easy to find

### Feature Decisions Based on Values

**Reactions (Phase 4):**
- Simple, positive reactions only (helpful, celebrate)
- NO downvoting or negative reactions (avoid pile-ons)
- Reactions don't affect visibility or ordering
- Purpose: lightweight acknowledgment, not engagement metric

**Notifications:**
- Fully opt-in (default: OFF)
- User controls what they want to hear about
- No "you're missing out" messaging
- Clear unsubscribe on every notification

**Feed Algorithm (Phase 3):**
- Pure chronological from user's associations
- NO "suggested posts" from outside communities
- NO "people are talking about this" manipulation
- Simple filters user controls (association, category)

**Moderation:**
- Officers can flag/remove harmful content
- Transparent moderation log
- Focus on community care, not censorship

---

## Executive Summary

Extend the existing society-wide bulletin board to support association-specific communication spaces. Each college, committee, service, and other association will have its own bulletin board for focused discussions while preserving the society-wide board for general announcements.

### Key Goals

1. **Focused Communication**: Enable associations to have dedicated discussion spaces
2. **Maintain Cohesion**: Preserve society-wide bulletin for community-wide topics
3. **Smart Discovery**: Help members find relevant discussions across their associations
4. **Access Control**: Scope visibility appropriately (public vs members-only)
5. **Minimal Disruption**: Extend existing system without breaking current functionality

---

## Current State Analysis

### Existing Bulletin System

**Database Schema:**
```sql
CREATE TABLE IF NOT EXISTS bulletin_post (
  uuid       TEXT PRIMARY KEY,
  author_uuid TEXT NOT NULL REFERENCES person(uuid),
  title      TEXT NOT NULL,
  body       TEXT NOT NULL,
  created_at TEXT NOT NULL,
  updated_at TEXT NULL,
  expires_at TEXT NULL,
  deleted_at TEXT NULL
);

CREATE TABLE IF NOT EXISTS bulletin_comment (
  uuid                TEXT PRIMARY KEY,
  post_uuid           TEXT NOT NULL REFERENCES bulletin_post(uuid),
  author_uuid         TEXT NOT NULL REFERENCES person(uuid),
  body                TEXT NOT NULL,
  quoted_author_name  TEXT NULL,
  quoted_excerpt      TEXT NULL,
  quoted_reply_id     TEXT NULL,
  created_at          TEXT NOT NULL,
  deleted_at          TEXT NULL
);
```

**Current Routes:**
- `/communications/bulletin` - Society-wide bulletin board
- `/communications/bulletin/[uuid]` - Individual post view

**Current Features:**
- Any authenticated member can post
- No association scoping
- Comment threads on posts
- Soft deletes
- Optional expiration dates

**Association Context:**
- ~50+ associations in typical society (colleges, committees, services, assemblies)
- Associations already have: members, roles, permissions, handles
- Association types: society, association, service, college, committee, general_assembly, social_insurance_fund, community_bank

---

## Proposed Architecture

### Schema Changes

#### Updated bulletin_post Table

```sql
CREATE TABLE IF NOT EXISTS bulletin_post (
  uuid             TEXT PRIMARY KEY,
  author_uuid      TEXT NOT NULL REFERENCES person(uuid),
  association_uuid TEXT NULL REFERENCES association(uuid),
  title            TEXT NOT NULL,
  body             TEXT NOT NULL,
  visibility       TEXT NOT NULL DEFAULT 'public'
                   CHECK (visibility IN ('public', 'members_only', 'officers_only')),
  category         TEXT NULL
                   CHECK (category IN ('announcement', 'discussion', 'question', 'event', 'policy')),
  created_at       TEXT NOT NULL,
  updated_at       TEXT NULL,
  expires_at       TEXT NULL,
  deleted_at       TEXT NULL,
  pinned_at        TEXT NULL
);

CREATE INDEX IF NOT EXISTS idx_bulletin_association ON bulletin_post(association_uuid);
CREATE INDEX IF NOT EXISTS idx_bulletin_visibility ON bulletin_post(association_uuid, visibility, deleted_at);
CREATE INDEX IF NOT EXISTS idx_bulletin_created ON bulletin_post(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_bulletin_deleted_created ON bulletin_post(deleted_at, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_bulletin_pinned ON bulletin_post(association_uuid, pinned_at);
CREATE INDEX IF NOT EXISTS idx_bulletin_category ON bulletin_post(category);
```

**Semantics:**
- `association_uuid = NULL` → Society-wide post
- `association_uuid = UUID` → Association-specific post
- `visibility = 'public'` → All society members can read (default)
- `visibility = 'members_only'` → Only association members can read
- `visibility = 'officers_only'` → Only members with roles in the association can read
- `category` → Optional categorization for filtering
- `pinned_at` → Officers can pin important posts to top

### URL Structure

```
/communications/bulletin                           → Society-wide bulletin
/communications/bulletin/[uuid]                    → Post detail (current)

/associations/[handle]/bulletin                    → Association bulletin list
/associations/[handle]/bulletin/[uuid]             → Association post detail

/communications/feed                               → Aggregated feed (My Associations)
```

**Alternative (Unified Route):**
```
/communications/bulletin?association=[handle]      → Filter by association
/communications/bulletin                           → Society-wide (no filter)
```

---

## Implementation Phases

### Phase 1: Schema & Backend (2-3 hours)

**Database Schema:**
- [ ] Update `bulletin_post` CREATE TABLE in schema.ts
- [ ] Add `bulletin_reaction` table
- [ ] Add `bulletin_flag` table
- [ ] Add `bulletin_subscription` table (optional)

**Server Functions:**
- [ ] Update `getBulletinPosts()` to accept optional `association_uuid` filter
- [ ] Add `getAssociationPosts(association_uuid, person_uuid)` function
- [ ] Add visibility checking: `canViewPost(post, person_uuid)`
- [ ] Add posting permission check: `canPostToAssociation(association_uuid, person_uuid)`
- [ ] Update post creation to accept `association_uuid` and `visibility`

**Files to Modify:**
```
apps/governance/src/lib/server/
  └── communications/
      └── bulletin.ts (new module)
apps/governance/src/routes/(app)/communications/bulletin/
  ├── +page.server.ts (update load/actions)
  └── [uuid]/+page.server.ts (add visibility checks)
```

**New Module Structure:**
```typescript
// apps/governance/src/lib/server/communications/bulletin.ts

export interface BulletinPost {
  uuid: string;
  author_uuid: string;
  association_uuid: string | null;
  title: string;
  body: string;
  visibility: 'public' | 'members_only' | 'officers_only';
  category: string | null;
  created_at: string;
  updated_at: string | null;
  expires_at: string | null;
  deleted_at: string | null;
}

export interface BulletinPostWithAuthor extends BulletinPost {
  author_given_name: string;
  author_family_name: string;
  author_handle: string;
  comment_count: number;
  association_name?: string;
  association_handle?: string;
}

// Query functions
export function getSocietyPosts(): BulletinPostWithAuthor[];
export function getAssociationPosts(
  association_uuid: string,
  person_uuid: string
): BulletinPostWithAuthor[];
export function getPost(uuid: string): BulletinPostWithAuthor | null;
export function getPersonFeed(person_uuid: string): BulletinPostWithAuthor[];

// Permission functions
export function canViewPost(post: BulletinPost, person_uuid: string): boolean;
export function canPostToAssociation(
  association_uuid: string | null,
  person_uuid: string
): boolean;
export function canEditPost(post: BulletinPost, person_uuid: string): boolean;
export function canDeletePost(post: BulletinPost, person_uuid: string): boolean;

// Mutation functions
export function createPost(opts: {
  author_uuid: string;
  association_uuid: string | null;
  title: string;
  body: string;
  visibility?: 'public' | 'members_only' | 'officers_only';
  category?: string | null;
  expires_at?: string | null;
}): string;

export function updatePost(
  uuid: string,
  person_uuid: string,
  updates: {
    title?: string;
    body?: string;
    visibility?: 'public' | 'members_only' | 'officers_only';
    category?: string | null;
  }
): void;

export function deletePost(uuid: string, person_uuid: string): void;
```

**Checkpoint:** Database updated, server functions working, existing society bulletin still functional

---

### Phase 2: Association Bulletin Views (3-4 hours)

**New Routes:**
- [ ] Create `/associations/[handle]/bulletin/+page.svelte`
- [ ] Create `/associations/[handle]/bulletin/+page.server.ts`
- [ ] Update association detail page to show bulletin tab
- [ ] Add "Post to Bulletin" button on association pages

**UI Components:**
- [ ] `BulletinPostCard.svelte` - Display post in list
- [ ] `BulletinPostForm.svelte` - Create/edit post form
- [ ] `VisibilitySelector.svelte` - Choose public/members/officers
- [ ] `CategoryBadge.svelte` - Display post category

**Association Page Integration:**
```svelte
<!-- apps/governance/src/routes/(app)/associations/[handle]/+page.svelte -->
<nav class="tabs">
  <a href="/associations/{handle}">Overview</a>
  <a href="/associations/{handle}/members">Members</a>
  <a href="/associations/{handle}/roles">Roles</a>
  <a href="/associations/{handle}/bulletin">Bulletin</a> <!-- NEW -->
</nav>
```

**Checkpoint:** Association bulletins functional, members can post/view association-specific content

---

### Phase 3: Aggregated Feed (2-3 hours)

**New Route:**
- [ ] Create `/communications/feed/+page.svelte`
- [ ] Create `/communications/feed/+page.server.ts`

**Features:**
- Show posts from all associations user is a member of
- Include society-wide posts
- Sort by created_at (most recent first)
- Filter by association (dropdown)
- Filter by category (dropdown)
- Search by title/body

**Feed Algorithm:**
```typescript
export function getPersonFeed(person_uuid: string): BulletinPostWithAuthor[] {
  // 1. Get all society-wide posts (association_uuid IS NULL)
  // 2. Get all public posts from any association
  // 3. Get members_only posts from user's associations
  // 4. Get officers_only posts where user has a role
  // 5. Combine, dedupe, sort by created_at DESC
  // 6. Limit to last 100 posts
}
```

**UI Design:**
```
┌─────────────────────────────────────────────────┐
│ My Feed                                         │
├─────────────────────────────────────────────────┤
│ Filters: [All Associations ▼] [All Categories ▼]│
├─────────────────────────────────────────────────┤
│ 🏛️ General Assembly · 2 hours ago               │
│ Motion 24-156: Agricultural Land Use Policy    │
│ The General Assembly will convene...           │
│ 12 comments                                     │
├─────────────────────────────────────────────────┤
│ 🌾 Agricultural College · 5 hours ago           │
│ Spring Planting Workshop - May 25              │
│ Join us for a hands-on workshop...             │
│ 3 comments                                      │
├─────────────────────────────────────────────────┤
│ 📢 Society Bulletin · 1 day ago                 │
│ Reminder: Community Potluck This Saturday      │
│ Bring your favorite dish...                    │
│ 8 comments                                      │
└─────────────────────────────────────────────────┘
```

**Checkpoint:** Members have personalized feed showing relevant posts

---

### Phase 4: UI Polish & Features (2-3 hours)

**Enhanced Features:**
- [ ] Post pinning (officers can pin important posts to top)
- [ ] Post reactions (👍 👎 ❤️ without full comment)
- [ ] Email notifications (optional, for @mentions or replies)
- [ ] Post tagging (@mention associations or people)
- [ ] Rich text editor (basic markdown support)
- [ ] Image attachments (optional, requires file storage)

**Schema for Reactions:**
```sql
CREATE TABLE IF NOT EXISTS bulletin_reaction (
  uuid        TEXT PRIMARY KEY,
  post_uuid   TEXT NOT NULL REFERENCES bulletin_post(uuid),
  person_uuid TEXT NOT NULL REFERENCES person(uuid),
  reaction    TEXT NOT NULL CHECK (reaction IN ('up', 'down', 'heart', 'celebrate')),
  created_at  TEXT NOT NULL,
  UNIQUE(post_uuid, person_uuid, reaction)
);

CREATE INDEX IF NOT EXISTS idx_reaction_post ON bulletin_reaction(post_uuid);
```

**Navigation Updates:**
- [ ] Update main nav to include "My Feed" link
- [ ] Add unread post count badges (optional)
- [ ] Breadcrumbs on association bulletin pages

**Checkpoint:** Full-featured bulletin system with polish

---

### Phase 5: Moderation & Admin Tools (2-3 hours)

**Admin Features:**
- [ ] View all posts across all associations
- [ ] Delete inappropriate posts
- [ ] Suspend posting privileges
- [ ] View post analytics (posts per association, engagement metrics)

**Moderation Routes:**
```
/administrator/communications/posts              → All posts
/administrator/communications/posts/flagged      → Flagged posts
/administrator/communications/analytics          → Usage analytics
```

**Flagging System:**
```sql
CREATE TABLE IF NOT EXISTS bulletin_flag (
  uuid         TEXT PRIMARY KEY,
  post_uuid    TEXT NOT NULL REFERENCES bulletin_post(uuid),
  flagger_uuid TEXT NOT NULL REFERENCES person(uuid),
  reason       TEXT NOT NULL,
  created_at   TEXT NOT NULL,
  resolved_at  TEXT NULL,
  resolved_by  TEXT NULL REFERENCES person(uuid)
);

CREATE INDEX IF NOT EXISTS idx_flag_post ON bulletin_flag(post_uuid);
CREATE INDEX IF NOT EXISTS idx_flag_resolved ON bulletin_flag(resolved_at);
```

**Checkpoint:** Admins can moderate content effectively

---

### Phase 6: Migration & Documentation (1-2 hours)

**Data Migration:**
- [ ] All existing posts remain society-wide (association_uuid = NULL)
- [ ] All existing posts default to 'public' visibility
- [ ] No data loss, backward compatible

**Documentation:**
- [ ] Update governance app architecture docs
- [ ] Create bulletin board usage guide for members
- [ ] Document moderation policies
- [ ] Add API documentation for bulletin functions

**Testing:**
- [ ] Unit tests for permission functions
- [ ] Integration tests for post creation/viewing
- [ ] E2E tests for critical flows
- [ ] Load testing for feed queries

**Checkpoint:** System documented, tested, ready for rollout

---

## Permission Model

### Viewing Posts

| Post Visibility | Society-Wide | Association Member | Officer | Admin |
|----------------|--------------|-------------------|---------|-------|
| **public** | ✅ | ✅ | ✅ | ✅ |
| **members_only** | ❌ | ✅ | ✅ | ✅ |
| **officers_only** | ❌ | ❌ | ✅ | ✅ |

**Implementation:**
```typescript
export function canViewPost(
  post: BulletinPost,
  person_uuid: string
): boolean {
  // Society-wide posts: all members can view
  if (!post.association_uuid) return true;
  
  // Public association posts: all members can view
  if (post.visibility === 'public') return true;
  
  // Check association membership
  const isMember = isAssociationMember(person_uuid, post.association_uuid);
  
  if (post.visibility === 'members_only') return isMember;
  
  if (post.visibility === 'officers_only') {
    return hasRoleInAssociation(person_uuid, post.association_uuid);
  }
  
  return false;
}
```

### Creating Posts

| Context | Permission Required |
|---------|-------------------|
| Society-wide | Any member |
| Association (public) | Association member |
| Association (members_only) | Association member |
| Association (officers_only) | Officer role |

### Editing Posts

- **Author**: Can edit their own posts within 24 hours
- **Officers**: Can edit any post in their association
- **Admins**: Can edit any post

### Deleting Posts

- **Author**: Can delete their own posts
- **Officers**: Can delete posts in their association
- **Admins**: Can delete any post

---

## UI/UX Considerations

### Discovery Problem

**Challenge:** With 50+ associations, how do members find relevant bulletins?

**Solutions:**

1. **My Feed** (Primary): Aggregated view of user's associations
2. **Association Pages** (Secondary): Bulletin tab on each association
3. **Search** (Tertiary): Full-text search across all visible posts
4. **Notifications** (Optional): Email digest of new posts in user's associations

### Navigation Structure

```
Primary Nav:
  Communications
    ├─ My Feed (personalized)
    ├─ Society Bulletin (general)
    ├─ Calendar (existing)
    └─ Record (existing)

Association Pages:
  /{handle}
    ├─ Overview
    ├─ Members
    ├─ Roles
    └─ Bulletin (new)
```

### Notification Strategy

**Opt-in Notifications:**
- Daily digest of new posts in followed associations
- @mention notifications (if implemented)
- Reply notifications (when someone responds to your post)

**Notification Preferences:**
```sql
CREATE TABLE IF NOT EXISTS bulletin_subscription (
  person_uuid      TEXT NOT NULL REFERENCES person(uuid),
  association_uuid TEXT NULL REFERENCES association(uuid),
  notify_posts     INTEGER NOT NULL DEFAULT 0,  -- SQLite uses INTEGER for boolean
  notify_replies   INTEGER NOT NULL DEFAULT 1,
  notify_mentions  INTEGER NOT NULL DEFAULT 1,
  PRIMARY KEY (person_uuid, association_uuid)
);
```

---

## Query Performance

### Expected Load

- 500 members
- 50 associations
- Average member belongs to 5 associations
- ~10 new posts per day society-wide
- ~2 posts per association per week
- Total: ~20 posts per day

### Critical Queries

**1. Get Person's Feed:**
```sql
-- Most expensive query: needs optimization
SELECT bp.*, p.given_name, p.family_name, p.handle,
       a.name as association_name, a.handle as association_handle,
       (SELECT COUNT(*) FROM bulletin_comment WHERE post_uuid = bp.uuid) as comment_count
FROM bulletin_post bp
JOIN person p ON bp.author_uuid = p.uuid
LEFT JOIN association a ON bp.association_uuid = a.uuid
WHERE bp.deleted_at IS NULL
  AND (bp.expires_at IS NULL OR datetime(bp.expires_at) > datetime('now'))
  AND (
    bp.association_uuid IS NULL  -- Society-wide
    OR bp.visibility = 'public'   -- Public posts
    OR (bp.association_uuid IN (  -- User's associations
      SELECT association_uuid 
      FROM association_member 
      WHERE person_uuid = ? AND removed_at IS NULL
    ))
  )
ORDER BY bp.created_at DESC
LIMIT 100;
```

**Indexes Needed:**
```sql
CREATE INDEX idx_bulletin_association ON bulletin_post(association_uuid);
CREATE INDEX idx_bulletin_visibility ON bulletin_post(association_uuid, visibility, deleted_at);
CREATE INDEX idx_bulletin_created ON bulletin_post(created_at DESC);
CREATE INDEX idx_bulletin_deleted_created ON bulletin_post(deleted_at, created_at DESC);
CREATE INDEX idx_association_member_person ON association_member(person_uuid, removed_at);
```

**2. Get Association Posts:**
```sql
-- Simpler, well-indexed
SELECT bp.*, p.given_name, p.family_name, p.handle,
       (SELECT COUNT(*) FROM bulletin_comment WHERE post_uuid = bp.uuid) as comment_count
FROM bulletin_post bp
JOIN person p ON bp.author_uuid = p.uuid
WHERE bp.association_uuid = ?
  AND bp.deleted_at IS NULL
  AND (bp.expires_at IS NULL OR datetime(bp.expires_at) > datetime('now'))
ORDER BY bp.pinned_at DESC NULLS LAST, bp.created_at DESC;
```

### Caching Strategy

- Cache feed queries for 5 minutes per user
- Invalidate on new post in user's associations
- Cache association post lists for 2 minutes
- No caching on individual post views

---

## Testing Strategy

### Unit Tests

**Permission Functions:**
```typescript
describe('canViewPost', () => {
  it('allows all members to view society-wide posts', () => {
    const post = { association_uuid: null, visibility: 'public' };
    expect(canViewPost(post, 'any-user')).toBe(true);
  });
  
  it('allows members to view public association posts', () => {
    const post = { association_uuid: 'assoc-1', visibility: 'public' };
    expect(canViewPost(post, 'any-user')).toBe(true);
  });
  
  it('restricts members_only posts to association members', () => {
    const post = { association_uuid: 'assoc-1', visibility: 'members_only' };
    expect(canViewPost(post, 'non-member')).toBe(false);
    expect(canViewPost(post, 'member-of-assoc-1')).toBe(true);
  });
});
```

### Integration Tests

**Post Creation:**
```typescript
describe('POST /associations/[handle]/bulletin', () => {
  it('creates association post as member', async () => {
    const response = await request(app)
      .post('/associations/culinary-arts/bulletin')
      .send({ title: 'Test', body: 'Test post', visibility: 'public' })
      .set('Cookie', memberCookie);
    
    expect(response.status).toBe(303);
    expect(response.headers.location).toMatch(/\/bulletin\/[a-f0-9-]+/);
  });
  
  it('rejects post from non-member', async () => {
    const response = await request(app)
      .post('/associations/culinary-arts/bulletin')
      .send({ title: 'Test', body: 'Test post' })
      .set('Cookie', nonMemberCookie);
    
    expect(response.status).toBe(403);
  });
});
```

### E2E Tests

**Critical Flows:**
1. Member creates post in association bulletin
2. Member views their feed with posts from multiple associations
3. Officer creates members_only post
4. Non-member cannot view members_only post
5. Admin deletes inappropriate post

---

## Migration Path

### Phase Rollout

**Week 1: Backend Foundation**
- Deploy schema changes
- Implement server functions
- Maintain existing bulletin functionality

**Week 2: Association Bulletins**
- Deploy association bulletin views
- Announce feature to select associations (alpha test)
- Gather feedback

**Week 3: Feed & Polish**
- Deploy aggregated feed
- Add reactions and pinning
- Full rollout to all associations

**Week 4: Documentation & Training**
- Publish usage guide
- Hold community session on bulletin features
- Monitor adoption and gather feedback

### Fresh Schema Approach

Since we're updating the schema directly (no migrations needed):
- All new posts will have the new columns available
- `association_uuid = NULL` for society-wide posts
- `visibility = 'public'` is the default
- `category` and `pinned_at` are optional (NULL)

---

## Success Metrics

### Adoption Metrics

- **Association Bulletin Usage**: % of associations with at least 1 post per month
- **Feed Engagement**: % of members viewing feed vs society bulletin
- **Post Volume**: Posts per association per month
- **Comment Engagement**: Comments per post by bulletin type

### Quality Metrics

- **Response Time**: Feed query < 500ms
- **Zero Breaking Changes**: Existing bulletin functionality unchanged
- **User Satisfaction**: Survey feedback on bulletin usability

### Target Goals (3 months post-launch)

- 60% of associations have active bulletins
- 70% of members use aggregated feed
- Average 3-5 posts per association per month
- Average 2-3 comments per post

---

## Risk Assessment

| Risk | Impact | Mitigation |
|------|--------|------------|
| **Fragmentation**: Important discussions siloed | High | Keep society bulletin prominent, cross-post capability |
| **Low Adoption**: Associations don't use bulletins | Medium | Training, templates, seed content |
| **Performance**: Feed queries too slow | Medium | Proper indexing, caching, query optimization |
| **Permission Bugs**: Wrong visibility applied | High | Thorough testing, admin override capability |
| **Spam/Abuse**: Inappropriate posts | Low | Moderation tools, flagging system |
| **Discovery**: Members can't find relevant posts | Medium | Smart feed algorithm, notifications |

---

## Open Questions

1. **Should posts be cross-postable?** (e.g., post to both society and association)
2. **Email notifications?** Daily digest vs real-time vs opt-out?
3. **File attachments?** Images, PDFs? Requires file storage solution.
4. **Edit history?** Show revision history on edited posts?
5. **Post templates?** Pre-filled forms for common post types (announcements, events)?
6. **RSS feeds?** Allow external feed readers to follow bulletins?
7. **Federation?** Should association bulletins be visible to other societies?

---

## Future Enhancements

### Phase 7: Advanced Features (Future)

- **Post scheduling**: Schedule posts to publish at specific times
- **Post templates**: Common formats for announcements, events, polls
- **Polls**: Embedded voting in posts
- **Events**: Integration with communications calendar
- **Tags**: Searchable tags on posts
- **Bookmarks**: Save posts for later reading
- **Following**: Follow specific posts for notifications
- **Digest emails**: Weekly digest of top posts
- **Analytics dashboard**: Engagement metrics per association
- **Federation**: Share posts with other societies

---

## Implementation Checklist

### Database
- [ ] Write migration script for schema changes
- [ ] Test migration on dev database
- [ ] Create rollback script
- [ ] Deploy to staging
- [ ] Deploy to production

### Backend
- [ ] Update schema.ts with new table definitions
- [ ] Test schema changes with `pnpm reset`
- [ ] Verify indexes are created properly% coverage)

### Frontend
- [ ] Create BulletinPostCard component
- [ ] Create BulletinPostForm component
- [ ] Create VisibilitySelector component
- [ ] Update association detail pages
- [ ] Create aggregated feed page
- [ ] Create admin moderation views
- [ ] Write component tests

### Documentation
- [ ] Update architecture documentation
- [ ] Write user guide
- [ ] Write admin guide
- [ ] Document API endpoints
- [ ] Create moderation policy

### Testing
- [ ] Unit tests passing
- [ ] Integration tests passing
- [ ] E2E tests passing
- [ ] Performance tests passing
- [ ] Manual QA complete

### Deployment
- [ ] Alpha test with select associations
- [ ] Gather feedback and iterate
- [ ] Full rollout to all associations
- [ ] Community training session
- [ ] Monitor metrics and performance

---

## Related Documentation

- [Governance App Architecture](governance_app/architecture.md)
- [Communications System](communications.md)
- [Association Management](association_management.md)
- [Permission System](permissions.md)

---

**Status:** Ready for review and implementation  
**Estimated Total Effort:** 12-18 hours  
**Recommended Sprint Size:** 2-3 weeks with testing and feedback cycles
