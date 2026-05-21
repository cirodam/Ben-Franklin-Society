# Authorization & Identity Model

**Status:** Planning / Design Phase  
**Created:** 2026-05-21  
**Purpose:** Define the ironclad model for identity, authorization, resource ownership, and permission resolution across the BFS ecosystem

## Executive Summary

**The Core Problem:**  
People need to operate both as themselves (personal accounts, personal posts) and on behalf of associations (organization accounts, official communications). Mixing these contexts creates UX problems (admin views cluttering personal use) and authorization complexity.

**The Solution:**  
**Context-based identity switching** with clean separation between personal and organizational contexts.

**Key Principles:**

1. **Sessions track two identities:**
   - `person_uuid` — Who you actually are (immutable)
   - `acting_as_uuid` — Whose authority you're currently using (switchable)

2. **Context switching is gated:**
   - Default: Acting as yourself
   - Switching to association requires `act_as` permission in a role there
   - Context switcher UI shows available contexts

3. **Simple ownership model:**
   - Every resource has `owner_uuid` (person or association)
   - Authorization check: `owner_uuid = session.acting_as_uuid`

4. **Two permission types:**
   - **Association-scoped** — Capabilities when acting as that association
   - **App-wide admin** — System administration (from special associations)

5. **Clean UX separation:**
   - Acting as yourself: See only your resources
   - Acting as association: See only that association's resources
   - Acting as Community Bank Association (admin): See all resources system-wide

**Result:** Clear contexts, simple queries, intuitive UX, complete audit trail.

---

## Core Concepts

### People

The fundamental identity unit.

**Properties:**
- Have their own UUID, handle, profile
- Can be members of multiple associations
- Can hold multiple roles across associations
- Own personal resources (accounts, posts, listings)
- Always tracked in `session.person_uuid`

**Authentication:**
- Log in once as yourself
- Choose which context to act in
- Can switch contexts via UI

### Associations

Collective entities operated through people.

**Properties:**
- Have their own UUID, handle, profile
- Own collective resources (accounts, posts, listings)
- **Cannot be members of other associations** (flat structure, no hierarchy)
- Cannot "log in" directly — always operated through people

**Types:**
1. **Regular associations** — Societies, clubs, organizations
2. **Special/authoritative associations** — Govern satellite apps (Community Bank Association, Communications Service Association, Commerce Service Association)

### Roles

Named positions within associations.

**Properties:**
- Scoped to a single association
- Granted to people via role assignments (with start/end dates)
- Carry permissions (both association-scoped and app-wide)

**Examples:**
- Westbrook Society Treasurer
- Community Bank Association Board Member
- Garden Club President
- Communications Service Association Postmaster

### Permissions

Fine-grained capabilities attached to roles.

**Format:** `app:capability` (e.g., `governance:motions_create`, `bank:teller`)

**Two Types:**

**1. Association-Scoped Permissions**
Grant capabilities when acting as that specific association.

Examples:
- `bank:teller` → Manage this association's bank accounts
- `mail:moderator` → Moderate this association's posts
- `marketplace:administrator` → Manage this association's listings

**2. App-Wide Admin Permissions**
Grant system administration capabilities (typically from special associations).

Examples:
- `bank:admin` → Administer entire banking system
- `mail:admin` → Moderate all mail system-wide
- `marketplace:admin` → Administer marketplace system
- `governance:admin` → Administer governance infrastructure

**3. Special Permission: `act_as`**
Gates whether you can switch your `acting_as_uuid` to that association.

- Regular members: No `act_as` permission (can't represent the association)
- Officers/executives: Have `act_as` permission (can represent the association)
- Example: President and Treasurer have `act_as`, Committee Members don't

---

## The Acting As System

### Session Model

```typescript
interface Session {
  uuid: string;
  person_uuid: string;        // Who you actually are (immutable)
  acting_as_uuid: string;     // Whose authority you're using (defaults to person_uuid)
  created_at: string;
  expires_at: string;
}
```

### Default Behavior

When you log in: `acting_as_uuid = person_uuid` (acting as yourself)

### Switching Context

**Requirements to switch to an association:**
1. You must have an active role in that association
2. That role must have the `act_as` permission
3. Your role assignment is not expired (`removed_at IS NULL`)

**Function:**
```typescript
function getAvailableContexts(personUuid: string): Context[] {
  return [
    // Always available: yourself
    { uuid: personUuid, type: 'person', label: 'Tyler Smith (personal)' },
    
    // Associations where you have act_as permission
    ...db.prepare(`
      SELECT DISTINCT 
        a.uuid,
        a.handle,
        a.name,
        r.title as role_title
      FROM association a
      JOIN role r ON r.association_uuid = a.uuid
      JOIN role_assignment ra ON ra.role_uuid = r.uuid
      JOIN role_permission rp ON rp.role_uuid = r.uuid
      WHERE ra.person_uuid = ?
        AND ra.removed_at IS NULL
        AND rp.permission = 'act_as'
      ORDER BY a.name
    `).all(personUuid).map(row => ({
      uuid: row.uuid,
      type: 'association',
      label: `${row.name} (${row.role_title})`
    }))
  ];
}

function switchContext(sessionUuid: string, newActingAsUuid: string) {
  // Validate the switch is allowed
  const session = getSession(sessionUuid);
  const contexts = getAvailableContexts(session.person_uuid);
  
  if (!contexts.find(c => c.uuid === newActingAsUuid)) {
    throw new Error('Cannot switch to this context');
  }
  
  // Update session
  db.prepare(`
    UPDATE session 
    SET acting_as_uuid = ? 
    WHERE uuid = ?
  `).run(newActingAsUuid, sessionUuid);
}
```

### UI Pattern

**Context Switcher Component** (persistent in app header/sidebar):

```
[🔄 Tyler Smith (personal) ▼]
  ├─ Tyler Smith (personal) ✓
  ├─ Westbrook Society (Treasurer)
  ├─ Garden Club (President)
  └─ Community Bank Association (Board Member)
```

**Switching behavior:**
- Click different context → Session updates → Page reloads/refetches data
- New OIDC token issued with updated permissions
- UI shows only resources for new context

---

## Resource Ownership & Authorization

### Ownership Model

Every resource has an `owner_uuid` field that can be:
1. A person UUID (personal resource)
2. An association UUID (collective resource)

**Examples:**

```typescript
// Bank Account
{
  uuid: "acct-123",
  owner_uuid: "person-uuid" | "association-uuid",
  handle: "@tyler" | "@westbrook-society",
  balance: 1500
}

// Mail Post
{
  uuid: "post-456",
  author_uuid: "person-uuid",  // Who physically wrote it
  owner_uuid: "person-uuid" | "association-uuid",  // Whose post it is
}

// Marketplace Listing
{
  uuid: "listing-789",
  seller_uuid: "person-uuid" | "association-uuid",
}
```

### Authorization Pattern

**Simple ownership check:**

```typescript
function canAccessResource(
  session: Session,
  resource: { owner_uuid: string }
): boolean {
  return resource.owner_uuid === session.acting_as_uuid;
}
```

**That's it.** If you're acting as the owner, you can access it.

### App-Wide Admin Exception

Users with app-wide admin permissions see and can access ALL resources:

```typescript
function canAccessResource(
  session: Session,
  resource: { owner_uuid: string },
  app: string
): boolean {
  // App-wide admin? Full access
  if (hasAppWidePermission(session.person_uuid, app, 'admin')) {
    return true;
  }
  
  // Otherwise: simple ownership check
  return resource.owner_uuid === session.acting_as_uuid;
}
```

### Query Pattern

**Get resources for current context:**

```typescript
// Simple query - no complex joins!
function getAccountsForContext(session: Session): Account[] {
  // App-wide admin?
  if (hasAppWidePermission(session.person_uuid, 'bank', 'admin')) {
    return db.prepare(`SELECT * FROM account ORDER BY created_at DESC`).all();
  }
  
  // Normal context
  return db.prepare(`
    SELECT * FROM account 
    WHERE owner_uuid = ? 
    ORDER BY created_at DESC
  `).all(session.acting_as_uuid);
}
```

**Key insight:** Authorization becomes a simple equality check instead of complex role/permission joins.

---

## Special/Authoritative Associations

Certain associations govern the satellite apps and grant app-wide admin permissions.

### Design Pattern

| App | Authoritative Association | Admin Permission |
|-----|--------------------------|------------------|
| Community Bank | **Community Bank Association** | `bank:admin` |
| Mail | **Communications Service Association** | `mail:admin` |
| Marketplace | **Commerce Service Association** | `marketplace:admin` |
| Governance | (Self-governing) | `governance:admin` |

**Characteristics:**
- These associations don't own resources in their apps (or have minimal ownership)
- They govern the app infrastructure
- Roles in these associations grant app-wide admin permissions
- Members of these associations can see/manage ALL resources when acting as them

**Example Structure:**

```
Community Bank Association:
  Roles:
    ├─ Board Member
    │   └─ Permissions: [bank:admin, act_as]
    └─ Bank Examiner
        └─ Permissions: [bank:admin, bank:audit, act_as]

Westbrook Society:
  Roles:
    ├─ Treasurer
    │   └─ Permissions: [bank:teller, act_as]
    └─ President
        └─ Permissions: [bank:teller, governance:motions_create, act_as]
```

### Designation Method

**Approach: Database Field**

```sql
ALTER TABLE association ADD COLUMN governs_app TEXT; -- 'bank', 'mail', 'marketplace', etc.
```

**Benefits:**
- Flexible — can change which association governs an app without code changes
- Queryable — can easily find governing associations
- No hardcoded UUIDs in code
- Supports potential future scenarios (multiple admins, regional variations)

**Usage:**
```typescript
function getGoverningAssociation(app: string): Association | null {
  return db.prepare(`
    SELECT * FROM association WHERE governs_app = ?
  `).get(app) as Association | null;
}

function isAppAdmin(personUuid: string, app: string): boolean {
  const govAssoc = getGoverningAssociation(app);
  if (!govAssoc) return false;
  
  return hasPermissionInAssociation(personUuid, govAssoc.uuid, `${app}:admin`);
}
```

---

## Per-App Implementation

### Community Bank

**Resources:**
- Bank accounts with `owner_uuid`

**Permissions:**
- `bank:teller` (association-scoped) → Manage association's accounts
- `bank:admin` (app-wide) → Administer entire banking system

**Authorization:**

```typescript
function getAccounts(session: Session): Account[] {
  // Community Bank Association admin sees everything
  if (hasAppWidePermission(session.person_uuid, 'bank', 'admin')) {
    return db.prepare(`SELECT * FROM account`).all();
  }
  
  // Everyone else sees only their context's accounts
  return db.prepare(`
    SELECT * FROM account WHERE owner_uuid = ?
  `).all(session.acting_as_uuid);
}

function canTransferFrom(session: Session, fromAccount: Account): boolean {
  // Admin can do anything
  if (hasAppWidePermission(session.person_uuid, 'bank', 'admin')) {
    return true;
  }
  
  // Must be acting as the account owner
  if (fromAccount.owner_uuid !== session.acting_as_uuid) {
    return false;
  }
  
  // When acting as association, need teller permission
  if (session.acting_as_uuid !== session.person_uuid) {
    return hasPermissionInAssociation(
      session.person_uuid,
      session.acting_as_uuid,
      'bank:teller'
    );
  }
  
  // Personal account - always allowed
  return true;
}
```

**UX Scenarios:**

**Tyler (personal context):**
```
My Accounts
├─ Tyler's Primary Account    ($1,234.56)
└─ Tyler's Savings Account     ($5,000.00)
```

**Tyler acting as Westbrook Society (Treasurer role):**
```
Westbrook Society Accounts
└─ Westbrook Society Main      ($12,345.67)
```

**Sarah acting as Community Bank Association (Board Member role):**
```
All Bank Accounts (Admin View)
├─ Tyler's Primary Account     ($1,234.56)
├─ Tyler's Savings Account      ($5,000.00)
├─ Westbrook Society Main       ($12,345.67)
├─ Garden Club Treasury         ($3,456.78)
└─ ... (all accounts visible)
[Admin Panel] [Reports] [Freeze Accounts]
```

### Mail

**Resources:**
- Mail posts/threads with `owner_uuid`
- `author_uuid` always tracks the actual person who wrote it

**Permissions:**
- `mail:moderator` (association-scoped) → Post as association, moderate its posts
- `mail:admin` (app-wide) → Moderate all posts system-wide

**Authorization:**

```typescript
function canCreatePost(
  session: Session,
  ownerUuid: string
): boolean {
  // Admin can post as anyone
  if (hasAppWidePermission(session.person_uuid, 'mail', 'admin')) {
    return true;
  }
  
  // Can always post as yourself
  if (ownerUuid === session.person_uuid) {
    return true;
  }
  
  // Posting as association requires acting as it AND having moderator permission
  if (ownerUuid === session.acting_as_uuid && ownerUuid !== session.person_uuid) {
    return hasPermissionInAssociation(
      session.person_uuid,
      ownerUuid,
      'mail:moderator'
    );
  }
  
  return false;
}
```

**UI Pattern:**

```typescript
// When composing post
{
  author_uuid: session.person_uuid,        // Tyler
  owner_uuid: session.acting_as_uuid,      // Tyler OR Westbrook Society
}
```

**Display:**
- Personal post: "Tyler Smith"
- Official post: "Westbrook Society" (with tooltip: "Posted by Tyler Smith")

### Marketplace

**Resources:**
- Listings with `seller_uuid`
- Orders with `buyer_uuid` and `seller_uuid`

**Permissions:**
- `marketplace:administrator` (association-scoped) → Manage association's listings
- `marketplace:admin` (app-wide) → Administer entire marketplace

**Authorization:**

```typescript
function getListings(session: Session): Listing[] {
  if (hasAppWidePermission(session.person_uuid, 'marketplace', 'admin')) {
    return db.prepare(`SELECT * FROM listing`).all();
  }
  
  return db.prepare(`
    SELECT * FROM listing WHERE seller_uuid = ?
  `).all(session.acting_as_uuid);
}
```

**UX:** Similar to bank - switch context to manage different sellers' listings.

### Governance

**Resources:**
- Motions, sessions, votes (mostly person-scoped)
- Some actions might be "official" proposals from committees

**Permissions:**
- Various governance permissions (mostly person-level)
- `governance:admin` (app-wide) for system administration

**Pattern:** Governance is primarily personal (individuals vote, propose motions), but could support committee-level actions via acting as.

---

## OIDC Token Model

### Token Claims Structure

```typescript
interface AccessTokenClaims {
  sub: string;              // person_uuid
  acting_as: string;        // current acting_as_uuid
  permissions: Permission[];
  // ... other claims
}

interface Permission {
  app: string;              // 'bank', 'mail', 'marketplace', 'governance'
  permission: string;       // 'teller', 'moderator', 'admin', etc.
  association_uuid?: string; // Present for association-scoped, absent for app-wide
}
```

### Token Issuance

Tokens are issued/refreshed when:
1. User logs in (initial token with `acting_as = person_uuid`)
2. User switches context (new token with updated `acting_as`)

```typescript
function issueTokens(session: Session) {
  const permissions = resolvePermissions(
    session.person_uuid,
    session.acting_as_uuid
  );
  
  return {
    access_token: signJWT({
      sub: session.person_uuid,
      acting_as: session.acting_as_uuid,
      permissions,
      // ...
    }),
    id_token: signJWT({
      sub: session.person_uuid,
      acting_as: session.acting_as_uuid,
      // ...
    })
  };
}
```

### Permission Resolution

```typescript
function resolvePermissions(
  personUuid: string,
  actingAsUuid: string
): Permission[] {
  // If acting as self, return all personal permissions
  // (from all roles in all associations)
  if (actingAsUuid === personUuid) {
    return db.prepare(`
      SELECT DISTINCT rp.app, rp.permission, r.association_uuid
      FROM role_permission rp
      JOIN role r ON r.uuid = rp.role_uuid
      JOIN role_assignment ra ON ra.role_uuid = r.uuid
      WHERE ra.person_uuid = ? AND ra.removed_at IS NULL
    `).all(personUuid);
  }
  
  // If acting as association, return only permissions from roles in that association
  return db.prepare(`
    SELECT DISTINCT rp.app, rp.permission, r.association_uuid
    FROM role_permission rp
    JOIN role r ON r.uuid = rp.role_uuid
    JOIN role_assignment ra ON ra.role_uuid = r.uuid
    WHERE ra.person_uuid = ? 
      AND r.association_uuid = ?
      AND ra.removed_at IS NULL
  `).all(personUuid, actingAsUuid);
}
```

---

## Audit Trail

Every action tracks both identities:

```typescript
interface AuditLog {
  action: string;
  person_uuid: string;      // Who actually did it
  acting_as_uuid: string;   // On whose behalf
  resource_type: string;
  resource_uuid: string;
  timestamp: string;
}
```

**Display formats:**
- Personal action: "Tyler Smith transferred $100"
- Association action: "Tyler Smith (as Westbrook Society Treasurer) transferred $500"
- Admin action: "Sarah Jones (as Community Bank Association Board Member) froze account"

**Key principle:** Never obscure who actually performed the action.

---

## Permission Catalog

### Community Bank

**Association-Scoped:**
- `bank:teller` — Manage association's bank accounts, make transfers
- `bank:view` — View association's accounts (read-only)

**App-Wide:**
- `bank:admin` — Full system administration, access all accounts, freeze accounts, adjust balances

### Mail

**Association-Scoped:**
- `mail:moderator` — Post as association, moderate association's posts
- `mail:member` — Post personal messages (default for all members)

**App-Wide:**
- `mail:admin` — Moderate all posts system-wide, manage mail settings

### Marketplace

**Association-Scoped:**
- `marketplace:administrator` — Manage association's listings, fulfill orders

**App-Wide:**
- `marketplace:admin` — Manage all listings, review reports, system settings

### Governance

**Association-Scoped:**
- `governance:motions_create` — Create motions
- `governance:motions_advance` — Advance motion lifecycle
- `governance:vote_sessions_create` — Create vote sessions
- ... (20+ governance permissions)

**App-Wide:**
- `governance:admin` — Administer governance infrastructure, sortition, roles

### Special Permission

**All Apps:**
- `act_as` — Can switch `acting_as_uuid` to this association

---

## UI/UX Patterns

### Context Switcher

**Location:** Persistent in header or sidebar across all apps

**Component:**
```svelte
<script lang="ts">
  import { page } from '$app/stores';
  
  let { session, availableContexts } = $props();
  
  function switchTo(contextUuid: string) {
    fetch('/api/session/switch-context', {
      method: 'POST',
      body: JSON.stringify({ acting_as_uuid: contextUuid })
    }).then(() => {
      window.location.reload(); // Reload to refetch data in new context
    });
  }
</script>

<div class="context-switcher">
  <button>
    {getCurrentContextLabel(session.acting_as_uuid)} ▼
  </button>
  <ul class="dropdown">
    {#each availableContexts as context}
      <li>
        <button onclick={() => switchTo(context.uuid)}>
          {context.label}
          {#if context.uuid === session.acting_as_uuid}✓{/if}
        </button>
      </li>
    {/each}
  </ul>
</div>
```

### Visual Indicators

**Personal Context:**
- Standard UI colors
- No badges or special indicators
- "Your Account", "Your Listings", etc.

**Association Context:**
- Association badge/icon (🏛️ or custom logo)
- Different header color or accent
- Clear labeling: "Westbrook Society Accounts"
- Reminder in UI: "Acting as: Westbrook Society (Treasurer)"

**Admin Context:**
- Admin badge/warning color
- "All Accounts (Admin View)" labeling
- Admin-specific UI elements (panels, reports, actions)

### Context Awareness

**Pages should reflect the current context:**

```svelte
<script lang="ts">
  let { session, accounts } = $props();
  
  const isPersonal = session.acting_as_uuid === session.person_uuid;
  const isAdmin = hasAppWidePermission(session.person_uuid, 'bank', 'admin');
</script>

<PageHeader>
  {#if isAdmin}
    All Bank Accounts (Admin View)
  {:else if isPersonal}
    My Accounts
  {:else}
    {getAssociationName(session.acting_as_uuid)} Accounts
  {/if}
</PageHeader>
```

---

## Open Questions

### 1. Multiple Admins per App
Can there be multiple governing associations per app?
- Example: Regional Community Bank Associations?
- Or single global authoritative association per app?
- **Leaning toward:** Single per app for simplicity

### 2. Cross-Context Actions
Can you transfer from personal account to association account in one action?
- Requires access to both contexts simultaneously
- **Options:**
  - A: Must switch contexts twice (transfer out, switch, transfer in)
  - B: Allow specifying different source/destination contexts in transaction
- **Leaning toward:** Option B for better UX (with proper permission checks)

### 3. Token Refresh on Context Switch
Should switching context:
- **Option A:** Issue new token (stateless, works across apps)
- **Option B:** Just update session, clients re-request with cookie (stateful)
- **Leaning toward:** Option A for OIDC compliance and cross-app consistency

### 4. Emergency Admin Access
Should app-wide admins be able to act on resources WITHOUT switching context?
- Use case: Quick moderation action while browsing personally
- **Leaning toward:** No — must switch to admin context (clearer audit trail, prevents accidents)

---

## Implementation Plan

**Note:** This is a clean break implementation. No backwards compatibility or data migration required.

### Phase 1: Foundation
- ✅ Session system with `person_uuid` and `acting_as_uuid` (already exists)
- ✅ `updateActingAs()` function (already exists)
- Add `governs_app` column to association table
- Designate special associations (Community Bank Association, Communications Service, Commerce Service)
- Add `act_as` permission to permission catalog

### Phase 2: Context Switching Infrastructure
- Create `getAvailableContexts()` function
- Create API endpoint for switching context
- Update OIDC token issuance to use `acting_as_uuid`
- Update permission resolution logic

### Phase 3: Authorization Updates
- Implement simple ownership checks (`owner_uuid = acting_as_uuid`)
- Add app-wide admin checks where needed
- Update all resource queries to use `acting_as_uuid`
- Remove old complex permission queries

### Phase 4: UI Components
- Build context switcher component
- Add to all app layouts
- Style for personal/association/admin contexts
- Add visual indicators and context awareness

### Phase 5: Per-App Rollout
- **Community Bank:** Update account queries, transfers, UI
- **Mail:** Update post creation, viewing, moderation
- **Marketplace:** Update listing management, orders
- **Governance:** Add context support where appropriate

### Phase 6: Testing & Polish
- Test context switching flows
- Test permission boundaries
- Test app-wide admin access
- Verify audit logs
- Performance testing

### Phase 7: Documentation
- User guide for context switching
- Developer guide for authorization patterns
- Permission catalog reference

---

## Decision Log

### Decided

1. **Use `acting_as` model** — Context switching provides clean UX separation
2. **Gate with `act_as` permission** — Not all roles allow representing the association
3. **Simple ownership checks** — `owner_uuid = acting_as_uuid` instead of complex joins
4. **Two permission types** — Association-scoped and app-wide admin
5. **No association hierarchy** — Associations cannot be members of other associations
6. **Full audit trail** — Always track both `person_uuid` and `acting_as_uuid`
7. **Context switcher UI** — Persistent component in header/sidebar
8. **Special association designation** — Database field `association.governs_app`
9. **Personal view for app-wide admins** — See only personal resources when acting as yourself; must switch to admin association context to access admin view (clean separation)
10. **No backwards compatibility needed** — This is a clean break implementation; no migration of existing data required

### To Be Decided

1. Multiple admins per app (single vs multiple authoritative associations)
2. Cross-context transaction support
3. Token refresh mechanism on context switch
4. Emergency admin access without context switch

---

## Success Criteria

- ✅ Clear separation between personal and organizational contexts
- ✅ Simple, performant queries (`WHERE owner_uuid = ?`)
- ✅ Intuitive UX (context switcher + visual indicators)
- ✅ Complete audit trail (who did what as whom)
- ✅ Secure permission boundaries (can't access what you shouldn't)
- ✅ No accidental admin actions in personal mode
- ✅ Scalable to many associations and permissions
