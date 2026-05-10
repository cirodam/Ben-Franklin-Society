# The Ben Franklin Society
## Data Model — Community Bank App

---

## `account`

A Frank account held by a principal — person or association. A principal may hold multiple accounts.

| Column | Type | Constraints | Description |
|---|---|---|---|
| `uuid` | TEXT | PRIMARY KEY | |
| `principal_uuid` | TEXT | NOT NULL | UUID of the owning principal — person or association. Not a FK (the account DB has no copy of the person/association tables) |
| `name` | TEXT | NOT NULL | Human-readable label for the account, unique per principal — e.g. `Primary`, `Payroll`, `Operating Fund` |
| `handle_cache` | TEXT | NOT NULL | Principal's handle, cached from Governance for display only |
| `balance` | INTEGER | NOT NULL, DEFAULT 0 | Current balance in Franks. May be negative. Franks are not subdivided |
| `status` | TEXT | NOT NULL, DEFAULT `active` | `active`, `frozen` |
| `created_at` | DATETIME | NOT NULL | |

Unique constraint: `(principal_uuid, name)`

### Special Accounts

| Account | Balance meaning |
|---|---|
| Central Bank | Always negative (or zero). Its absolute value is the total Frank money supply |
| Treasury | Receives all issuance and recirculation demurrage; source of Assembly appropriations |
| Social Insurance Fund | Funded by Assembly appropriation; disburses monthly allowances |

These are ordinary accounts in the data model. Their significance is operational — they are referenced by name in system configuration and scheduled transfer definitions.

### Notes

- `principal_uuid` is not a foreign key — the Community Bank database has no copy of the person or association tables. Principal identity is resolved via the OIDC session at runtime.
- A principal may have multiple accounts with distinct names. The first account created for a principal is conventionally named `Primary`.
- The Central Bank account balance is always ≤ 0. Its absolute value at any moment is the total Franks in circulation. There is no separate money supply counter — the ledger is the source of truth.
- Negative balances are permitted for all accounts. Member accounts going negative trigger an outreach flag but no punitive action. The Central Bank account is expected to be deeply negative.
- Demurrage does not apply to the Central Bank account or to any account with a negative balance.
- `handle_cache` is updated opportunistically when a principal's session touches the app. It is for display only — stale values do not affect correctness.

---

## `transaction`

An immutable record of every Frank movement. The ledger.

| Column | Type | Constraints | Description |
|---|---|---|---|
| `uuid` | TEXT | PRIMARY KEY | |
| `from_uuid` | TEXT | NOT NULL, FK → `account.uuid` | Source account |
| `to_uuid` | TEXT | NOT NULL, FK → `account.uuid` | Destination account |
| `amount` | INTEGER | NOT NULL | Amount in Franks. Always positive |
| `type` | TEXT | NOT NULL | `transfer`, `issuance`, `demurrage`, `dues`, `payroll`, `allowance` |
| `source` | TEXT | NOT NULL | `online` — initiated via the app; `slip` — entered by a teller from a physical slip |
| `slip_serial` | TEXT | NULL | Serial number of the physical slip. Required when `source = slip`, otherwise null |
| `memo` | TEXT | NULL | Optional free-text description |
| `scheduled_transfer_uuid` | TEXT | NULL, FK → `scheduled_transfer.uuid` | Set if executed by a scheduled transfer; otherwise null |
| `created_at` | DATETIME | NOT NULL | |

### Notes

- Transactions are append-only. Corrections are recorded as new reversing transactions, never as edits.
- `type = issuance`: `from_uuid` is the Central Bank account; `to_uuid` is the Treasury. Franks are created — the CB balance goes more negative.
- `type = demurrage`: `from_uuid` is the account being charged. `to_uuid` is either the Treasury (recirculation demurrage) or the Central Bank account (contraction demurrage). Destination is what distinguishes the two purposes.
- `type = transfer`: a member- or association-initiated transfer. The app verifies that `account.principal_uuid` for `from_uuid` matches the `acting_as` UUID in the initiating session.
- Reversing a transaction creates a new transaction of the same type with `from` and `to` swapped and a memo referencing the original UUID.

---

## `scheduled_transfer`

A standing instruction to move a fixed amount of Franks from one account to another on a recurring schedule. The primitive underlying payroll, dues, SIF allowances, issuance, and demurrage.

| Column | Type | Constraints | Description |
|---|---|---|---|
| `uuid` | TEXT | PRIMARY KEY | |
| `name` | TEXT | NOT NULL | Human-readable label |
| `from_uuid` | TEXT | NOT NULL, FK → `account.uuid` | Source account |
| `to_uuid` | TEXT | NOT NULL, FK → `account.uuid` | Destination account |
| `amount` | INTEGER | NOT NULL | Amount in Franks |
| `type` | TEXT | NOT NULL | Same vocabulary as `transaction.type` — the type of transaction this transfer produces |
| `schedule` | TEXT | NOT NULL | Cron expression |
| `group_uuid` | TEXT | NULL, FK → `scheduled_transfer_group.uuid` | Groups related transfers (e.g. all payroll transfers for a Service) |
| `status` | TEXT | NOT NULL, DEFAULT `active` | `active`, `paused`, `cancelled` |
| `created_by_motion_uuid` | TEXT | NULL, FK → `motion.uuid` | The motion whose structured effect created this transfer. NULL for system-configured transfers (demurrage, dues) |
| `created_at` | DATETIME | NOT NULL | |
| `cancelled_at` | DATETIME | NULL | |

### Notes

- Scheduled transfers are created, modified, and cancelled via structured effects on enacted motions, or by system configuration for demurrage and dues. No scheduled transfer may be created or changed by direct UI action outside of those two paths.
- The `schedule` cron expression is evaluated by the Community Bank's scheduler. On each firing, a `transaction` row is inserted and account balances updated atomically.
- Demurrage runs differently: rather than per-account scheduled transfers, a single `demurrage` type scheduled transfer triggers a batch job that calculates and applies charges to all eligible accounts in one atomic operation.

---

## `scheduled_transfer_group`

A named grouping of related scheduled transfers — primarily used for payroll (all staff transfers for a Service sharing a source account and schedule).

| Column | Type | Constraints | Description |
|---|---|---|---|
| `uuid` | TEXT | PRIMARY KEY | |
| `name` | TEXT | NOT NULL | e.g. `Healthcare Service Payroll` |
| `association_uuid` | TEXT | NOT NULL | UUID of the owning association. Not a FK — Community Bank has no copy of the association table |
| `created_at` | DATETIME | NOT NULL | |
