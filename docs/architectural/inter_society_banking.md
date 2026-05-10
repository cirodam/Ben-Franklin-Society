# The Ben Franklin Society
## Inter-Society Banking
### Design Document

---

## Overview

Franks are fungible across all Ben Franklin Society communities. A member of Society A can send Franks directly to a member of Society B, and 1 Frank is worth 1 Frank regardless of which society issued it.

The system uses a **correspondent banking model**: each Community Bank maintains a special Clearinghouse Account that acts as a running tab of the society's net position across all inter-society activity. The Federation's clearinghouse service tracks net bilateral positions and issues rebalancing instructions when imbalances grow large. Societies communicate directly for transfers; the Federation handles reconciliation and rebalancing, not individual transaction routing.

This model is designed to be:
- **Resilient** — if the Federation is offline, transfers still settle between the two societies and are reconciled when it returns.
- **Hard to game** — fabricating a transfer requires two independent ledgers (at both societies) to agree. The Federation cross-verifies both.
- **Auditable** — every inter-society transfer is recorded on two local ledgers and reported to the Federation.

---

## The Clearinghouse Account

Every Community Bank has exactly one Clearinghouse Account. It is an ordinary account in the data model — a row in `account` — but carries special significance:

- Its `principal_uuid` is the society's own UUID (registered at the Federation)
- It functions like a nostro account in correspondent banking: its balance reflects the society's net position against the federation as a whole
- A **negative balance** means the society has been a net exporter of Franks (sent more out than received) — it is in deficit
- A **positive balance** means the society has received more than it has sent — it is in surplus
- There is one Clearinghouse Account per society, not one per neighbor pair — the bilateral positions are tracked by the Federation, not locally

When a member sends Franks to another society, both the sender's account and the Clearinghouse Account are debited. When a member receives Franks from another society, both the recipient's account and the Clearinghouse Account are credited. The Clearinghouse Account balance is the live, continuously-updated net position.

---

## Society Identity and Authentication

Each society has an asymmetric keypair used to sign and verify inter-society messages.

- The **private key** is held by the Governance app outside the database (same pattern as MFA secrets — encrypted at rest, never stored in the DB)
- The **public key** is registered with the Federation at society setup time
- Neighboring societies cache each other's public keys locally (in the `neighboring_society` table) when introduced by the Federation
- Public keys are refreshed from the Federation periodically and whenever a verification fails unexpectedly

Every inter-society message — transfer requests, acknowledgements, reconciliation reports — is signed by the sending society's private key and verified by the recipient against the cached public key before any action is taken. An unverifiable signature is rejected outright.

---

## Transfer Flow: Direct Neighbors

When both societies know each other (both appear in each other's `neighboring_society` table):

1. **Initiation** — the sender enters a transfer to `handle@remote-society` in their Community Bank UI. The app looks up `remote-society` in `neighboring_society` to get the endpoint and confirms the neighbor is reachable.

2. **Send** — Society A signs a transfer payload (sender UUID, recipient handle, amount, timestamp, nonce) with its private key and sends it directly to Society B's Community Bank API.

3. **Receipt and credit** — Society B verifies the signature. If valid, it:
   - Resolves the recipient handle to a local `account`
   - Credits the recipient's account: +amount
   - Credits Society B's Clearinghouse Account: +amount
   - Records an `inter_society_transfer` row (`status = received`)
   - Returns a signed acknowledgement to Society A

4. **Debit** — Society A receives and verifies the acknowledgement. It then:
   - Debits the sender's account: −amount
   - Debits Society A's Clearinghouse Account: −amount
   - Records an `inter_society_transfer` row (`status = settled`)

5. **Reporting** — both societies independently report the completed transfer to the Federation (asynchronously). The Federation cross-verifies that both reports match.

The debit does not happen until the signed acknowledgement is received. The sender's Franks are not debited speculatively — if Society B is offline or rejects the transfer, nothing changes on Society A's ledger.

---

## Contact Discovery

Before a transfer can proceed, the recipient's society must be present in Society A's `neighboring_society` table. If it is not, Society A performs a **contact discovery** lookup first:

1. **Federation lookup** — Society A queries the Federation for the recipient society's contact details: endpoint, public key, and coordinates. The Federation returns the record if the society is a registered, active federation member.
2. **Cache locally** — Society A writes the society to its `neighboring_society` table.
3. **Transfer proceeds** — the transfer then continues exactly as the [direct neighbor flow](#transfer-flow-direct-neighbors).

### Federation Unavailable

If the clearinghouse is unreachable when Society A needs to discover a new society:

1. Society A asks one or more known neighbors (already in `neighboring_society`) whether they have contact details for the target society
2. A neighbor that knows the target society returns the details, including its cached public key
3. Society A accepts these details provisionally and caches them in `neighboring_society`
4. The transfer proceeds as normal using the peer-provided public key
5. When the clearinghouse is next reachable, Society A verifies the cached public key against the authoritative registry. If they differ, the row is updated and flagged for administrator review.

Peer gossip of contact details is an availability optimization — it does not weaken security. Signature verification still occurs on every message and the Federation remains the authoritative source for public keys.

---

## Pending Transfers

If Society B is offline when Society A attempts a transfer:

- Society A records an `inter_society_transfer` row with `status = pending`
- The sender's account is placed in a soft hold for the pending amount — the balance appears reduced but the debit has not been posted to the ledger yet
- Society A retries on an exponential backoff schedule
- The sender sees the transfer as "pending" in their transaction history
- If the transfer does not settle within a configurable timeout, it is cancelled: the hold is released, the sender is notified, no ledger entries are made

A pending transfer that succeeds on retry proceeds through the normal flow from step 3 onward.

---

## Reconciliation

Periodically (and whenever either society requests it), the Federation reconciles reported transfers against both local records:

1. Each society pushes its inter-society transfer log to the Federation for the reconciliation window
2. The Federation matches transfers by their shared transaction reference (a UUID generated by Society A and included in both records)
3. Discrepancies are flagged:
   - **One-sided**: Society A reports a transfer that Society B has no record of (or vice versa)
   - **Amount mismatch**: both report the transfer but with different amounts (should be impossible if signatures were verified, but caught here as a final check)
4. Flagged discrepancies are held for human review by Community Bank Service administrators at both societies and at the Federation

A well-functioning pair of societies should have zero discrepancies. Discrepancies indicate a software bug, a network failure that wasn't recovered, or an attempted fraud.

---

## Rebalancing

The Federation monitors net bilateral positions. When a society's Clearinghouse Account balance crosses a configurable threshold (too deeply negative or too strongly positive), the Federation may initiate a rebalancing:

- The Federation issues a **settlement instruction** to both affected societies
- The instruction is a scheduled transfer: move X Franks from the surplus society's Clearinghouse Account to the deficit society's Clearinghouse Account
- Both local Community Banks execute this as a normal scheduled transfer and record it on their ledgers
- The Federation records the settlement and adjusts its position tracking

Rebalancing is gradual — it is not a sudden forced correction. The Federation targets a slow drift back toward balance rather than an immediate zeroing. The threshold and pace are Federation configuration, not society configuration.

Rebalancing does not create or destroy Franks. It moves Frank balances between Clearinghouse Accounts. The total supply across all societies is conserved.

---

## Data Model Implications

This design requires the following additions or extensions to the existing data model:

### In Governance (`neighboring_society` — already planned)
- `public_key_cache` — the neighbor's public key, cached locally for signature verification
- Needs to be added to the `neighboring_society` table

### In Community Bank (new table: `inter_society_transfer`)
One row per inter-society transfer, on both the sending and receiving side.

| Column | Type | Description |
|---|---|---|
| `uuid` | TEXT | PRIMARY KEY |
| `transaction_ref` | TEXT | UNIQUE — shared reference generated by the initiating society, used for Federation reconciliation |
| `direction` | TEXT | `outbound` (we sent) or `inbound` (we received) |
| `remote_society_handle` | TEXT | The counterparty society |
| `local_account_uuid` | TEXT | FK → `account.uuid` — the sender's or recipient's local account |
| `clearinghouse_account_uuid` | TEXT | FK → `account.uuid` — this society's Clearinghouse Account |
| `amount` | INTEGER | In Franks |
| `status` | TEXT | `pending`, `settled`, `failed`, `cancelled` |
| `initiated_at` | DATETIME | When the transfer was first attempted |
| `settled_at` | DATETIME | When both sides confirmed |
| `transaction_uuid` | TEXT | FK → `transaction.uuid` — set when the ledger entries are posted |
| `failure_reason` | TEXT | Set if status = failed or cancelled |

### In Community Bank (Clearinghouse Account)
The Clearinghouse Account is an ordinary `account` row. Its `name` is `Clearinghouse` and its `principal_uuid` is the society's own UUID. No new table is needed — just a known special account like Treasury.

---

## Security Properties

- **Signature verification** — every inter-society message is signed and verified. A message that cannot be verified against the sender's registered public key is rejected before any state change.
- **Two-ledger corroboration** — a fraudulent transfer requires two independent ledgers to agree. Society A cannot credit a member's account without Society B having a matching debit record (and vice versa), because the Federation cross-verifies both during reconciliation.
- **Nonce / replay protection** — each transfer payload includes a nonce. Society B rejects a payload whose nonce has already been seen, preventing replay attacks.
- **No speculative debits** — Society A does not post a debit until it receives a signed acknowledgement from Society B. There is no window in which Franks are in transit and unaccounted for.
- **Federation as auditor, not custodian** — the Federation never holds Franks. It cannot be robbed. Its failure degrades reconciliation and rebalancing, but not the ability to transact.
