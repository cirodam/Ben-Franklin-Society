# The Ben Franklin Society
## Technology Architecture

---

## Principles

- Each society self-hosts its own stack
- One identity, one login, across all apps
- Membership is a governance function — identity flows from it
- The Federation federates between societies; it does not govern them

---

## Handles

Every principal — member, association, and society — has a unique **handle** and a permanent **UUID**.

The UUID is assigned at creation and never changes. It is the stable identifier used internally across all apps and in the database. The handle is the human-readable address and may be changed by the principal. All cross-references between apps use the UUID; handles are for display and addressing only.

The format is `localpart@societyhandle`, e.g. `tylerdteague@franklincountyga`. Society handles are registered with and made unique by the Federation. Local parts are unique within a society. Members and associations share the same local namespace within a society. The full handle is globally unique across the federation.

Handles are the universal addressing scheme across all apps — mail addresses, marketplace seller identity, cross-society references, and any other context where a principal needs to be identified or addressed.

---

## Principals

Two types of principals exist in the system: **members** and **associations**.

An **association** is a group of members acting together for a defined purpose. Associations are first-class principals — they can hold bank accounts, have a mail address, and operate in the marketplace.

Every association has:
- A **member list** — the members who belong to it
- A **role list** — named roles defined by the association, each composed of a set of permissions and a list of members who hold that role

The ability to act as the association in satellite apps is itself a permission on a role. There is no separate "custodian" concept — a member who holds a role with the `act-as` permission can act on behalf of the association. All other access is determined by the permissions their role carries.

Associations are of several kinds, distinguished by their purpose and how members and roles are assigned:

| Type | Description | Membership assigned by |
|---|---|---|
| Association | Private or member-specific purpose | Self / invitation |
| Service | Community institution, Assembly-established | Assembly designation |
| College | Self-governing body of peers in a domain | Peer evaluation |
| Committee | Governance-active body drawn from a College | Sortition from College |
| Assembly | Primary legislative body of the society | Sortition from membership |

All types share the same underlying model — UUID, handle, member list, roles, document ownership, bank accounts. The type determines how membership is populated and what governance rules apply, not how the rest of the system treats them.

All associations must be registered in the Governance app. The Assembly designates the type of each association.

When a member logs into a satellite app, they may act as themselves or as any association in which they hold an `act-as` role. The active context (member or association) is carried in the OIDC session as an "acting as" claim along with the resolved permission set for their active role. Satellite apps use this to determine whose accounts, mailbox, and listings are in scope and what actions are permitted.

Satellite apps treat all associations identically — they have no concept of association type. That distinction is purely a Governance concern. The Governance app knows which associations are Services and surfaces their balances, records, and activity to the membership accordingly.

## Roles and Permissions

Each satellite app publishes a fixed set of named **permissions** that it understands. Within the Governance app, an association creates named **roles** composed of those permissions. Members are then assigned roles within the association.

When a member acts on behalf of an association in a satellite app, the OIDC session carries both the "acting as" claim and the resolved permission set from their active role. The satellite app enforces those permissions without needing to know anything about role names or association structure.

```
App defines permissions
  → Association creates named roles from those permissions (in Governance)
    → Members are assigned roles
      → OIDC session carries: acting-as UUID + active permissions
        → Satellite app enforces accordingly
```

Roles are defined and managed entirely within Governance. Satellite apps only see the resolved permission set.

---

Each satellite app has exactly one administering Service, established by the Assembly. Members of that Service holding a role with elevated permissions administer the app — account administration, moderation, configuration. This is the only way elevated access is granted; there are no other admin roles.

| App | Administering Service |
|---|---|
| Community Bank | Community Bank Service |
| Mail | Communications Service |
| Marketplace | Commerce Service |
| Governance | Governed directly by the Assembly |

---

## Per-Society Stack

### Governance App
The hub of the system. Runs the OIDC identity provider and serves as the authoritative member and association registry. Revoking membership here immediately cuts access to all satellite apps. Also houses the Central Bank as an internal module.

See [governance_app/governance_app.md](governance_app/governance_app.md) for the full design.

### Community Bank App *(OIDC relying party)*
The member-facing financial utility. Holds Frank accounts, processes transactions, and maintains the authoritative ledger. Payroll, dues, Social Insurance Fund allowances, issuance, and demurrage all run as scheduled transfers — the same primitive, different direction and authorization. Administered by the **Community Bank Service**.

See [community_bank_app/community_bank_app.md](community_bank_app/community_bank_app.md) for the full design.

### Mail App *(OIDC relying party)*
Internal society messaging using handles as addresses. Intra-society delivery is local; inter-society mail is delivered peer-to-peer between societies. Unknown societies are discovered via the Federation before first contact. Mailboxes are provisioned for all principals — members and associations alike. Administered by the **Communications Service**.

See [mail_app/mail_app.md](mail_app/mail_app.md) for the full design.

### Marketplace App *(OIDC relying party)*
The virtual marketplace. Members and associations list goods and services. Interested parties connect via Mail and settle through the Community Bank directly — there is no automated payment flow. Federated browsing pulls listings directly from neighboring societies' endpoints. Administered by the **Commerce Service**.

See [marketplace_app/marketplace_app.md](marketplace_app/marketplace_app.md) for the full design.

---

## Federation

The Federation operates at the federation tier — one instance for the whole network, not per society. Its role is **coordination, not mediation**. Most community-to-community interactions are peer-to-peer; the Federation provides the infrastructure that makes peer relationships possible.

**What the Federation does:**
- **Society directory** — the authoritative registry of all societies in the federation. Each entry holds the society's handle, endpoint, public key, and coordinates. Society handles are globally unique by virtue of being registered here. Societies query the directory on demand to discover contact details for societies they haven't previously interacted with, then communicate directly and cache the result locally in `neighboring_society`. The Federation also notifies nearby societies when a new one registers. If the Federation is unreachable, a society may ask a known peer for contact details; peer-provided details are accepted provisionally and verified against the directory when it is next reachable.
- **Clearinghouse** — tracks net Frank positions between societies and issues rebalancing instructions when imbalances grow large. Does not hold Franks; all balances live in local ledgers.
- **Federation membership** — maintains the allow-list of active societies. Can revoke federation membership for persistent abuse.

**What the Federation does not do:**
- Route or relay mail or transfers between societies
- Store mail content
- Hold or custody Franks
- Govern any individual society

See [federation/federation.md](federation/federation.md) for the full design.

---

## Event Flow (example: new member admitted)
1. Governance registers member → provisions OIDC identity
2. Governance fires membership event → Central Bank mints 0 Franks to Treasury (birthday issuance runs on birthday)
3. Community Bank creates Frank account for member
4. Member can now log into all satellite apps with one credential
---

## Technology
- **Runtime:** Node.js
- **Language:** TypeScript
- **Database:** SQLite — no separate database server, just a file. Operationally simple and fully ACID compliant. Suitable for the write volumes of a community bank.
- **Replication:** Litestream — continuously streams the SQLite write-ahead log to one or more standby nodes in different physical locations. Supports the primary + warm standby resilience model without requiring PostgreSQL.
- **Auth protocol:** OpenID Connect (OIDC) / OAuth 2.0
- **UI framework:** SvelteKit — each app is a full-stack SvelteKit application that serves its own frontend. No separate frontend deployment; a society installs one process per app and gets both the API and the UI from it.
- **Monorepo:** pnpm workspaces + Turborepo

### Repository Structure

```
/
├── apps/
│   ├── governance/          # OIDC provider + Governance app
│   ├── community-bank/      # Community Bank app
│   ├── mail/                # Mail app
│   ├── marketplace/         # Marketplace app
│   └── federation/          # Federation tier (separate deployment)
├── packages/
│   ├── types/               # Shared TypeScript types: handles, UUIDs, OIDC claims, event payloads, permissions
│   ├── db/                  # Shared SQLite/Litestream setup and migration primitives
│   └── ui/                  # Shared Svelte components and design primitives
└── turbo.json
```

Each app under `apps/` is a SvelteKit project and is independently deployable — a society runs `apps/governance`, `apps/community-bank`, `apps/mail`, and `apps/marketplace` as separate Node.js processes. Each process serves both its API routes and its UI. No reverse proxy or separate static host is required. The `apps/federation` lives in the same repo but is deployed at the federation tier, not per-society.

All cross-app contracts (OIDC claim shapes, event payloads, permission names, handle format) are defined once in `packages/types` and imported by the apps that need them.

---

*This document is a living outline. Details are filled in as each component is designed.*
