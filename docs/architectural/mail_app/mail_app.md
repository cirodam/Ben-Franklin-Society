# The Ben Franklin Society
## Mail App
### Technical Design Document

---

## Overview

The Mail app is the society's internal messaging system. It provides member-to-member and member-to-association messaging within a society, and routes messages to members of other societies through the clearinghouse federation.

It is an OIDC relying party: all authentication is delegated to the Governance app. The app has no user registry of its own — all principals are identified by their UUIDs and handles as issued by Governance.

The Mail app is administered by the **Communications Service**. Members of that Service holding elevated roles handle moderation and account administration.

---

## Addressing

Mail addresses are handles: `localpart@societyhandle`. This is the same handle used everywhere in the system — mail addressing is not a separate namespace.

- **Intra-society mail** — sender and recipient share the same `societyhandle`. Delivered entirely within the local app; the clearinghouse is not involved.
- **Inter-society mail** — recipient is at a different society. The sending app routes the message through the clearinghouse, which delivers it to the recipient society's Mail app.

Both members and associations have mail addresses. A message addressed to an association lands in that association's mailbox. Members with `act-as` permission on the association can read and send from it.

---

## Mailboxes

Every principal — member or association — has exactly one mailbox. Mailboxes are provisioned automatically when Governance fires a `member.created` or `association.created` event, before the principal ever logs in.

A member may access their own mailbox, and the mailbox of any association they hold `act-as` permission on. The active context from the OIDC session (`acting_as`) determines which mailbox is in scope for the current session.

### Mailbox Structure

Each mailbox contains:

- **Inbox** — received messages
- **Sent** — messages sent from this principal
- **Drafts** — unsent drafts
- **Trash** — deleted messages, retained briefly before permanent removal

There are no user-created folders in the initial version. Threading is supported — replies are grouped with their original message.

---

## Messages

### Message Record

| Field | Description |
|---|---|
| `id` | UUID |
| `from_uuid` | Sender principal UUID |
| `to_uuids` | Array of recipient principal UUIDs |
| `cc_uuids` | Array of CC recipient UUIDs (optional) |
| `subject` | Subject line |
| `body` | Message body (plain text; Markdown rendered in UI) |
| `thread_id` | UUID of the root message in this thread |
| `reply_to_id` | UUID of the specific message being replied to |
| `status` | `draft`, `sent` |
| `created_at` | Timestamp |
| `sent_at` | Timestamp (null if draft) |

### Authorization

A message may only be sent from the principal matching the session's `acting_as` UUID. The app rejects any send where `from_uuid` does not match `acting_as`. This prevents spoofing — you cannot send mail as a principal you are not currently acting as, even if you have other permissions on that principal.

### Delivery

For intra-society messages, delivery is synchronous with send — the message record is written and immediately appears in the recipient's inbox.

For inter-society messages, the message is handed to the clearinghouse for routing. Delivery status (`pending`, `delivered`, `failed`) is tracked and visible to the sender.

---

## Inter-Society Federation

Inter-society mail uses the same peer-to-peer trust infrastructure as inter-society banking. Neighboring societies deliver messages directly to each other using signed payloads verified against cached public keys. Non-neighbors route through the clearinghouse, which acts as a router only — it never stores message content.

See [inter_society_mail.md](../inter_society_mail.md) for the full design: delivery flow, threading across society boundaries, retry behavior, the per-society block list, and security properties.

---

## Governance Notifications

The Governance app delivers automated notifications to member mailboxes for governance events:

| Event | Notification sent to |
|---|---|
| New motion introduced | All members |
| Motion enters deliberation | All members |
| Motion enters vote | All members |
| Motion enacted / rejected | All members |
| Member added to association | The member |
| Member assigned a role | The member |
| Sortition draw completed | Drawn members |

These notifications are sent as system messages from a reserved system sender address. They are one-way — replies go nowhere — and are clearly labelled as automated.

---

## Moderation and Administration

The Communications Service administers the app. Members of that Service holding elevated roles may:

- View any mailbox (with audit trail)
- Delete messages that violate community standards
- Suspend a principal's ability to send mail
- Review and act on member-submitted reports

All administrative actions are logged with the administrator's UUID, timestamp, and a required memo.

Members may report a message using an in-UI action. Reports are queued for Communications Service review. The reporting member is not identified to the sender.

---

## Event Subscriptions

| Event | Action taken |
|---|---|
| `member.created` | Provision mailbox for member |
| `association.created` | Provision mailbox for association |
| `member.revoked` | Suspend mailbox (no new sends or receives) |
