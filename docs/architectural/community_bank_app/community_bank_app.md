# The Ben Franklin Society
## Community Bank App
### Technical Design Document

---

## Overview

The Community Bank app is the member-facing financial utility for the society. It maintains accounts with both **Frank** (local) and **Floren** (federal) balances, processes transactions, maintains the authoritative ledger, and executes all scheduled transfers — payroll, dues, Social Insurance Fund allowances, issuance, and demurrage.

**Dual Currency Model:**
- **Franks** are locally tied — issued by the society, used only within the society, subject to demurrage
- **Florens** are the federal trade currency — can be sent/received across societies, no demurrage
- Every account holds both currency types; transactions specify which currency to use

**Offline-First Design:**
The Community Bank is designed to **operate completely independently of the internet**. Physical branches using passbooks, transaction slips, and paper ledgers can function for extended periods without digital systems. The digital system is a convenience and efficiency tool, not a dependency. See [Offline Branch Operations](offline_branch_operations.md) for complete design.

This document focuses primarily on the digital implementation and Frank-specific features (issuance, demurrage, scheduled transfers). For inter-society Floren transfers, see [Inter-Society Banking](../inter_society_banking.md).

It is an OIDC relying party: all authentication is delegated to the Governance app. It has no user registry of its own — accounts are keyed to principal UUIDs provided by Governance.

The Community Bank is administered by the **Community Bank Service**. Members of that Service holding elevated roles manage account administration, ledger reconciliation, and configuration.

---

## Accounts

Every principal — member or association — has exactly one account that holds both Frank and Floren balances. Accounts are created automatically when Governance fires a `member.created` or `association.created` event. They are not created on first login; they exist from the moment the principal is registered.

### Account Record

| Field | Description |
|---|---|
| `uuid` | The principal's UUID from Governance — the account's stable identifier |
| `handle` | Cached from Governance for display; not used as a key |
| `franks_balance` | Current Frank balance (integer; Franks are not subdivided) |
| `florens_balance` | Current Floren balance (integer; Florens are not subdivided) |
| `status` | `active`, `frozen` |
| `created_at` | Timestamp of account creation |

Handles are cached for display only. All internal references use UUIDs. If a principal changes their handle, the account record is updated on the next session that touches it; the balances and history are unaffected.

### Special Accounts

Several accounts have institutional significance and are treated as system accounts:

| Account | Purpose |
|---|---|
| Treasury | Receives all issuance and demurrage; source of Assembly appropriations |
| Social Insurance Fund | Funded by Assembly appropriation; disburses monthly allowances |

These accounts are owned by their respective associations. They are not special in the data model — they are ordinary association accounts — but they are referenced by name in system configuration and by scheduled transfer definitions.

### Negative Balances

Negative balances are permitted. The Community Bank does not refuse transactions that would bring a member's account below zero. A member carrying a negative balance is flagged for outreach from the Community Bank Service, but no punitive action is taken. Demurrage does not apply to negative balances.

---

## Transactions

A transaction is a transfer of Franks from one account to another. All state changes to balances are recorded as immutable transaction records.

### Transaction Record

| Field | Description |
|---|---|
| `id` | UUID, assigned at creation |
| `from_uuid` | Source account UUID |
| `to_uuid` | Destination account UUID |
| `amount` | Amount in Franks (positive integer) |
| `type` | `transfer`, `issuance`, `demurrage`, `dues`, `payroll`, `allowance` |
| `source` | `online` — initiated via the app; `slip` — entered by a teller from a physical slip |
| `slip_serial` | Serial number of the physical slip, if `source` is `slip`; otherwise null |
| `memo` | Optional free-text description |
| `scheduled_transfer_id` | If executed by a scheduled transfer, its ID; otherwise null |
| `created_at` | Timestamp |

Transactions are append-only. Corrections are made by reversing transactions, not editing them.

### Authorization

Who may initiate a transaction depends on the active session context:

- A member acting as themselves may transfer from their own account.
- A member acting as an association (with appropriate permissions) may transfer from that association's account.
- Scheduled transfers execute under system authority — they do not require an interactive session.

The `acting_as` and `permissions` claims from the OIDC session determine scope. The app rejects any transfer where the source account's `principal_uuid` does not match the session's `acting_as` UUID (unless the session carries system-level authority for scheduled transfers).

---

## Scheduled Transfers

Scheduled transfers are the central primitive powering most of the Frank economy's automated flows. A scheduled transfer is a standing instruction to move a fixed amount of Franks from one account to another on a recurring schedule.

### Scheduled Transfer Record

| Field | Description |
|---|---|
| `id` | UUID |
| `name` | Human-readable label |
| `from_uuid` | Source account UUID |
| `to_uuid` | Destination account UUID |
| `amount` | Amount in Franks |
| `schedule` | Cron expression or named schedule (`monthly`, `weekly`, etc.) |
| `group_id` | Optional — links this transfer to a named payroll or allowance group |
| `status` | `active`, `paused`, `cancelled` |
| `created_by_motion_id` | The motion that created or last modified this transfer |

Scheduled transfers are created, modified, and cancelled via structured effects on enacted motions in Governance. No scheduled transfer may be created or changed by direct UI action — they are always the result of a governance decision. This is the enforcement mechanism for the principle that the Community Bank executes; it does not govern.

### System Functions as Scheduled Transfers

All of the following are implemented as scheduled transfers. The direction, source, destination, and authorization rules differ; the primitive is identical.

| Function | Direction | From | To | Schedule |
|---|---|---|---|---|
| Payroll | Outward | Service account | Staff member accounts | Per Assembly appropriation |
| SIF allowances | Outward | Social Insurance Fund account | Eligible member accounts | Monthly |
| Dues | Inward | Member accounts | Treasury | Monthly |
| Issuance | Inward | *(created by Central Bank event)* | Treasury | On member birthday |
| Demurrage | Inward | Accounts above threshold | Treasury | Periodic |

**Payroll** is a named group of scheduled transfers sharing a source account and schedule. Adding or removing a staff member from payroll is a structured effect on an Assembly motion — it creates or cancels the individual scheduled transfer for that member.

**Dues** are pulled from member accounts by the Treasury on a monthly schedule. The dues rate is set by Assembly resolution (a structured effect that updates the amount on all active dues transfers).

**Issuance** is triggered by the `member.birthday` event from the Central Bank module in Governance. The event carries the amount and the destination (Treasury); the Community Bank creates a one-time transaction rather than a standing scheduled transfer, since birthdays are not a fixed recurring calendar date per account.

**Demurrage** runs on a periodic schedule. When the demurrage job fires, the Community Bank queries all accounts with balances above the threshold, calculates the charge for each, and executes the transfers to Treasury in a single atomic batch. No individual scheduled transfer records are created per account — demurrage is a system job, not a per-account standing instruction.

---

## Transparency

The bylaws require that all Frank issuance records, demurrage calculations, and ledger summaries be open to inspection by any member at any time. The Community Bank app surfaces:

- **Public ledger view** — aggregate statistics: total money supply, total accounts, total issuance to date, total demurrage collected. Available to all authenticated members.
- **Personal account history** — full transaction history for the member's own account (and any association account they have `act-as` access to). Paginated, filterable by type and date.
- **Institutional account transparency** — Treasury and Social Insurance Fund account balances and transaction histories are visible to all members. These are community funds; their state is public.

Individual member account balances are private to the account holder and Community Bank Service administrators.

---

## Annual Report

The Community Bank and Central Bank jointly publish an annual report on the state of the Frank:

- Total issuance in the period
- Total money supply at period end
- Total demurrage collected
- Account summary statistics (total accounts, median balance, accounts in negative)
- Membership roll totals (sourced from Governance/Central Bank)

This report is generated from the ledger and published to the Document Library in Governance as an association-owned document under the Community Bank Service.

---

## Event Subscriptions

The Community Bank subscribes to events fired by the Governance app's Central Bank module:

| Event | Action taken |
|---|---|
| `member.created` | Create Frank account for member |
| `association.created` | Create Frank account for association |
| `member.revoked` | Freeze member account |
| `member.birthday` | Execute issuance transfer to Treasury |
| `demurrage.run` | Run demurrage batch job |

Events are processed idempotently. If an event is received more than once (e.g. due to retry), the Community Bank checks whether the corresponding action has already been taken before executing.

---

## Teller Operations

The Community Bank has an in-person component. Tellers staff physical branches where members conduct transactions face-to-face using physical transaction slips and passbooks. The app supports this through a dedicated teller mode for when digital systems are available.

**Dual operation modes:**
- **Online teller mode:** Digital system with teller permissions, immediate ledger updates
- **Offline branch operation:** Paper passbooks and slips, reconciled later when connectivity returns

For complete offline branch design including passbooks, physical slips, scrip systems, and reconciliation procedures, see [Offline Branch Operations](offline_branch_operations.md).

This section covers the **digital teller interface** used when the system is online.

### Teller Permission

`teller` is a named permission published by the Community Bank app. The Community Bank Service assigns it to members staffing the teller role via Governance roles. A session carrying the `teller` permission gains access to the teller interface. No other mechanism grants teller access.

### Teller Interface (Online Mode)

The teller interface is a distinct UI mode within the app — not a separate application. A member with the `teller` permission sees a teller-mode option on login. In teller mode, a teller can:

- **Look up any account by handle** — view the current balance and recent transaction history
- **Enter a slip transaction** — record a transfer from a physical slip (when reconciling offline slips), providing both parties' handles, the amount, and the slip serial number
- **Process live transactions** — execute transfers on behalf of members present at the counter
- **Print receipts** — generate printable transaction receipts for member records
- **View the slip entry log** — all slip transactions entered during the current session, for end-of-session review

Tellers act under system authority for the specific purpose of entering slip transactions — they are not initiating transfers on behalf of either party, they are recording a transaction that already occurred (online or offline). When entering offline slips, the slip serial number is required; the teller cannot save a slip entry without it.

### Slip Serial Numbers

Physical transaction slips are pre-numbered by the Community Bank Service before distribution. Serial numbers are the mechanism by which the ledger and the physical slip record can be cross-referenced. A slip serial number appears on every teller-entered transaction record.

The numbering scheme, slip format, and distribution process are operational matters for the Community Bank Service, not defined by the app. The app only requires that a serial number be provided at entry time.

### Slip Entry and Reconciliation

When entering slips from an offline period:
1. Teller accesses "offline slip entry" mode
2. For each slip: enters serial number, validates not already entered
3. Enters transaction details: from, to, currency, amount, date, memo
4. System validates and creates transaction record
5. Marks slip as entered in `physical_slip` table
6. At end of session: generates reconciliation batch report

The system automatically flags conflicts between paper and digital records for administrator review. See [Offline Branch Operations](offline_branch_operations.md) for complete reconciliation procedures.

### Physical Slip as Parallel Record

The physical slip record and the digital ledger are parallel records of the same economic activity. **During offline periods, the paper record is authoritative.** The digital ledger is corrected to match properly executed paper transactions when connectivity returns. When online, both records are created simultaneously for redundancy and member receipts.

---

## Administration

The Community Bank Service administers the app. Members of that Service holding a role with elevated permissions may:

- View any account balance and transaction history
- Freeze or unfreeze accounts
- Initiate manual correction transactions (with required memo and audit trail)
- Run ledger reconciliation reports
- Manage scheduled transfer configuration

All administrative actions are logged with the administrator's UUID, timestamp, and a required memo. There is no action an administrator can take that does not leave an audit record.
