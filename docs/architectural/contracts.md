# The Ben Franklin Society
## Contract System
### Design Document

---

## Purpose

The contract system provides a trustworthy record of bilateral agreements between principals — members, associations, societies, and inter-society associations. It is a **record and jurisdiction system**, not an execution engine. It stores the text of agreements, identifies the two parties unambiguously, tracks the lifecycle of the contract, and declares the mediation path if something goes wrong.

All contracts are bilateral — exactly two parties. Multi-party arrangements (joint associations, collective procurement) are structured as a set of bilateral contracts, each governing one relationship. This keeps jurisdiction, signing, and dispute resolution unambiguous.

The system does not interpret the terms of any contract. What the parties have agreed to is in the text. What the system guarantees is that the text is authentic, that the parties who signed it are identified without ambiguity, and that nothing about the contract can be silently changed after signing.

---

## Integrity Guarantees

A contract in this system carries the following guarantees:

- **Authenticity** — every party has signed the final contract body with their society's private key (or their own keypair for member-level contracts within a single society). The signatures are stored with the contract and can be independently verified.
- **Immutability** — once all parties have countersigned and the contract becomes `active`, the body is frozen. No edits are possible. The content hash signed by the parties is the permanent reference.
- **Non-repudiation** — a party cannot later deny having agreed. The signature is the record.
- **Append-only history** — every status change, milestone attestation, dispute declaration, and force majeure event is appended to the contract's event log. Nothing is ever deleted or overwritten.
- **Public readability** — all active contracts are publicly readable by any member of any society. Parties have no privacy claim over the existence or terms of an agreement they have entered into as organizational actors. Individual members contracting privately within their own society may elect intra-society visibility only.

---

## Jurisdiction

Every contract declares a jurisdiction at formation. Jurisdiction cannot be changed after signing.

**Intra-society** — all parties are within the same society. The contract is governed by that society's constitution and internal law. Disputes are submitted to whatever dispute resolution body the society maintains. The contract is stored at the society level and is visible within the society; it may optionally be published to the federation.

**Inter-society** — parties span more than one society. The contract is governed by the Charter and federation membership terms. Disputes are submitted to Federation mediation. The contract is stored at the Federation level and is publicly visible across the network.

For cross-society contracts involving individual members (a member of Society A contracting with a member of Society B), the parties elect a jurisdiction at formation — typically the society where the primary obligation is performed, or inter-society if they prefer Federation mediation. The election is explicit and signed along with the contract body.

---

## Contract Lifecycle

```
draft → active → completed
              ↓
           disputed → resolved → completed | terminated
              ↓
           terminated
```

- **Draft** — the contract is being assembled. Parties may be added; text may be revised. No party is bound.
- **Active** — all parties have countersigned. The body is frozen. Obligations are in effect.
- **Completed** — all milestones have been attested and all obligations fulfilled. The contract closes.
- **Disputed** — any party has declared a dispute. The mediation path activates. Milestone payments are suspended pending resolution.
- **Terminated** — the contract has ended before completion, either by mutual agreement or as a result of dispute resolution. The record is preserved permanently.

---

## Data Model

### `contract`

| Column | Type | Description |
|---|---|---|
| `uuid` | TEXT | PRIMARY KEY |
| `title` | TEXT | NOT NULL |
| `body` | TEXT | NOT NULL — the full agreement text |
| `body_hash` | TEXT | NOT NULL — SHA-256 of the body; this is what parties sign |
| `jurisdiction` | TEXT | NOT NULL — `intra` or `inter` |
| `jurisdiction_society_handle` | TEXT | NOT NULL if `intra` — the governing society |
| `status` | TEXT | NOT NULL — `draft`, `active`, `completed`, `disputed`, `terminated` |
| `effective_date` | DATE | NULL — when obligations begin; set at countersigning if not specified |
| `expiry_date` | DATE | NULL — open-ended if null |
| `created_at` | DATETIME | NOT NULL |
| `activated_at` | DATETIME | NULL — when the last countersignature was received |
| `closed_at` | DATETIME | NULL — when status moved to `completed` or `terminated` |

### `contract_party`

Exactly two rows per contract — `party_a` and `party_b`.

| Column | Type | Description |
|---|---|---|
| `uuid` | TEXT | PRIMARY KEY |
| `contract_uuid` | TEXT | NOT NULL, FK → `contract.uuid` |
| `side` | TEXT | NOT NULL — `party_a` or `party_b` |
| `principal_uuid` | TEXT | NOT NULL — UUID of the member, association, society, or inter-society association |
| `principal_handle` | TEXT | NOT NULL — handle at time of signing (for the permanent record) |
| `principal_society_handle` | TEXT | NOT NULL — which society this principal belongs to |
| `role` | TEXT | NOT NULL — the party's named role in this contract (e.g. `buyer`, `seller`, `guarantor`) — free text, defined by the parties |
| `signature` | TEXT | NULL — the party's cryptographic signature over `body_hash`; NULL until countersigned |
| `signed_at` | DATETIME | NULL |

### `contract_milestone`

| Column | Type | Description |
|---|---|---|
| `uuid` | TEXT | PRIMARY KEY |
| `contract_uuid` | TEXT | NOT NULL, FK → `contract.uuid` |
| `title` | TEXT | NOT NULL |
| `description` | TEXT | |
| `due_date` | DATE | NULL |
| `transfer_amount` | INTEGER | NULL — Franks to be transferred on attestation; NULL if no payment tied to this milestone |
| `transfer_from_party_uuid` | TEXT | NULL, FK → `contract_party.uuid` |
| `transfer_to_party_uuid` | TEXT | NULL, FK → `contract_party.uuid` |
| `status` | TEXT | NOT NULL — `pending`, `attested`, `skipped` |
| `attested_by_party_uuid` | TEXT | NULL, FK → `contract_party.uuid` — the party who attested delivery |
| `attested_at` | DATETIME | NULL |

### `contract_event`

The append-only event log. One row per state change or significant action.

| Column | Type | Description |
|---|---|---|
| `uuid` | TEXT | PRIMARY KEY |
| `contract_uuid` | TEXT | NOT NULL, FK → `contract.uuid` |
| `event_type` | TEXT | NOT NULL — `countersigned`, `activated`, `milestone_attested`, `dispute_declared`, `force_majeure_declared`, `force_majeure_lifted`, `mediation_opened`, `mediation_finding`, `completed`, `terminated` |
| `actor_party_uuid` | TEXT | NULL, FK → `contract_party.uuid` — which party caused this event |
| `detail` | TEXT | NULL — free text; required for `dispute_declared` and `force_majeure_declared` |
| `recorded_at` | DATETIME | NOT NULL |

---

## Dispute and Force Majeure

### Dispute Declaration

Any party may declare a dispute at any time while the contract is `active`. Declaring a dispute:
- Moves the contract to `disputed`
- Suspends pending milestone payment obligations
- Opens the mediation path defined by the contract's jurisdiction
- Appends a `dispute_declared` event with the declaring party and their stated reason

Disputes are resolved by the jurisdiction's mediation body. The outcome is recorded as a `mediation_finding` event. The finding may direct the contract to `completed` (obligations satisfied as modified by the finding), `terminated` (contract ends), or `active` (dispute resolved, contract continues).

### Force Majeure

Any party may declare force majeure — circumstances beyond their control that prevent fulfillment of their obligations. Force majeure:
- Does not move the contract to `disputed`
- Suspends milestone deadlines for the declaring party
- Opens a negotiation period between the parties
- Does not automatically trigger mediation — the parties may resolve it themselves

If the parties cannot agree on how to proceed after force majeure, any party may then declare a dispute and invoke the mediation path.

---

## Storage

**Intra-society contracts** are stored in the Governance app's database at the named society. They are accessible to members of that society. Intra-society contracts marked for federation publication are also mirrored to the Federation.

**Inter-society contracts** are stored at the Federation. Both (all) parties' societies hold a local mirror — a read-only copy with the same `uuid` and `body_hash`. The Federation copy is authoritative; mirrors are for local reference and offline access. The `body_hash` allows any party to verify their mirror matches the authoritative record.
