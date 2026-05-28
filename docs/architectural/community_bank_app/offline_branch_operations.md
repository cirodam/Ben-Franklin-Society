# The Ben Franklin Society
## Community Bank — Offline Branch Operations
### Design Document

---

## Overview

The Community Bank must function as a **fully offline physical institution** in addition to its digital presence. Members without internet access, societies without reliable connectivity, and situations where electronic systems are unavailable (power outages, network failures, deliberate disconnection) require the bank to operate using paper records, physical tokens, and in-person verification.

This design ensures the banking system can survive complete internet disconnection for extended periods while maintaining transaction integrity and eventually reconciling with the digital ledger when connectivity returns.

**Core principle:** The paper record is authoritative during offline operation. The digital ledger catches up when possible, not the reverse.

---

## Physical Branch Components

### 1. Passbook System

Every account holder receives a **physical passbook** — a bound booklet that serves as the member's personal ledger. The passbook is the account holder's proof of balance and transaction history when offline.

**Passbook contents:**
- Account holder name and handle
- Account UUID (barcode or QR code for quick scanning)
- Society name and Community Bank seal
- Pre-printed transaction log pages (date, description, debit, credit, balance columns)
- Initial balance recorded at issuance

**Passbook transactions:**
When a member visits the branch to make a transaction:
1. Member presents passbook and states transaction intent
2. Teller verifies identity (photo ID, recognition, or community knowledge)
3. Teller writes transaction in passbook: date, description, amount, new balance
4. Teller stamps and initials the entry
5. Member verifies and signs the entry
6. Transaction simultaneously recorded on **physical slip** (see below)

**Passbook as legal record:**
The stamped, initialed, and signed passbook entry is legally binding. In disputes, the passbook is evidence. Digital records that contradict a properly executed passbook entry are corrected to match the passbook, not the reverse.

**Passbook distribution:**
- Issued when account is created (or member opts in to offline access)
- Replacement passbooks issued when full (old passbook archived)
- Lost passbooks: teller issues replacement with last-known balance from branch records

---

### 2. Physical Transaction Slips

**Two-part carbonless slips** serve as the branch's transaction log. Every transaction generates a slip:

**Slip contents:**
- Pre-printed serial number (critical for reconciliation)
- Date and time
- From: account holder (name, handle, account number)
- To: account holder (name, handle, account number) 
- Currency: Franks or Florens
- Amount (numeric and written out)
- Purpose/memo
- Teller signature
- Member signature (both parties if both present)

**Slip workflow:**
- **Part 1 (white copy):** Stays in branch log, filed by date
- **Part 2 (yellow copy):** Given to member as receipt

**Daily slip log:**
At end of day, teller compiles all slips into daily batch:
- Count total slips
- Sum total Franks moved
- Sum total Florens moved
- Verify internal transfers balance (debits = credits)
- Note any discrepancies
- Package slips for eventual digital entry

---

### 3. Physical Branch Ledger

A **bound ledger book** serves as the branch's master record during offline operation.

**Daily summary page:**
- Date
- Opening balances (Franks reserve, Florens reserve)
- Number of transactions processed
- Total Franks deposited / withdrawn
- Total Florens deposited / withdrawn  
- Closing balances
- Teller signatures
- Notes and anomalies

**Account-by-account pages:**
For frequent users or when detailed tracking needed:
- Account handle and name
- Transaction date
- Slip serial number
- Debit/credit
- Running balance

**Reconciliation pages:**
When connectivity returns:
- Date reconciled
- Number of slips entered into digital system
- Discrepancies found
- Resolution notes

---

### 4. Physical Scrip (Optional but Recommended)

For communities operating offline for extended periods, **physical scrip** can ease transactions:

**Floren scrip:**
- Printed paper notes in denominations (1, 5, 10, 50, 100 Florens)
- Serial numbered
- Society seal and signatures
- Difficult to counterfeit features (watermarks, unique paper, etc.)
- Redeemable at any BFS Community Bank when online

**Why scrip:**
- Allows transactions without both parties visiting branch
- Member can withdraw scrip, use in marketplace, recipient deposits later
- Reduces branch transaction volume
- Provides liquidity during offline periods

**Frank scrip challenges:**
Franks are locally tied, so scrip is only valid within issuing society. For inter-society trade during offline periods, only Floren scrip works.

**Scrip accounting:**
- Branch maintains scrip drawer (like cash register)
- Scrip issued = liability (member can redeem)
- Scrip redeemed = asset removed
- Periodic scrip inventory reconciliation
- Worn/damaged scrip retired and replaced

---

### 5. Identity Verification Without Digital Systems

When offline, tellers verify identity through:

**Primary methods:**
- Photo ID cross-referenced with membership roster (printed book)
- Personal recognition (small communities)
- Biometric backup if available offline (fingerprint scanner with local storage)

**Printed membership roster:**
- Updated monthly or when connectivity available
- Includes: handle, name, photo, date of birth, address
- Marked when member is revoked/suspended
- Tellers work from most recent printed roster

**Unknown/disputed identity:**
- Require two community members to vouch (both sign slip)
- Higher-value transactions require multiple verifiers
- Disputed identities escalated to Community Bank Service administrator

---

### 6. Branch Cash Drawer / Reserves

The branch maintains **reserves** to service withdrawals and deposits:

**Frank reserves:**
- Physical scrip if used
- Or: maintain digital account at low balance, adjust passbooks and slips without physical cash changing hands

**Floren reserves:**
- Physical scrip (essential for offline operation)
- Drawer typically holds: 5,000-10,000 Florens depending on traffic
- Daily deposits and withdrawals balance out over time

**Drawer reconciliation:**
At end of each shift:
- Count scrip remaining
- Compare to starting balance + deposits - withdrawals
- Reconcile against slip log
- Note discrepancies (over/under)
- Next shift starts with verified count

---

## Offline Operation Scenarios

### Scenario 1: Planned Offline Period (Monthly Market Day)

**Preparation (day before):**
1. Download latest digital ledger snapshot
2. Print current balances for frequent users
3. Prepare slip books (verify serial number sequence)
4. Stock scrip drawer if using physical currency
5. Print updated membership roster
6. Charge any battery-powered equipment

**During market (fully offline):**
1. Members present passbooks for transactions
2. Teller records in passbook + generates slip
3. Both parties sign
4. Paper slips filed in sequence
5. Branch ledger updated with summary data

**Reconciliation (when connectivity returns):**
1. Teller enters all slips into digital system
2. System flags any discrepancies with online transactions that occurred
3. Administrator reviews flags, resolves conflicts
4. Passbooks updated on next visit if needed
5. Slip archive filed chronologically

---

### Scenario 2: Extended Offline Period (Network Outage)

**Duration: Days to weeks without connectivity**

**Daily operations:**
- Branch operates normally using passbooks and slips
- Daily ledger updated at close of business
- Scrip inventory tracked carefully
- Members understand balances are "as of branch records"

**Weekly summary:**
- Count total transactions
- Verify slip serial number sequence (detect missing slips)
- Check for duplicate slips (fraud detection)
- Administrator reviews large/unusual transactions
- Prepare reconciliation batch for when connectivity returns

**When connectivity returns:**
- May have hundreds of slips to enter
- Batch entry tool: scan slip serial numbers, enter data
- Automated reconciliation checks for conflicts
- Digital ledger becomes authoritative again after reconciliation
- Members notified if any balance adjustments needed

---

### Scenario 3: Permanent Offline Operation (Intentionally Disconnected Society)

**Some societies may choose to operate permanently offline.**

**Setup:**
- Digital system used only for initial member account creation
- After setup: export full member roster, freeze digital ledger
- Branch operates 100% on paper from that point
- Passbooks are **the** ledger, not a copy

**Periodic reporting:**
- Quarterly: branch submits summary reports to Governance
- Assembly reviews financial reports from paper records
- Demurrage calculated manually, recorded in special periodic slips
- Birthday issuance: manual slips from Treasury to member accounts

**Re-connection (if ever):**
- Massive reconciliation project
- Likely: freeze digital ledger entirely, rebuild from paper records
- Or: treat as fresh start, digital ledger abandoned

---

## Reconciliation Procedures

### Slip Entry Process

**When connectivity returns after offline period:**

1. **Gather slips:**
   - Collect all slips from offline period
   - Verify serial number sequence
   - Flag missing or duplicate serial numbers

2. **Batch entry:**
   - Teller logs into digital system with `teller` permission
   - Accesses "offline slip entry" mode
   - For each slip:
     - Scan or enter slip serial number
     - System checks: already entered?
     - Enter: from handle, to handle, currency, amount, date, memo
     - System validates: accounts exist, proper format
     - Mark as entered

3. **Automated reconciliation:**
   - System compares slip transactions to any digital transactions during same period
   - Flags conflicts: same accounts, similar amounts, overlapping times
   - Presents flagged conflicts to administrator

4. **Conflict resolution:**
   - Administrator reviews each flag
   - Determines: which is authoritative? (Usually: paper slip wins)
   - Adjusts digital ledger to match paper record
   - Logs resolution with explanation

5. **Verification:**
   - Generate reconciliation report
   - Compare total balances: paper vs digital
   - If discrepancies remain: manual investigation
   - Administrator signs off when satisfied

### Handling Conflicting Records

**Conflict types:**

**Type 1: Duplicate transaction**
- Same transaction appears in both paper and digital records
- Resolution: Mark digital transaction as duplicate, adjust balances

**Type 2: Contradictory transactions**
- Paper shows Alice → Bob 100F
- Digital shows Alice → Carol 100F (same time, same amount)
- Resolution: Paper is authoritative. Digital transaction reversed, paper transaction posted.

**Type 3: Balance mismatch**
- Paper shows Bob balance: 1,234F
- Digital shows Bob balance: 1,180F
- Resolution: Trace transaction by transaction to find divergence point. Administrator creates correction entry with detailed memo.

**General rule: Paper wins during offline periods.**
The physical slip with signatures is legal proof. Digital records are corrected to match properly executed paper transactions.

---

## Fraud Prevention

### Offline Fraud Risks

**Risk 1: Counterfeit slips**
- Mitigation: Pre-numbered slips with security features (watermarks, special paper)
- Tellers verify slip serial numbers are in expected sequence
- Report suspicious slips immediately

**Risk 2: Forged signatures**
- Mitigation: Tellers know community members personally
- Large transactions require additional verification
- Member signature compared to signature on file (in printed roster)

**Risk 3: Double-spend**
- Member uses passbook at Branch A, then quickly travels to Branch B with old balance
- Mitigation: Daily slip logs shared between branches when possible
- Passbook stamped with branch location and date
- Suspicious activity flagged during reconciliation

**Risk 4: Collusion (member + teller)**
- Teller and member fabricate high-value slips
- Mitigation: Daily ledger reviewed by administrator
- Peer tellers cross-check each other's work
- Suspicious patterns trigger audit (same member, same teller, unusual amounts)

**Risk 5: Lost/stolen passbooks**
- Thief presents stolen passbook, claims to be owner
- Mitigation: Teller verifies identity (photo ID, personal knowledge)
- Member can report passbook lost, flagged in system/printed roster
- Replacement passbook issued with notation

---

## Equipment and Supplies

### Minimum Branch Requirements

**Furniture:**
- Teller counter or desk
- Lockable drawer for scrip and slips
- Filing cabinet for slip archive
- Safe for overnight scrip storage

**Paper supplies:**
- Transaction slip books (carbonless, pre-numbered) — 6 months supply
- Passbooks (blank) — 100 per 1000 members
- Branch ledger books (bound, numbered pages) — 2 per year
- Printed membership roster — updated monthly
- Carbon paper (backup if carbonless runs out)

**Writing implements:**
- Pens (permanent ink, multiple colors for different tellers)
- Stamps (Community Bank seal, date stamp, "VOID" stamp)
- Rubber signature stamps for frequently-used teller signatures

**Optional digital (battery powered):**
- Calculator (solar powered preferred)
- Barcode scanner for passbook UUIDs
- Portable printer for generating new passbooks

**Security:**
- Lockbox for overnight slip storage
- Safe for scrip reserves
- Security seal tape for daily slip batches
- Witness log for opening safe

---

## Training Materials

### Teller Training: Offline Operations

**Module 1: Passbook transactions**
- How to read a passbook
- Writing clear, legible entries
- Calculating new balances
- Stamping and initialing
- Obtaining member signature

**Module 2: Physical slips**
- When to use which slip type
- Completing all required fields
- Writing amounts in words
- Obtaining proper signatures
- Filing slips correctly

**Module 3: Identity verification**
- Using printed membership roster
- When to require photo ID
- When to require vouching
- Recognizing fraud indicators
- Escalation procedures

**Module 4: Reconciliation**
- Counting scrip drawer
- Daily ledger closeout
- Preparing slip batches
- Entering slips into digital system
- Resolving discrepancies

**Module 5: Fraud prevention**
- Recognizing suspicious behavior
- Verifying slip serial numbers
- Cross-checking large transactions
- Reporting concerns
- Audit procedures

---

## Integration with Digital System

### Database Schema Additions

**Slip tracking table:**
```sql
CREATE TABLE IF NOT EXISTS physical_slip (
  serial_number      TEXT PRIMARY KEY,
  entered_at         TEXT NULL,        -- When entered into digital system
  entered_by_uuid    TEXT NULL,        -- Teller who entered it
  transaction_uuid   TEXT NULL,        -- Linked digital transaction
  reconciliation_status TEXT NOT NULL DEFAULT 'pending', -- pending, entered, conflict, resolved
  conflict_notes     TEXT NULL,
  batch_id           TEXT NULL         -- Which batch it was reconciled in
);
```

**Passbook table:**
```sql
CREATE TABLE IF NOT EXISTS passbook (
  passbook_number    TEXT PRIMARY KEY,
  account_uuid       TEXT NOT NULL REFERENCES account(uuid),
  issued_at          TEXT NOT NULL,
  issued_by_uuid     TEXT NOT NULL,
  replaced_at        TEXT NULL,
  replaced_by_number TEXT NULL,       -- New passbook that replaced this one
  status             TEXT NOT NULL DEFAULT 'active' -- active, full, lost, replaced
);
```

**Reconciliation batch table:**
```sql
CREATE TABLE IF NOT EXISTS reconciliation_batch (
  batch_id           TEXT PRIMARY KEY,
  offline_period_start TEXT NOT NULL,
  offline_period_end   TEXT NOT NULL,
  slips_entered        INTEGER NOT NULL,
  conflicts_found      INTEGER NOT NULL,
  conflicts_resolved   INTEGER NOT NULL,
  reconciled_by_uuid   TEXT NOT NULL,
  reconciled_at        TEXT NOT NULL,
  notes                TEXT NULL
);
```

### Teller UI: Offline Slip Entry

**New route: `/teller/slip-entry`**

**Features:**
- Scan or type slip serial number
- Auto-check if already entered
- Form fields: from, to, currency, amount, date, memo
- Real-time validation (accounts exist, amounts valid)
- Mark slip as entered
- Display running count for current session
- Generate batch report at end of session

**Batch reconciliation report shows:**
- Slip serial number range
- Number of slips entered
- Total Franks moved (debits, credits)
- Total Florens moved (debits, credits)
- Any conflicts flagged
- Any slips skipped (missing serial numbers)

### Administrator UI: Conflict Resolution

**New route: `/admin/reconciliation`**

**Displays:**
- List of flagged conflicts
- For each: paper record vs digital record side-by-side
- Options: 
  - Paper is authoritative (reverse digital, post paper)
  - Digital is authoritative (mark paper as error)
  - Both valid (correction entry needed)
- Required memo field explaining resolution
- Confirmation before applying

---

## Operational Policies

### Branch Hours

**Recommended:**
- Regular hours: coincide with marketplace days/hours
- Extended hours: before holidays, paydays
- Emergency hours: administrator can open branch for urgent needs

**Closed-branch protocol:**
- Member can slip envelope with completed slip + passbook under door
- Administrator processes next business day
- Updates passbook, returns via mail or holds for pickup

### Transaction Limits (Offline)

**Risk-based limits when operating offline:**

**Low risk (teller knows member, small amount):**
- Up to 500 Franks or 100 Florens
- Simple identity check

**Medium risk (unknown member or larger amount):**
- 500-2,000 Franks or 100-500 Florens
- Photo ID required
- Confirm address from roster

**High risk (large transfer):**
- Over 2,000 Franks or 500 Florens
- Photo ID + one voucher
- Administrator notified same day
- Flagged for extra scrutiny during reconciliation

**When online:**
- No special limits (system enforces digital limits)
- Immediate balance checks available

### Record Retention

**Physical slips:**
- Original (white copy): permanent archive, 7+ years
- Member receipt (yellow copy): member keeps indefinitely

**Passbooks:**
- Active: member possession
- Replaced: archived by branch, 7+ years
- Lost/stolen: report filed, 7+ years

**Branch ledgers:**
- Permanent archive
- Digitized when possible
- Critical legal record

**Reconciliation reports:**
- Permanent archive
- Reviewed during annual audit

---

## Future Enhancements

### Phase 1 (MVP): Basic offline operations
- Passbooks issued
- Physical slips in use
- Manual reconciliation process
- Printed membership roster

### Phase 2: Enhanced tooling
- Barcode scanning for passbooks and slips
- Portable battery-powered devices for tellers
- Automated slip-to-digital entry (OCR)
- Mobile teller kits for market days

### Phase 3: Physical scrip
- Design and print Floren scrip
- Scrip drawer management tools
- Counterfeit detection features
- Scrip redemption process

### Phase 4: Multi-branch coordination
- Branch-to-branch slip reconciliation
- Shared offline transaction log
- Inter-branch scrip movement tracking
- Network of physical branches

---

## Conclusion

The offline branch system ensures the Community Bank is resilient, inclusive, and independent of digital infrastructure. By maintaining parallel paper and digital records with clear reconciliation procedures, the bank can serve all members regardless of technology access while preserving transaction integrity.

**Key principles:**
1. Paper is authoritative during offline periods
2. Every transaction creates verifiable record (slip + passbook)
3. Reconciliation is systematic and auditable
4. Fraud prevention through community knowledge and cross-checks
5. Multiple verification methods for identity and transactions

This design allows societies to operate with full financial services even when completely disconnected from the internet or digital systems.
