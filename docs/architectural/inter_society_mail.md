# The Ben Franklin Society
## Inter-Society Mail
### Design Document

---

## Overview

Members and associations can send mail to principals at other Ben Franklin Society communities using the same handle format used everywhere: `localpart@societyhandle`. There is no separate addressing namespace for inter-society mail — a handle is a handle.

Inter-society mail uses the same peer-to-peer trust infrastructure as inter-society banking. Neighboring societies deliver messages directly to each other. When a society needs to reach one it has not previously communicated with, it first queries the Federation for that society's contact details, then delivers the message directly.

---

## Delivery Model

### Direct Neighbors

When the sender's society and the recipient's society know each other (both appear in each other's `neighboring_society` table):

1. **Handle resolution** — Society A looks up `societyb` in `neighboring_society` to get the endpoint. The recipient handle `localpart@societyb` is resolved by querying Society B's handle lookup API directly. If the handle does not exist, the sender gets an immediate error and the message is not sent.

2. **Send** — Society A signs the message payload (sender handle, recipient handle, subject, body, thread context, timestamp, nonce) with its private key and delivers it directly to Society B's Mail API.

3. **Receipt** — Society B verifies the signature. If valid, it writes the message to the recipient's inbox and returns a signed delivery acknowledgement.

4. **Confirmation** — Society A marks the outbound message as `delivered` and shows confirmation to the sender.

### Non-Neighbors

When the recipient's society is not yet in Society A's `neighboring_society` table, Society A performs a **contact discovery** lookup before attempting delivery:

1. **Federation lookup** — Society A queries the Federation for the recipient society's contact details: endpoint, public key, and coordinates.
2. **Cache locally** — Society A writes the society to its `neighboring_society` table. Delivery then proceeds exactly as the [direct neighbor flow](#direct-neighbors).

If the Federation is unreachable, Society A may ask a known neighbor whether it has contact details for the recipient society. Peer-provided details are accepted provisionally and verified against the Federation when it is next reachable.

Once a society has been discovered, all future mail to that society is delivered directly — the Federation is not involved in delivery at any point.

---

## Authentication

Inter-society mail uses the same society keypair infrastructure as inter-society banking. Every message is signed by the sending society's private key. The receiving society verifies the signature against the cached public key before writing anything to its database.

An unverifiable signature is silently rejected — no error is returned to the remote society. The sender's app surfaces a delivery failure to the user after timeout.

This prevents:
- **Spoofing** — a society cannot send mail claiming to be from a different society
- **Content tampering** — altering the message payload in transit invalidates the signature
- **Replay attacks** — each payload includes a nonce; Society B rejects payloads whose nonce has already been seen

---

## Threading Across Society Boundaries

When Bob at Society B replies to a message from Alice at Society A, the reply needs a `thread_id`. Alice's original message UUID lives in Society A's database. Society B cannot reference it as a foreign key.

The solution: `thread_id` is treated as an **opaque cross-society identifier**. The convention is:

- When Alice sends the root message, she generates a `thread_id` (UUID) and includes it in the payload
- When Bob replies, he includes the same `thread_id` in his reply payload
- Both societies store this `thread_id` on their local message rows
- Threading is grouped by `thread_id` within each society's UI — the thread root may not be locally present on the receiving side, but all messages sharing the same `thread_id` are displayed together

No stub records are created for remote root messages. If a member at Society B tries to navigate to the root of a cross-society thread, the UI indicates the root is at another society.

---

## Delivery Receipts

The sender sees delivery receipts only — confirmation that the message arrived in the recipient's inbox. There are no read receipts. Whether the recipient has opened the message is private to them.

Delivery status values:
- `pending` — sent, waiting for acknowledgement from the remote society
- `delivered` — remote society confirmed receipt
- `failed` — remote society returned an error (invalid handle, suspended mailbox, etc.)
- `unreachable` — remote society could not be contacted after retry timeout

Delivery status is tracked per recipient in `message_recipient.delivery_status`, the same field used for all outbound federated messages.

---

## Pending and Retry

If Society B is offline when Society A sends a message:

- The message is stored with `delivery_status = pending`
- Society A retries on an exponential backoff schedule
- The sender sees "pending" in their Sent view
- If delivery does not succeed within a configurable timeout, `delivery_status` is set to `failed` and the sender is notified

Unlike banking, there is no hold or escrow — a pending message has no financial consequence. It is simply queued for delivery.

---

## Per-Society Block List

A society may block inbound mail from another society entirely. This is a local decision — it does not require Federation involvement or the blocked society's knowledge.

When a message arrives from a blocked society:
- It is not delivered to any mailbox
- A delivery failure is returned to the sending society (generic — the reason is not disclosed)
- The block is logged locally

Blocks are managed by Communications Service administrators. Individual members cannot block at the society level — they can only report messages.

---

## Abuse and Spam

Inter-society mail is authenticated at the society level but not content-filtered automatically. Abuse controls:

- **Society-level block** — Communications Service can block all inbound mail from a society (see above)
- **Member reports** — members can report individual messages; Communications Service reviews
- **Federation reporting** — Communications Service can report an abusive remote society to the Federation. The Federation may act on persistent abuse by revoking a society's federation membership

The Federation maintains an allow-list of registered societies. A society removed from the allow-list cannot deliver mail to or receive mail from any other society.

---

## Data Model Implications

Most of the required tables already exist (`message`, `message_recipient`). The inter-society flow requires:

### In `message_recipient` (already exists)
- `delivery_status` and `delivery_error` already present — no changes needed

### In `neighboring_society` (Governance — already planned)
- `public_key_cache` — needs to be added (shared with banking)

### New: `society_block_list` (Mail app)

| Column | Type | Description |
|---|---|---|
| `uuid` | TEXT | PRIMARY KEY |
| `society_handle` | TEXT | NOT NULL, UNIQUE — the blocked society |
| `blocked_by_uuid` | TEXT | NOT NULL — acting-as UUID of the administrator who set the block |
| `reason` | TEXT | NOT NULL |
| `created_at` | DATETIME | NOT NULL |
| `lifted_at` | DATETIME | NULL — set if the block is removed |

A block is active if `lifted_at IS NULL`. Lifting a block does not delete the row — the history is preserved.

### New: `inter_society_message_log` (Mail app)

A lightweight log of inbound inter-society delivery attempts, for audit and abuse review.

| Column | Type | Description |
|---|---|---|
| `uuid` | TEXT | PRIMARY KEY |
| `remote_society_handle` | TEXT | NOT NULL |
| `message_uuid` | TEXT | NULL — FK → `message.uuid` if delivered; NULL if blocked or rejected |
| `outcome` | TEXT | NOT NULL — `delivered`, `blocked`, `rejected` (invalid signature or unknown handle) |
| `received_at` | DATETIME | NOT NULL |

---

## Security Properties

- **Society-level authentication** — every inbound message is verified against the sending society's registered public key. Unsigned or unverifiable messages are dropped.
- **No content storage at the Federation** — messages are never persisted outside the two endpoint societies. The Federation cannot be compelled to produce message content.
- **Nonce replay protection** — duplicate delivery attempts are detected and dropped.
- **Sender identity is society-attested** — Society A asserts that the sender is a valid principal in its system. It cannot assert anything about principals at other societies. Recipient societies trust the sending society's attestation, not any global identity claim.
- **No read receipts** — recipients' reading behavior is not disclosed to senders or any other party.
