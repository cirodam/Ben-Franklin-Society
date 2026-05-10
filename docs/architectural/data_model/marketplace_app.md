# The Ben Franklin Society
## Data Model — Marketplace App

---

## `classified_listing`

A discrete good offered for sale or free.

| Column | Type | Constraints | Description |
|---|---|---|---|
| `uuid` | TEXT | PRIMARY KEY | |
| `seller_uuid` | TEXT | NOT NULL | The `acting_as` UUID at time of creation. Not a FK — Marketplace has no copy of person/association tables |
| `seller_handle_cache` | TEXT | NOT NULL | Cached for display |
| `seller_society_handle` | TEXT | NOT NULL | The seller's society handle |
| `title` | TEXT | NOT NULL | |
| `description` | TEXT | NOT NULL | (Markdown) |
| `category` | TEXT | NOT NULL | Tag from app-configured taxonomy |
| `price` | INTEGER | NOT NULL | Price in Franks. 0 = free |
| `price_negotiable` | INTEGER | NOT NULL, DEFAULT 0 | Boolean |
| `scope` | TEXT | NOT NULL, DEFAULT `local` | `local`, `federated` |
| `status` | TEXT | NOT NULL, DEFAULT `active` | `active`, `withdrawn`, `removed` |
| `expires_at` | DATETIME | NULL | Auto-withdraws after this date if still active |
| `created_at` | DATETIME | NOT NULL | |

### Notes

- `status = removed` is set only by administrators. Sellers use `withdrawn`.
- Federated listings received from other societies are stored in a separate `federated_classified_listing` read-only table — they are not rows in this table.

---

## `service_listing`

An ongoing offering of skilled labor or professional services. No quantity; remains active until withdrawn.

| Column | Type | Constraints | Description |
|---|---|---|---|
| `uuid` | TEXT | PRIMARY KEY | |
| `provider_uuid` | TEXT | NOT NULL | The `acting_as` UUID at time of creation. Not a FK |
| `provider_handle_cache` | TEXT | NOT NULL | Cached for display |
| `provider_society_handle` | TEXT | NOT NULL | The provider's society handle |
| `title` | TEXT | NOT NULL | e.g. `Licensed Plumber` |
| `description` | TEXT | NOT NULL | (Markdown) |
| `category` | TEXT | NOT NULL | Tag from app-configured taxonomy |
| `rate` | INTEGER | NOT NULL | Rate in Franks. 0 = negotiable |
| `rate_unit` | TEXT | NOT NULL | `per_hour`, `per_job`, `negotiable` |
| `service_area` | TEXT | NULL | Free text — geographic or community scope |
| `scope` | TEXT | NOT NULL, DEFAULT `local` | `local`, `federated` |
| `status` | TEXT | NOT NULL, DEFAULT `active` | `active`, `withdrawn`, `removed` |
| `created_at` | DATETIME | NOT NULL | |

### Notes

- No purchase flow. Members contact the provider via Mail and settle through the Community Bank directly.
- No `sold` status — service listings don't close on transaction.
- `status = removed` is set only by administrators. Providers use `withdrawn`.

---

## `physical_marketplace`

A named community market location. Created and managed by the Commerce Service.

| Column | Type | Constraints | Description |
|---|---|---|---|
| `uuid` | TEXT | PRIMARY KEY | |
| `name` | TEXT | NOT NULL | e.g. `Franklin County Saturday Market` |
| `description` | TEXT | NULL | (Markdown) |
| `location` | TEXT | NOT NULL | Free text — address or description |
| `default_schedule` | TEXT | NULL | Free text — e.g. `Every Saturday 8am–1pm` |
| `status` | TEXT | NOT NULL, DEFAULT `active` | `active`, `closed` |
| `created_at` | DATETIME | NOT NULL | |

---

## `market_session`

A specific occurrence of a physical marketplace. Created by the Commerce Service.

| Column | Type | Constraints | Description |
|---|---|---|---|
| `uuid` | TEXT | PRIMARY KEY | |
| `marketplace_uuid` | TEXT | NOT NULL, FK → `physical_marketplace.uuid` | |
| `starts_at` | DATETIME | NOT NULL | |
| `ends_at` | DATETIME | NOT NULL | |
| `notes` | TEXT | NULL | Any session-specific notes |
| `status` | TEXT | NOT NULL, DEFAULT `scheduled` | `scheduled`, `active`, `completed`, `cancelled` |
| `created_at` | DATETIME | NOT NULL | |

---

## `stall`

A named physical space at a marketplace. Persists across sessions. Created by the Commerce Service.

| Column | Type | Constraints | Description |
|---|---|---|---|
| `uuid` | TEXT | PRIMARY KEY | |
| `marketplace_uuid` | TEXT | NOT NULL, FK → `physical_marketplace.uuid` | |
| `name` | TEXT | NOT NULL | e.g. `Stall 4`, `Corner Table`, `East Row A` |
| `description` | TEXT | NULL | |
| `status` | TEXT | NOT NULL, DEFAULT `active` | `active`, `retired` |
| `created_at` | DATETIME | NOT NULL | |

Unique constraint: `(marketplace_uuid, name)`

---

## `stall_assignment`

Assigns a stall to a principal for a specific session. One assignment per stall per session.

| Column | Type | Constraints | Description |
|---|---|---|---|
| `uuid` | TEXT | PRIMARY KEY | |
| `stall_uuid` | TEXT | NOT NULL, FK → `stall.uuid` | |
| `session_uuid` | TEXT | NOT NULL, FK → `market_session.uuid` | |
| `assignee_uuid` | TEXT | NOT NULL | Principal UUID of the assigned person or association. Not a FK |
| `assignee_handle_cache` | TEXT | NOT NULL | Cached for display |
| `notes` | TEXT | NULL | |
| `created_at` | DATETIME | NOT NULL | |

Unique constraint: `(stall_uuid, session_uuid)`

### Notes

- One assignment per stall per session — a stall cannot be double-booked.
- Assignments are managed entirely by the Commerce Service. There is no self-service booking.
- There are no stall fees at this time.

---

## `listing_report`

A report submitted by a member against a classified or service listing.

| Column | Type | Constraints | Description |
|---|---|---|---|
| `uuid` | TEXT | PRIMARY KEY | |
| `listing_uuid` | TEXT | NOT NULL | UUID of the reported listing. Not a FK — may be either listing type |
| `listing_type` | TEXT | NOT NULL | `classified`, `service` |
| `reporter_uuid` | TEXT | NOT NULL | Principal UUID of the reporting member. Not a FK |
| `reason` | TEXT | NOT NULL | Free text — the reporter's stated reason |
| `status` | TEXT | NOT NULL, DEFAULT `pending` | `pending`, `reviewed`, `dismissed` |
| `created_at` | DATETIME | NOT NULL | |
| `reviewed_at` | DATETIME | NULL | |
| `reviewed_by_uuid` | TEXT | NULL | Acting-as UUID of the administrator who reviewed it |

### Notes

- The reporter's identity is never shown to the seller. It is visible only to administrators.
- A report does not automatically change the listing's status. The administrator reviews the report and takes action via a separate moderation action (recorded in `moderation_log`).
- Multiple reports may exist for the same listing.

---

## `moderation_log`

Immutable record of every administrative action taken in the Marketplace app.

| Column | Type | Constraints | Description |
|---|---|---|---|
| `uuid` | TEXT | PRIMARY KEY | |
| `action` | TEXT | NOT NULL | `remove_listing`, `reinstate_listing`, `suspend_seller`, `reinstate_seller` |
| `target_uuid` | TEXT | NOT NULL | UUID of the affected listing or principal |
| `target_type` | TEXT | NOT NULL | `classified_listing`, `service_listing`, `seller` |
| `actor_uuid` | TEXT | NOT NULL | Acting-as UUID of the administrator. Not a FK |
| `reason` | TEXT | NOT NULL | Required — the administrator's stated reason |
| `report_uuid` | TEXT | NULL, FK → `listing_report.uuid` | The report this action responds to, if any |
| `created_at` | DATETIME | NOT NULL | |

### Notes

- Rows are never deleted.
- `reason` is required with no minimum length enforced at the DB layer, but required at the application layer before the action can be saved.
- An action need not be in response to a report — administrators may act without a prior report (`report_uuid` is NULL in that case).
