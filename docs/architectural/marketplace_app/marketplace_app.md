# The Ben Franklin Society
## Marketplace App
### Technical Design Document

---

## Overview

The Marketplace app is the society's virtual marketplace — the platform through which members offer goods and skilled services, find what they need, and transact in Franks. It extends the community's commercial life beyond the limits of who can attend in person.

The app has three distinct parts:

1. **Classifieds** — discrete goods listed for sale or free. Listings remain active until sold, expired, or withdrawn by the seller.
2. **Services directory** — ongoing offerings of skilled labor and professional services (plumbing, tutoring, carpentry, etc.). No quantity; listings remain active until the provider withdraws them.
3. **Physical marketplaces** — named community market locations with recurring sessions and vendor stalls. *Design deferred.*

It is an OIDC relying party: all authentication is delegated to the Governance app. Seller identity, buyer identity, and all principal references use UUIDs and handles from Governance. Frank transactions settle through the Community Bank.

The Marketplace app is administered by the **Commerce Service**. A standing Assembly committee handles moderation; Commerce Service members with elevated roles handle platform administration.

---

## Principals and Identity

Any principal — member or association — may be a seller. Listings are published under the `acting_as` principal from the OIDC session. A member acting as a Service association publishes listings on behalf of that Service; a member acting as themselves publishes personal listings.

The seller's handle (`acting_as` handle) is the public identity displayed on listings. All internal references use the `acting_as` UUID. If a seller's handle changes, listings display the updated handle; the listing records themselves are keyed by UUID and are unaffected.

---

## Classifieds

Discrete goods offered for sale or free. Listings remain active until the seller marks them sold, they expire, or they are withdrawn.

### Classified Listing Record

| Field | Description |
|---|---|
| `id` | UUID |
| `seller_uuid` | The `acting_as` UUID at time of creation |
| `title` | Short title |
| `description` | Full description (Markdown rendered in UI) |
| `category` | Category tag — flat taxonomy maintained in app config |
| `price` | Price in Franks (positive integer), or `0` for free |
| `price_negotiable` | Boolean — whether price is a starting point for negotiation |
| `status` | `active`, `withdrawn`, `removed` |
| `scope` | `local` (this society only) or `federated` (visible across clearinghouse) |
| `expires_at` | Optional expiry; listing auto-withdraws after this date |
| `society_handle` | The seller's society — used for display and federation routing |
| `created_at` | Timestamp |

Categories cover the domain of physical goods: produce, crafts, tools, clothing, household, and similar. They are not hard-coded — the set can be updated in app config without a schema change.

---

## Services Directory

Ongoing offerings of skilled labor and professional services. A service listing has no quantity and no expiry — it remains active until the provider withdraws it. It is a standing advertisement of availability, not a one-time offer.

### Service Listing Record

| Field | Description |
|---|---|
| `id` | UUID |
| `provider_uuid` | The `acting_as` UUID at time of creation |
| `title` | Short title — e.g. "Licensed Plumber" |
| `description` | Full description of services offered (Markdown) |
| `category` | Category tag — flat taxonomy maintained in app config |
| `rate` | Rate in Franks, or `0` for negotiable |
| `rate_unit` | `per_hour`, `per_job`, `negotiable` |
| `service_area` | Free text — geographic or community scope of availability |
| `status` | `active`, `withdrawn`, `removed` |
| `scope` | `local` or `federated` |
| `society_handle` | The provider's society |
| `created_at` | Timestamp |

Service categories cover skilled labor and professional domains: trades, care, transport, instruction, legal, and similar.

There is no purchase flow for service listings — they are a directory. Members contact the provider via the Mail app to arrange work and agree on payment, then settle through the Community Bank directly.

### Authorization

A listing of either type may only be created, edited, or withdrawn by a session whose `acting_as` UUID matches the `seller_uuid` / `provider_uuid`. Administrators may additionally withdraw or remove any listing.

`removed` status is reserved for moderation actions. Sellers and providers use `withdrawn` for voluntary removal. This preserves a clear audit trail for moderation.

---

## Transactions

There is no automated purchase flow. For both classifieds and service listings, interested members contact the seller or provider via the Mail app to arrange the exchange and agree on payment. Settlement is handled directly through the Community Bank. The Marketplace app is not involved in payment.

---

## Physical Marketplaces

A physical marketplace is a named community location where regular market sessions are held. The Commerce Service creates and manages marketplaces, sessions, and stalls. Stall assignments are made per session — the Commerce Service assigns a person or association to a stall for a given session. There are no stall fees at this time.

### Marketplaces

A marketplace is a named location. It has a description and a default schedule (free text — e.g. "every Saturday 8am–1pm"). The Commerce Service creates marketplaces.

### Sessions

A session is a specific occurrence of a marketplace on a specific date. Sessions are created by the Commerce Service, either manually or by generating them from the marketplace's schedule. A session has a start and end time and a status (`scheduled`, `active`, `completed`, `cancelled`).

### Stalls

A stall is a named physical space at a marketplace — e.g. `Stall 4`, `Corner Table`, `East Row A`. Stalls are created by the Commerce Service and belong to a marketplace. They persist across sessions.

### Stall Assignments

A stall assignment links a stall to a session and assigns it to a principal (person or association). One assignment per stall per session. The Commerce Service manages all assignments. There is no self-service stall booking.

---

## Federation

Listings marked `scope: federated` are shared with the clearinghouse and become visible to members of other societies. Intra-society listings (`scope: local`) are never transmitted to the clearinghouse.

### Outbound (publishing to the clearinghouse)

When a seller creates or updates a federated listing, the Marketplace app pushes the listing record to the clearinghouse. The clearinghouse distributes it to other registered societies' Marketplace apps.

### Inbound (receiving from the clearinghouse)

The app receives federated listings from the clearinghouse and stores them locally as read-only `federated_listing` records — separate from local listings in the data model. Members can browse and search federated listings alongside local ones.

### Cross-Society Transactions

When a buyer purchases a federated listing from another society's seller, the transaction must cross societies. The flow:

1. Buyer initiates purchase in their society's Marketplace app
2. The app routes the transfer request through the clearinghouse to the seller's society
3. The seller's society's Community Bank executes the Frank credit to the seller
4. The buyer's Community Bank executes the Frank debit from the buyer
5. Frank settlement between societies runs through the clearinghouse inter-society settlement mechanism

Cross-society Frank settlement is a clearinghouse responsibility, not a Marketplace responsibility. The Marketplace app only needs to communicate the intent; the clearinghouse and Community Banks handle the money.

---

## Search and Browse

Members can:

- Browse listings by category
- Search listings by keyword (title and description)
- Filter by price range, negotiable, and scope (local / federated / all)
- View listings by a specific seller

Search is handled in-app against the local database (local + cached federated listings). No external search index is required at community scale.

---

## Moderation and Administration

The standing Assembly committee and Commerce Service administrators share moderation responsibility.

Administrators may:
- Remove any listing (sets status to `removed`, logs reason and administrator UUID)
- Suspend a seller's ability to list
- Review member-submitted reports

Members may report any listing using an in-UI action. Reports are queued for moderation review. The reporting member is not identified to the seller.

All moderation actions are logged with the administrator's UUID, timestamp, and a required reason memo.

---

## Event Subscriptions

| Event | Action taken |
|---|---|
| `member.created` | No action required — sellers need no pre-provisioning |
| `member.revoked` | Withdraw all active listings by the revoked principal; suspend sell access |
