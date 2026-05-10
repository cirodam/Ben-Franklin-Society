# The Ben Franklin Society
## Governance App
### Technical Design Document

---

## Overview

The Governance app is the hub of the per-society stack. It serves three foundational roles:

1. **Identity provider** — runs the OIDC server that all satellite apps authenticate against. One login for the whole stack.
2. **Member and association registry** — the authoritative record of who belongs to the society and what associations exist. Revoking membership here immediately cuts access to all satellite apps.
3. **Governance platform** — the Document Library, Motion System, and Calendar through which the society conducts its deliberative life.

The Governance app also houses the **Central Bank** as an internal function — not a separate process, but a module within Governance that runs issuance, demurrage, and fires membership lifecycle events.

The Governance app is administered directly by the Assembly. There is no administering Service; Assembly members holding elevated roles within Governance manage account administration and configuration.

---

## Identity Provider

The Governance app runs an OpenID Connect (OIDC) / OAuth 2.0 authorization server. All satellite apps (Community Bank, Mail, Marketplace) are OIDC relying parties that delegate authentication entirely to Governance.

### Session and the "Acting As" Claim

A member may act as themselves or as any association in which they hold an `act-as` role. When a member authenticates, the OIDC session carries:

- `sub` — the member's UUID
- `acting_as` — the UUID of the principal the member is currently acting as (defaults to the member's own UUID; may be an association UUID if the member switches context)
- `permissions` — the resolved permission set from the member's active role in the `acting_as` association

Satellite apps use `acting_as` to determine whose accounts, mailbox, and listings are in scope, and `permissions` to gate actions. They do not need to know anything about role names, association types, or internal structure — only the resolved claim.

Members may switch their active context (themselves vs. an association they belong to) at any time; switching re-issues the session with the new `acting_as` and `permissions` values.

---

## Member Registry

The member registry is the authoritative source of truth for membership. It stores:

- UUID (assigned at creation, permanent)
- Handle local part (unique within the society's namespace)
- Full handle (`localpart@societyhandle`)
- Name, date of birth, contact information
- Membership status (active, suspended, revoked)
- Membership start date

Handle changes are permitted; the UUID never changes. All internal cross-references use the UUID. Handles are for display and addressing only.

On member creation, Governance:
1. Assigns a UUID and provisions the OIDC identity
2. Fires a `member.created` event consumed by the Central Bank and Community Bank
3. The Central Bank adds the member to the issuance roll
4. The Community Bank creates a Frank account for the member

On membership revocation, Governance revokes the OIDC credential. All satellite app sessions tied to that credential become invalid immediately.

---

## Associations

Associations are first-class principals alongside members. The registry stores all associations — their UUID, handle, type, member list, and role list.

### Association Types

All types share the same underlying model. The type determines how membership is populated and what governance rules apply; satellite apps see no distinction.

| Type | Description | Membership assigned by |
|---|---|---|
| Association | Private or member-specific purpose | Self / invitation |
| Service | Community institution, Assembly-established | Assembly designation |
| College | Self-governing body of peers in a domain | Peer evaluation |
| Committee | Governance-active body drawn from a College | Sortition from College |
| Assembly | Primary legislative body of the society | Sortition from membership |

### Roles and Permissions

Each satellite app publishes a fixed set of named **permissions**. Within Governance, an association creates named **roles** composed of those permissions. Members are assigned roles within the association.

```
App defines permissions
  → Association creates named roles from those permissions (in Governance)
    → Members are assigned roles
      → OIDC session carries: acting_as UUID + resolved permissions
        → Satellite app enforces accordingly
```

The `act-as` permission grants the ability to act on behalf of the association in satellite apps. All other access is determined by the remaining permissions in the role. There is no separate custodian concept.

Roles are defined and managed entirely within Governance. Satellite apps only ever see the resolved permission set from the session claims.

### Administering Services

Each satellite app has exactly one administering Service. Members of that Service who hold a role with elevated permissions administer the app — account administration, moderation, configuration. This is the only mechanism for elevated access; there are no other admin roles.

| App | Administering Service |
|---|---|
| Community Bank | Community Bank Service |
| Mail | Communications Service |
| Marketplace | Commerce Service |
| Governance | Governed directly by the Assembly |

---

## Document Library

A structured library of the society's governing and operational documents.

### Structure

```
Document
  └── Articles
        └── Sections
              ├── prose      — the operative text
              └── rationale  — the reasoning behind it
```

The prose/rationale split keeps the *why* visible alongside the *what* and supports deliberation when sections are amended.

### Ownership

Documents are optionally owned by an association. An unowned document belongs to the society at large. An association-owned document is published under that association's authority — e.g. a College's standards, a Service's operating procedures.

Governing documents — the charter, constitution, bylaws, standing rules, ordinances — live here as the authoritative published record.

### Amendment

When an amendment motion is enacted, the Document Library is updated directly and automatically as a structured effect. The previous version is retained in revision history.

---

## Motion System

Motions are the mechanism by which governance decisions are made and recorded.

### Lifecycle

```
Draft → Introduced → Deliberation → Vote → Enacted / Rejected / Withdrawn
```

Any member may introduce a motion. At every stage, all members can see the motion and post comments. Who may advance the motion and who may vote depends on the body the motion is before.

| Stage | Who may act |
|---|---|
| Draft → Introduced | Any member |
| Introduced → Deliberation | The receiving body (Committee, Assembly, or community) |
| Deliberation → Vote | The receiving body |
| Vote | The receiving body only (Committee, Assembly, or full community for referendum) |

Motions may reference documents, sections, or other motions. References are stored as UUID links so they remain valid if handles change.

### Structured Effects

A motion may carry a **structured effect** — a machine-readable payload the system executes automatically on enactment. If no structured effect is attached, the motion is declaratory: binding on the community but executed by humans.

| Effect type | Triggered by |
|---|---|
| Amend document section | Amendment motion enacted |
| Create association | Establishment motion enacted |
| Add / remove association member | Membership motion enacted |
| Modify scheduled transfer | Budget or payroll motion enacted |
| Adjust dues rate | Assembly resolution enacted |
| Populate calendar event | Motion establishing a scheduled meeting |

Structured effects are executed transactionally with the motion's enactment record. If the effect fails, the motion does not advance to Enacted status.

---

## Calendar

A community calendar for events important to society life — Assembly sessions, Committee meetings, Service events, community gatherings.

Any member may create a personal event. Associations may post events on behalf of themselves (subject to `act-as` permission). Enacted motions may automatically populate calendar events as a structured effect.

---

## Central Bank (internal module)

The Central Bank is not a separate app. It is a module within the Governance app that operates under direct Assembly authority and has no member-facing UI.

### Responsibilities

- **Membership roll** — maintains the issuance roll derived from the member registry. The roll is updated automatically on `member.created` and `member.revoked` events.
- **Birthday issuance** — on each member's birthday, deposits 2,000 Franks into the Treasury via a scheduled transfer to the Community Bank.
- **Demurrage** — on a regular schedule, pulls Franks from member accounts above the demurrage threshold into the Treasury. Implemented as a scheduled transfer instruction sent to the Community Bank.
- **Lifecycle events** — fires events consumed by downstream apps when membership status changes.

### Event Contracts

| Event | Fired when | Consumed by |
|---|---|---|
| `member.created` | New member registered | Community Bank (create account) |
| `member.revoked` | Membership revoked | Community Bank (freeze account) |
| `member.birthday` | Member's birthday | Community Bank (execute issuance transfer) |
| `demurrage.run` | Demurrage schedule fires | Community Bank (execute demurrage transfers) |

Events are delivered in-process between the Central Bank module and Governance's own functions, and via a lightweight internal event bus to satellite apps. The satellite apps subscribe at startup and process events idempotently.
