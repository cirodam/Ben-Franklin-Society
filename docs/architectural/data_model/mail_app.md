# The Ben Franklin Society
## Data Model — Mail App

---

## `mailbox`

One per principal. Provisioned automatically on `member.created` or `association.created`.

| Column | Type | Constraints | Description |
|---|---|---|---|
| `principal_uuid` | TEXT | PRIMARY KEY | UUID of the owning principal. Not a FK — Mail app has no copy of person/association tables |
| `handle_cache` | TEXT | NOT NULL | Principal's full handle, cached for display |
| `status` | TEXT | NOT NULL, DEFAULT `active` | `active`, `suspended` |
| `created_at` | DATETIME | NOT NULL | |

---

## `message`

A single message. Both intra-society and inter-society messages are stored here — inter-society received messages are written by the clearinghouse delivery handler.

| Column | Type | Constraints | Description |
|---|---|---|---|
| `uuid` | TEXT | PRIMARY KEY | |
| `from_principal_uuid` | TEXT | NOT NULL | Sender's principal UUID. Not a FK — sender may be on a remote society |
| `from_handle_cache` | TEXT | NOT NULL | Sender's full handle (`localpart@societyhandle`), cached for display |
| `subject` | TEXT | NOT NULL | |
| `body` | TEXT | NOT NULL | (Markdown) |
| `thread_id` | TEXT | NOT NULL, FK → `message.uuid` | UUID of the root message in this thread. Equal to `uuid` if this is the root |
| `reply_to_id` | TEXT | NULL, FK → `message.uuid` | The specific message being replied to. NULL if this is the thread root |
| `origin` | TEXT | NOT NULL | `local` — sent within this society; `federated` — received from another society via clearinghouse |
| `status` | TEXT | NOT NULL, DEFAULT `draft` | `draft`, `sent` |
| `created_at` | DATETIME | NOT NULL | |
| `sent_at` | DATETIME | NULL | |

### Notes

- `from_principal_uuid` is not a FK. For local senders it matches a `person.uuid` or `association.uuid` in Governance; for federated senders it is a UUID on a remote society's system.
- The app enforces that `from_principal_uuid` matches the session's `acting_as` UUID at send time. This is the only anti-spoofing check — it is an application-layer rule, not a DB constraint.

---

## `message_recipient`

One row per recipient per message. Carries all per-recipient state — read status, trash. Also tracks inter-society delivery status for outbound federated messages.

| Column | Type | Constraints | Description |
|---|---|---|---|
| `uuid` | TEXT | PRIMARY KEY | |
| `message_uuid` | TEXT | NOT NULL, FK → `message.uuid` | |
| `recipient_principal_uuid` | TEXT | NOT NULL | Recipient's principal UUID. Not a FK — recipient may be on a remote society |
| `recipient_handle_cache` | TEXT | NOT NULL | Recipient's full handle, cached for display |
| `recipient_society_handle` | TEXT | NULL | Set for inter-society recipients; NULL for local recipients |
| `type` | TEXT | NOT NULL | `to`, `cc` |
| `read_at` | DATETIME | NULL | NULL if unread |
| `trashed_at` | DATETIME | NULL | NULL if not in trash |
| `delivery_status` | TEXT | NULL | NULL for local (always immediate); `pending`, `delivered`, `failed` for inter-society outbound |
| `delivery_error` | TEXT | NULL | Set if `delivery_status = failed`, for diagnostic display to sender |

Unique constraint: `(message_uuid, recipient_principal_uuid)`

### Notes

- **Inbox query**: `recipient_principal_uuid = ? AND trashed_at IS NULL AND message.status = 'sent'`
- **Trash query**: `recipient_principal_uuid = ? AND trashed_at IS NOT NULL`
- **Sent query**: `message.from_principal_uuid = ? AND message.status = 'sent'`
- **Drafts query**: `message.from_principal_uuid = ? AND message.status = 'draft'`
- For inbound federated messages, `delivery_status` is NULL — delivery already occurred before the row was written locally.

---

## `message_report`

A report submitted by a member against a message they received.

| Column | Type | Constraints | Description |
|---|---|---|---|
| `uuid` | TEXT | PRIMARY KEY | |
| `message_uuid` | TEXT | NOT NULL, FK → `message.uuid` | |
| `reporter_uuid` | TEXT | NOT NULL | Principal UUID of the reporting member. Not a FK |
| `reason` | TEXT | NOT NULL | Free text — the reporter's stated reason |
| `status` | TEXT | NOT NULL, DEFAULT `pending` | `pending`, `reviewed`, `dismissed` |
| `created_at` | DATETIME | NOT NULL | |
| `reviewed_at` | DATETIME | NULL | |
| `reviewed_by_uuid` | TEXT | NULL | Acting-as UUID of the administrator who reviewed it |

### Notes

- The reporter's identity is never shown to the sender. It is visible only to administrators.
- A report does not automatically affect the message. The administrator reviews and acts via a separate moderation action (recorded in `moderation_log`).

---

## `moderation_log`

Immutable record of every administrative action taken in the Mail app.

| Column | Type | Constraints | Description |
|---|---|---|---|
| `uuid` | TEXT | PRIMARY KEY | |
| `action` | TEXT | NOT NULL | `delete_message`, `suspend_mailbox`, `reinstate_mailbox` |
| `target_uuid` | TEXT | NOT NULL | UUID of the affected message or principal |
| `target_type` | TEXT | NOT NULL | `message`, `mailbox` |
| `actor_uuid` | TEXT | NOT NULL | Acting-as UUID of the administrator. Not a FK |
| `reason` | TEXT | NOT NULL | Required — the administrator's stated reason |
| `report_uuid` | TEXT | NULL, FK → `message_report.uuid` | The report this action responds to, if any |
| `created_at` | DATETIME | NOT NULL | |

### Notes

- Rows are never deleted.
- `reason` is required at the application layer before the action can be saved.
- An action need not be in response to a report — administrators may act without a prior report (`report_uuid` is NULL in that case).
