# Community Bank App — Build Plan

## Open Questions (resolve before / during Phase 1)

- [x] **Auth**: Share `bfs_session` cookie + read governance DB for session resolution (no OIDC for now). Unauthenticated requests redirect to `$GOVERNANCE_URL/login`.
- [x] **DB isolation**: Own SQLite file (`DATABASE_PATH`, default `./bank.sqlite`). Governance DB read-only via `GOVERNANCE_DATABASE_PATH` for session resolution only. No shared person/association tables.
- [ ] **Scheduled transfers / demurrage**: Deferred to Phase 5.

---

## Phase 1 — Foundation ✅
**Goal**: Schema, seed data, and session wiring. Nothing visible to users yet.

- [x] DB schema: `account`, `"transaction"`, `scheduled_transfer`, `scheduled_transfer_group`, `admin_action_log`, `outbox`
- [x] Seed: Central Bank, Treasury, SIF, Clearinghouse special accounts (`scripts/seed.ts`)
- [x] Session wiring: reads governance DB session table via `src/lib/server/session.ts`
- [x] `hooks.server.ts` — resolves session, updates `handle_cache`, deletes stale cookie
- [x] `src/routes/+layout.server.ts` — exposes session; redirects unauthenticated users to governance login
- [x] `src/app.d.ts` — `App.Locals` typed with `BankSession | null`
- [x] `src/lib/server/accounts.ts` — `createAccount`, `getAccountByUuid`, `getAccountsByPrincipal`, `getAccountByPrincipalAndName`, `updateHandleCache`, `freezeAccount`, `unfreezeAccount`
- [x] `package.json` — `seed` and `reset` scripts; `tsx` + `@types/node` devDeps added

**Run seed**: from `apps/community-bank`:
```
pnpm seed    # idempotent — safe to re-run
pnpm reset   # wipe bank DB and re-seed
```

---

## Phase 2 — Member UI ✅
**Goal**: A logged-in member can see their balance, history, and send Franks.

- [x] Account overview page (`/`) — balance, account name(s), frozen badge; auto-provisions Primary account on first visit
- [x] Transaction history (`/history`) — paginated, filterable by type; per-account selector if multiple accounts
- [x] Send transfer (`/send`) — recipient by handle (person or association), amount, optional memo; validates `acting_as` matches source account
- [x] Public ledger (`/ledger`) — money supply, total accounts, total issuance, total demurrage, accounts in deficit
- [x] Institutional transparency (`/treasury`) — Treasury and SIF balance + full paginated history; toggle between the two

---

## Phase 3 — Teller Mode ✅
**Goal**: Members with the `teller` permission can enter slip transactions at the counter.

- [x] Teller permission gate — show teller UI option on login/session switch
- [x] Account lookup by handle — view balance + recent history
- [x] Enter slip transaction — both parties' handles, amount, slip serial (required)
- [x] Session slip log — all slips entered this session, for end-of-session review

---

## Phase 4 — Administration ✅
**Goal**: Community Bank Service admins can manage accounts and view any ledger.

Requires admin permission in Community Bank Service.

- [x] View any account + full transaction history
- [x] Freeze / unfreeze account (audit-logged)
- [x] Manual correction transaction — required memo, audit-logged, recorded as reversing transaction
- [x] Scheduled transfer list — view, pause, cancel (creation is via governance motion effects only)

---

## Phase 5 — Scheduled Transfer Execution ✅
**Goal**: The Frank economy actually runs — payroll, dues, SIF, demurrage execute automatically.

- [x] Cron scheduler wired up — evaluates `schedule` on `scheduled_transfer` rows
- [x] Payroll execution — transfers from service account to staff member accounts
- [x] Dues pull — from member accounts to Treasury, monthly
- [x] SIF allowance disbursement — from SIF to eligible members, monthly
- [x] Demurrage batch job — charges all eligible accounts (balance > threshold), posts to Treasury
- [x] Event listener — handles governance events: `member.created`, `association.created`, `member.revoked`, `member.birthday`
- [x] Idempotency — re-received events checked before acting

---

## Phase 6 — Inter-Society Transfers *(deferred)*
**Goal**: Franks can move between societies via correspondent banking.

Defer until Phases 1–5 are solid.

- [ ] Keypair generation and storage (private key encrypted at rest, never in DB)
- [ ] `neighboring_society` table and contact discovery via Federation
- [ ] Outbound transfer: sign payload, send to neighbor, await signed acknowledgement, post debit
- [ ] Inbound transfer: verify signature, credit recipient + clearinghouse account, return signed ack
- [ ] Pending transfer hold (soft hold on sender balance while awaiting ack)
- [ ] Federation reporting (async, both societies report completed transfer)
- [ ] Peer gossip fallback for federation-unavailable contact discovery

---

## Notes

- Transactions are **append-only**. Corrections = new reversing transactions (same type, from/to swapped, memo referencing original UUID).
- Negative balances are permitted everywhere. Central Bank account is expected to be deeply negative (its absolute value = total money supply).
- Demurrage does not apply to negative balances or the Central Bank account.
- Scheduled transfers are **only** created/modified via governance motion effects. No direct UI creation path.
- `handle_cache` on accounts is display-only; updated opportunistically, never used as a key.
