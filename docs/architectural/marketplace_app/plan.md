# The Ben Franklin Society
## Marketplace App — Build Plan

Mirrors the structure of the mail-app plan. Each phase is a vertical slice: complete and type-checks clean before starting the next.

**Tech stack** (same across all BFS apps):
- SvelteKit 2 + Svelte 5 (runes), TypeScript strict, `moduleResolution: bundler`
- SQLite via `better-sqlite3` v11+, WAL mode, FK ON
- pnpm workspaces + Turborepo
- Auth: `bfs_session` cookie → Governance DB → `locals.session`
- Dev server: `pnpm exec vite dev` from `apps/marketplace`

**App identifier** (for `role_permission.app`): `'marketplace'`

**Permission names**:
- `administrator` — Commerce Service members who can moderate listings and manage physical marketplaces

---

## Phase 1 — Foundation

**Goal**: Bare app skeleton with schema, DB, auth, layout shell, and seed.

- [x] `src/lib/server/schema.ts` — already present in template; verify all tables: `classified_listing`, `service_listing`, `physical_marketplace`, `market_session`, `stall`, `stall_assignment`, `listing_report`, `moderation_log`, `seller_suspension`, `outbox`
- [x] `src/lib/server/db.ts` — open `marketplace.sqlite` + `govDb` (governance, read-only); run schema
- [x] `src/lib/server/session.ts` — `resolveSession(token)` → `MarketplaceSession | null`; SHA-256 cookie → `session` table in govDb; same pattern as mail app
- [x] `src/lib/server/permissions.ts` — `hasMarketplacePermission(person_uuid, permission)` querying govDb; `PERMISSIONS = { ADMINISTRATOR: 'administrator' }`
- [x] `src/lib/server/categories.ts` — configurable taxonomy constants: `CLASSIFIED_CATEGORIES` (produce, crafts, tools, clothing, household, …) and `SERVICE_CATEGORIES` (trades, care, transport, instruction, legal, …); exported as `string[]`
- [x] `src/hooks.server.ts` — resolve session from `bfs_session` cookie; set `locals.session`; delete stale cookie if resolution fails
- [x] `src/app.d.ts` — `App.Locals { session: MarketplaceSession | null }`
- [x] `src/routes/+layout.server.ts` — redirect unauthenticated requests to `${GOVERNANCE_URL}/login`; pass `session`, `isAdministrator` to layout
- [x] `src/routes/+layout.svelte` — sidebar shell: Browse, Classifieds, Services, My Listings, Sell; Administrator link if `isAdministrator`; footer with `@{handle}`
- [x] `scripts/seed.ts` — open govDb + marketplaceDb, run schema; no mailbox-equivalent needed (no pre-provisioning); idempotent
- [x] `scripts/reset.sh` — `rm -f marketplace.sqlite && pnpm seed`
- [x] `package.json` scripts: `dev`, `build`, `check`, `seed`, `reset`
- [x] Type-check: `svelte-kit sync && tsc --noEmit`

---

## Phase 2 — Browse & Listings

**Goal**: Members can browse, search, and view classified and service listings.

- [x] `src/lib/server/listings.ts` — read-only query functions:
  - `ClassifiedListing`, `ServiceListing` interfaces
  - `getClassifieds(opts: { category?, keyword?, minPrice?, maxPrice?, negotiable?, scope?, page? })` — active listings, paginated; keyword matches title + description
  - `getServices(opts: { category?, keyword?, scope?, page? })` — active service listings, paginated
  - `getClassified(uuid)` — single listing or null
  - `getService(uuid)` — single listing or null
  - `getMyClassifieds(seller_uuid)` — all own listings, all statuses
  - `getMyServices(provider_uuid)` — all own listings, all statuses
  - `getListingsByPrincipal(principal_uuid)` — active classifieds + services for a given seller (public profile)
- [x] `src/routes/+page.server.ts` + `+page.svelte` — landing page: recent classifieds, recent services, search bar, links to browse pages
- [x] `src/routes/classifieds/+page.server.ts` + `+page.svelte` — browse classifieds: filter sidebar (category, price range, negotiable, scope); paginated results
- [x] `src/routes/classifieds/[uuid]/+page.server.ts` + `+page.svelte` — classified detail: title, description (Markdown rendered), price, seller handle, created date, expires_at; seller's other active listings; contact via Mail link
- [x] `src/routes/services/+page.server.ts` + `+page.svelte` — browse services: filter sidebar (category, scope); paginated results
- [x] `src/routes/services/[uuid]/+page.server.ts` + `+page.svelte` — service detail: title, description, rate, rate_unit, service_area, provider handle; contact via Mail link
- [x] `src/routes/my-listings/+page.server.ts` + `+page.svelte` — tabbed view: My Classifieds + My Services; all statuses with status badge; links to edit/withdraw
- [x] Type-check: `svelte-kit sync && tsc --noEmit`

---

## Phase 3 — Create & Manage Listings

**Goal**: Members can create, edit, and withdraw their own listings.

- [x] Add to `src/lib/server/listings.ts`:
  - `checkSellerSuspension(principal_uuid)` → `boolean` — query `seller_suspension` where `lifted_at IS NULL`
  - `createClassified(opts)` — insert row; `status = 'active'`; reject if seller is suspended
  - `updateClassified(uuid, seller_uuid, opts)` — update own active/withdrawn listing; only owner may edit; `removed` listings cannot be edited
  - `withdrawClassified(uuid, seller_uuid)` — set `status = 'withdrawn'`; only owner
  - `createService(opts)` — insert row; reject if seller is suspended
  - `updateService(uuid, provider_uuid, opts)` — update own listing
  - `withdrawService(uuid, provider_uuid)` — set `status = 'withdrawn'`
- [x] `src/routes/sell/classified/+page.server.ts` + `+page.svelte` — create classified form: title, description, category (select from `CLASSIFIED_CATEGORIES`), price, price_negotiable, expires_at (optional), scope; `create` action calls `createClassified`; redirect to listing on success
- [x] `src/routes/sell/classified/[uuid]/edit/+page.server.ts` + `+page.svelte` — edit classified; load: verify ownership, 403 otherwise; `update` action; `withdraw` action; redirect to my-listings on withdraw
- [x] `src/routes/sell/service/+page.server.ts` + `+page.svelte` — create service form: title, description, category (select from `SERVICE_CATEGORIES`), rate, rate_unit, service_area, scope; `create` action
- [x] `src/routes/sell/service/[uuid]/edit/+page.server.ts` + `+page.svelte` — edit service; ownership check; `update` + `withdraw` actions
- [x] Seller suspended: if `checkSellerSuspension` returns true, `load` on sell pages returns `{ suspended: true }` and the Svelte page shows an inert suspension notice instead of the form
- [x] Type-check: `svelte-kit sync && tsc --noEmit`

---

## Phase 4 — Reports & Moderation

**Goal**: Members can report listings; administrators can review reports, remove listings, and suspend sellers.

- [x] `src/lib/server/moderation.ts`:
  - `insertReport(listing_uuid, listing_type, reporter_uuid, reason)` — insert `listing_report`; block duplicate (one open report per reporter per listing)
  - `getPendingReports()` — join with listing for subject/seller display
  - `getReport(uuid)` — full report with listing title, description, seller handle
  - `dismissReport(uuid, actor_uuid, reason)` — set `status = 'reviewed'`, write `moderation_log`
  - `removeListing(listing_uuid, listing_type, actor_uuid, reason, report_uuid?)` — set `status = 'removed'`; resolve report if given; write `moderation_log`
  - `reinstateListing(listing_uuid, listing_type, actor_uuid, reason)` — set `status = 'active'`; write `moderation_log`
  - `suspendSeller(principal_uuid, actor_uuid, reason, report_uuid?)` — insert `seller_suspension`; resolve report if given; write `moderation_log`
  - `reinstateSeller(principal_uuid, actor_uuid, reason)` — set `lifted_at`; write `moderation_log`
  - `getAllSellers(opts: { q? })` — query distinct sellers from both listing tables + suspension status
- [x] Report action on listing detail pages (classifieds + services): inline report form with reason textarea; confirmation pattern; cannot report own listing
- [x] `src/routes/administrator/+layout.server.ts` — gate on `hasMarketplacePermission(person_uuid, PERMISSIONS.ADMINISTRATOR)`; error 403 if not
- [x] `src/routes/administrator/+layout.svelte` — administrator shell; nav: Reports, Sellers
- [x] `src/routes/administrator/+page.server.ts` + `+page.svelte` — pending reports list; each row: listing title, listing type, "A member", date; link to review page
- [x] `src/routes/administrator/reports/[uuid]/+page.server.ts` + `+page.svelte` — full listing + reporter reason; actions: Dismiss, Remove Listing, Suspend Seller; all require reason; confirmation pattern
- [x] `src/routes/administrator/sellers/+page.server.ts` + `+page.svelte` — seller list with search by handle; suspension status badge; inline suspend/reinstate with reason
- [x] Type-check: `svelte-kit sync && tsc --noEmit`

---

## Phase 5 — Physical Marketplaces

**Goal**: Commerce Service administrators can manage physical marketplaces, sessions, stalls, and stall assignments. Members can browse upcoming sessions.

- [ ] `src/lib/server/physical.ts`:
  - `PhysicalMarketplace`, `MarketSession`, `Stall`, `StallAssignment` interfaces
  - `getAllMarketplaces()` — list active marketplaces
  - `getMarketplace(uuid)` — single marketplace with upcoming sessions
  - `createMarketplace(opts)` — admin-only; insert
  - `updateMarketplace(uuid, opts)` — admin-only
  - `closeMarketplace(uuid)` — set status = 'closed'
  - `getSession(uuid)` — session with stall assignments
  - `getUpcomingSessions(marketplace_uuid)` — sessions with `starts_at > now`, ordered asc
  - `createSession(opts)` — admin-only
  - `updateSession(uuid, opts)` — admin-only
  - `cancelSession(uuid)` — set status = 'cancelled'
  - `getStalls(marketplace_uuid)` — all stalls for a marketplace
  - `createStall(opts)` — admin-only
  - `retireStall(uuid)` — set status = 'retired'
  - `assignStall(stall_uuid, session_uuid, assignee_uuid, assignee_handle_cache, notes?)` — insert; enforce `UNIQUE(stall_uuid, session_uuid)`
  - `removeAssignment(uuid)` — admin-only; delete assignment row
- [ ] `src/routes/markets/+page.server.ts` + `+page.svelte` — list all active physical marketplaces with upcoming session dates
- [ ] `src/routes/markets/[uuid]/+page.server.ts` + `+page.svelte` — marketplace detail: description, location, schedule, list of upcoming sessions with dates
- [ ] `src/routes/markets/[uuid]/sessions/[session_uuid]/+page.server.ts` + `+page.svelte` — session detail: date/time, status badge, stall assignment table (stall name → assigned handle)
- [ ] `src/routes/administrator/markets/+page.server.ts` + `+page.svelte` — list all marketplaces; Create Marketplace form; link to per-marketplace admin
- [ ] `src/routes/administrator/markets/[uuid]/+page.server.ts` + `+page.svelte` — marketplace admin: edit details, create sessions, manage stalls; session list with assign-stalls links
- [ ] `src/routes/administrator/markets/[uuid]/sessions/[session_uuid]/+page.server.ts` + `+page.svelte` — session admin: status control (cancel), stall assignment table with assign/remove actions per stall; handle lookup for assignee
- [ ] Sidebar: add Markets nav link (public); Administrator nav gains Markets sub-link
- [ ] Type-check: `svelte-kit sync && tsc --noEmit`

---

## Phase 6 — Federation *(deferred)*

**Goal**: Federated listings are published to and received from the clearinghouse; visible alongside local listings.

Defer until Phases 1–5 are solid and inter-society clearinghouse infrastructure is operational.

- [ ] Outbound: on create/update of `scope = 'federated'` listing, push signed payload to clearinghouse via outbox
- [ ] `federated_classified_listing` + `federated_service_listing` tables — read-only; keyed by `(origin_society_handle, remote_uuid)`
- [ ] Inbound API: `POST /api/receive` — verify signature, upsert federated listing record
- [ ] Browse pages show federated listings alongside local when `scope = all`
- [ ] Cross-society transaction routing (deferred to clearinghouse spec)
