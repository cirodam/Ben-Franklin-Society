# The Ben Franklin Society
## Mail App — Build Plan

Mirrors the structure of the community-bank plan. Each phase is a vertical slice: complete and type-checks clean before starting the next.

**Tech stack** (same across all BFS apps):
- SvelteKit 2 + Svelte 5 (runes), TypeScript strict, `moduleResolution: bundler`
- SQLite via `better-sqlite3` v11+, WAL mode, FK ON
- pnpm workspaces + Turborepo
- Auth: `bfs_session` cookie → Governance DB → `locals.session`
- Dev server: `pnpm exec vite dev` from `apps/mail`

**App identifier** (for `role_permission.app`): `'mail'`

**Permission names**:
- `moderator` — Communications Service members who can moderate content and administer mailboxes

---

## Phase 1 — Foundation 

✅

**Goal**: Bare app skeleton with schema, DB, auth, layout shell, and seed.

- [x] `src/lib/server/schema.ts` — all four tables: `mailbox`, `message`, `message_recipient`, `message_report`, `moderation_log`
- [x] `src/lib/server/db.ts` — opens `mail.sqlite` + `govDb` (governance, read-only)
- [x] `src/lib/server/session.ts` — `resolveSession(token)` → `MailSession | null`; same SHA-256 cookie pattern as bank app
- [x] `src/lib/server/mailboxes.ts` — `ensureMailbox(principal_uuid, handle)`, `getMailbox(principal_uuid)`, `suspendMailbox(principal_uuid)`, `reinstateMailbox(principal_uuid)`, `updateHandleCache(principal_uuid, handle)`
- [x] `src/lib/server/permissions.ts` — `hasMailPermission(person_uuid, permission)` querying govDb; `PERMISSIONS = { MODERATOR: 'moderator' }`
- [x] `src/hooks.server.ts` — resolves session, refreshes handle cache, redirects if unauthenticated and not on public route
- [x] `src/app.d.ts` — `App.Locals { session: MailSession | null }`
- [x] `src/routes/+layout.server.ts` — redirect to governance login if unauthenticated; pass `session`, `isModerator`
- [x] `src/routes/+layout.svelte` — sidebar shell: Inbox, Sent, Drafts, Trash, Compose button; Moderator link if `isModerator`; footer with `@{handle}`
- [x] `scripts/seed.ts` — provision mailboxes for all existing active persons and associations from govDb; idempotent
- [x] `scripts/reset.sh` — `rm -f mail.sqlite && pnpm seed`
- [x] `package.json` scripts: `seed`, `reset`
- [x] Type-check: `svelte-kit sync && tsc --noEmit`

---

## Phase 2 — Core Mailbox ✅

**Goal**: Members can read their inbox, view threads, compose, save drafts, and use trash.

### Inbox (`/`)
- [x] `src/lib/server/messages.ts` — core query functions:
  - `getInbox(principal_uuid, opts)` — received, not trashed, status=sent; paginated; includes unread count
  - `getSent(principal_uuid, opts)` — messages where `from_principal_uuid = ?`, status=sent; paginated
  - `getDrafts(principal_uuid, opts)` — messages where `from_principal_uuid = ?`, status=draft; paginated
  - `getTrash(principal_uuid, opts)` — received + trashed; paginated
  - `getThread(thread_id, principal_uuid)` — all messages in thread visible to principal, ordered by `created_at`
  - `getMessage(uuid)` — single message with all recipients
  - `markRead(message_uuid, principal_uuid)` — sets `read_at`
  - `trashMessage(message_uuid, principal_uuid)` — sets `trashed_at`
  - `restoreMessage(message_uuid, principal_uuid)` — clears `trashed_at`
  - `permanentlyDelete(message_uuid, principal_uuid)` — deletes `message_recipient` row (local delete only)
  - `getUnreadCount(principal_uuid)` — for sidebar badge
- [x] `src/routes/+page.server.ts` + `+page.svelte` — inbox list; thread summary rows; unread bold; pagination
- [x] `src/routes/thread/[thread_id]/+page.server.ts` + `+page.svelte` — full thread view; marks all as read on load; inline reply form (reply + trash + restore actions also implemented here)

### Compose (`/compose`)
- [x] `src/lib/server/messages.ts` additions:
  - `saveDraft(opts)` — upserts draft message + recipients
  - `sendMessage(opts)` — validates mailbox active; inserts message (status=sent), inserts `message_recipient` rows, sets `sent_at`
  - `resolveHandle(handle, govDb)` — looks up local person or association by handle; returns `{ principal_uuid, handle_cache }` or null
  - `replyToMessage(opts)` — inserts a reply into an existing thread
- [x] `src/routes/compose/+page.server.ts` + `+page.svelte` — compose form (to, cc, subject, body); save draft action; send action; handle validation inline

### Sent / Drafts / Trash (`/sent`, `/drafts`, `/trash`)
- [x] `src/routes/sent/+page.server.ts` + `+page.svelte` — paginated sent list
- [x] `src/routes/drafts/+page.server.ts` + `+page.svelte` — draft list; each row links to `/compose?draft={uuid}` (pre-fills compose form)
- [x] `src/routes/trash/+page.server.ts` + `+page.svelte` — trash list; restore and permanent-delete actions per row
- [x] Type-check: `svelte-kit sync && tsc --noEmit`

---

## Phase 3 — Message Actions

## Phase 3 — Message Actions ✅

**Goal**: Full set of per-message actions.

- [x] `src/routes/thread/[thread_id]/+page.server.ts` action `reply` — creates new sent message in same thread, `reply_to_id` set, `thread_id` preserved; form data: body only (subject auto-prefixed `Re:`)
- [x] `src/routes/thread/[thread_id]/+page.server.ts` action `trash` — trash a single message in thread
- [x] `src/routes/thread/[thread_id]/+page.server.ts` action `restore` — restore a single trashed message
- [x] `src/routes/thread/[thread_id]/+page.server.ts` action `report` — insert `message_report` row; one report per member per message (unique enforced in application layer)
- [x] `src/lib/server/messages.ts` addition — `insertReport(message_uuid, reporter_uuid, reason)`
- [x] `src/routes/compose/+page.server.ts` addition — pre-fill from `?reply_to={uuid}` (reply) or `?forward={uuid}` (forward); forward inserts fwd prefix and body quote
- [x] Thread view: Reply + Forward links per message (to compose), trash/restore per received message, inline Report form with reason textarea and confirmation
- [x] Type-check: `svelte-kit sync && tsc --noEmit`

---

## Phase 4 — Moderation

**Goal**: Communications Service moderators can manage reports, delete messages, and suspend mailboxes.

- [x] `src/lib/server/moderation.ts` — `getPendingReports()`, `getReport(uuid)`, `resolveReport(uuid, action, actor_uuid, reason)`, `deleteMessage(uuid, actor_uuid, reason, report_uuid?)`, `suspendMailbox(principal_uuid, actor_uuid, reason, report_uuid?)`, `reinstateMailbox(principal_uuid, actor_uuid, reason)` — all actions written to `moderation_log`
- [x] `src/routes/moderator/+layout.server.ts` — gate on `hasMailPermission(person_uuid, PERMISSIONS.MODERATOR)`
- [x] `src/routes/moderator/+layout.svelte` — moderator-branded shell; nav: Reports, Mailboxes
- [x] `src/routes/moderator/+page.server.ts` + `+page.svelte` — pending reports list; each row shows message subject, reporter (anonymised to "A member"), date; link to review page
- [x] `src/routes/moderator/reports/[uuid]/+page.server.ts` + `+page.svelte` — full message text, reporter's stated reason; actions: Dismiss, Delete Message, Suspend Mailbox; all require reason input; action confirmation
- [x] `src/routes/moderator/mailboxes/+page.server.ts` + `+page.svelte` — all mailboxes; search by handle; status badge; suspend/reinstate action inline
- [x] Sidebar moderator link (shown when `isModerator`)
- [x] Type-check: `svelte-kit sync && tsc --noEmit`

---

## Phase 5 — Mailbox Sync

**Goal**: Mailboxes stay in sync with membership automatically; can be run as a cron job.

- [x] `src/lib/server/schema.ts` addition — `sync_run(uuid, job, period_key, ran_at, result_json)` with `UNIQUE(job, period_key)`
- [x] `src/lib/server/sync.ts` — `syncMailboxes()`:
  - Provision missing mailboxes for all active persons and associations from govDb
  - Refresh `handle_cache` for all existing mailboxes from govDb
  - Suspend mailboxes for revoked persons (govDb `status = 'revoked'`)
  - Returns `{ created, updated, suspended, errors }`
- [x] `scripts/run-sync.ts` — CLI entry point: runs `syncMailboxes()`, structured log output, exits 1 on errors
- [x] `package.json` script: `sync` — `tsx scripts/run-sync.ts`
- [x] Type-check: `svelte-kit sync && tsc --noEmit`

---

## Phase 6 — Inter-Society Mail *(deferred)*

**Goal**: Members can send to and receive from principals at other BFS communities.

Defer until Phases 1–5 are solid and inter-society banking is operational (shared key infrastructure).

- [ ] Handle resolution for `localpart@remotesociety` — query Federation for remote society endpoint + public key
- [ ] `neighboring_society` table + caching
- [ ] Outbound: sign payload with society private key, POST to remote Mail API, await signed ack, mark `delivered`
- [ ] Inbound API: `POST /api/receive` — verify signature, write message + recipient row, return signed ack
- [ ] Delivery retry logic: `pending` → retry up to N times with backoff → `unreachable`
- [ ] Thread continuity across society boundaries (opaque `thread_id`)
- [ ] Nonce deduplication table (replay protection)
- [ ] Delivery status visible to sender in thread view

---

## Notes

- Messages are **never mutated** after send. `trashed_at` and `read_at` live on `message_recipient`, not `message`. Deletion removes only the recipient row — the message row remains for the sender's sent view and for moderation access.
- Drafts are mutable. A draft row may be updated until it is sent, at which point `status` flips to `sent` and it becomes immutable.
- The `from_principal_uuid` / `from_handle_cache` on `message` are set at send time and never updated — even if the sender's handle changes later.
- `handle_cache` on `mailbox` is updated opportunistically on every login (hooks.server.ts) and by the sync job.
- The app enforces `from_principal_uuid = session.acting_as_uuid` at the application layer — no DB constraint. This is the sole anti-spoofing mechanism for intra-society mail.
- Threading: `thread_id = uuid` for root messages. Replies carry the root's `thread_id`.
