# The Ben Franklin Society
## Inter-Society Banking
### Design Document

---

## Overview

Franks are fungible across all Ben Franklin Society communities. A member of Society A can send Franks directly to a member of Society B, and 1 Frank is worth 1 Frank regardless of which society issued it.

The system uses a **correspondent banking model**: each Community Bank maintains a special Clearinghouse Account that acts as a running tab of the society's net position across all inter-society activity. The Federation's clearinghouse service tracks net bilateral positions and issues rebalancing instructions when imbalances grow large. Societies communicate directly for transfers; the Federation handles reconciliation and rebalancing, not individual transaction routing.

This model is designed to be:
- **Resilient** — if the Federation is offline, transfers still settle between the two societies and are reconciled when it returns.
- **Hard to game** — fabricating a transfer requires two independent ledgers (at both societies) to agree. The Federation cross-verifies both.
- **Auditable** — every inter-society transfer is recorded on two local ledgers and reported to the Federation.

---

## The Clearinghouse Account

Every Community Bank has exactly one Clearinghouse Account. It is an ordinary account in the data model — a row in `account` — but carries special significance:

- Its `principal_uuid` is the society's own UUID (registered at the Federation)
- It functions like a nostro account in correspondent banking: its balance reflects the society's net position against the federation as a whole
- A **negative balance** means the society has been a net exporter of Franks (sent more out than received) — it is in deficit
- A **positive balance** means the society has received more than it has sent — it is in surplus
- There is one Clearinghouse Account per society, not one per neighbor pair — the bilateral positions are tracked by the Federation, not locally

When a member sends Franks to another society, both the sender's account and the Clearinghouse Account are debited. When a member receives Franks from another society, both the recipient's account and the Clearinghouse Account are credited. The Clearinghouse Account balance is the live, continuously-updated net position.

---

## Society Identity and Authentication

Each society has an asymmetric keypair used to sign and verify inter-society messages.

- The **private key** is held by the Governance app outside the database (same pattern as MFA secrets — encrypted at rest, never stored in the DB)
- The **public key** is registered with the Federation at society setup time
- Neighboring societies cache each other's public keys locally (in the `neighboring_society` table) when introduced by the Federation
- Public keys are refreshed from the Federation periodically and whenever a verification fails unexpectedly

Every inter-society message — transfer requests, acknowledgements, reconciliation reports — is signed by the sending society's private key and verified by the recipient against the cached public key before any action is taken. An unverifiable signature is rejected outright.

---

## Transfer Flow: Direct Neighbors

When both societies know each other (both appear in each other's `neighboring_society` table):

1. **Initiation** — the sender enters a transfer to `handle@remote-society` in their Community Bank UI. The app looks up `remote-society` in `neighboring_society` to get the endpoint and confirms the neighbor is reachable.

2. **Fee calculation and deduction** — Society A calculates imbalance fee (if applicable):
   - Checks bilateral position with Society B
   - If outside balanced zone and past grace period: calculates daily fee on excess
   - Deducts Society A's share from transfer amount
   - Forwards fee to Federation pool
   - Updates transfer payload with gross amount, fee, and net amount

3. **Send** — Society A signs the transfer payload (sender UUID, recipient handle, gross amount, fee deducted, net amount, bilateral position, timestamp, nonce) with its private key and sends it directly to Society B's Community Bank API.

4. **Receipt, verification, and credit** — Society B verifies the signature. If valid, it:
   - Independently calculates expected imbalance fee based on bilateral position
   - Verifies Society A's fee calculation matches (rejects if wrong)
   - Deducts Society B's share of imbalance fee from net amount
   - Forwards Society B's fee to Federation pool
   - Resolves the recipient handle to a local `account`
   - Credits the recipient's account: +final amount (after both fees)
   - Credits Society B's Clearinghouse Account: +final amount
   - Records an `inter_society_transfer` row (`status = received`)
   - Returns a signed acknowledgement to Society A with final credited amount

5. **Debit** — Society A receives and verifies the acknowledgement. It then:
   - Debits the sender's account: −gross amount
   - Debits Society A's Clearinghouse Account: −gross amount
   - Records an `inter_society_transfer` row (`status = settled`)

6. **Reporting** — both societies independently report the completed transfer to the Federation (asynchronously). The Federation cross-verifies that both reports match and that fees were correctly calculated and forwarded.

The debit does not happen until the signed acknowledgement is received. The sender's Franks are not debited speculatively — if Society B is offline or rejects the transfer, nothing changes on Society A's ledger. Fee verification failure is treated like signature verification failure: immediate rejection.

---

## Contact Discovery

Before a transfer can proceed, the recipient's society must be present in Society A's `neighboring_society` table. If it is not, Society A performs a **contact discovery** lookup first:

1. **Federation lookup** — Society A queries the Federation for the recipient society's contact details: endpoint, public key, and coordinates. The Federation returns the record if the society is a registered, active federation member.
2. **Cache locally** — Society A writes the society to its `neighboring_society` table.
3. **Transfer proceeds** — the transfer then continues exactly as the [direct neighbor flow](#transfer-flow-direct-neighbors).

### Federation Unavailable

If the clearinghouse is unreachable when Society A needs to discover a new society:

1. Society A asks one or more known neighbors (already in `neighboring_society`) whether they have contact details for the target society
2. A neighbor that knows the target society returns the details, including its cached public key
3. Society A accepts these details provisionally and caches them in `neighboring_society`
4. The transfer proceeds as normal using the peer-provided public key
5. When the clearinghouse is next reachable, Society A verifies the cached public key against the authoritative registry. If they differ, the row is updated and flagged for administrator review.

Peer gossip of contact details is an availability optimization — it does not weaken security. Signature verification still occurs on every message and the Federation remains the authoritative source for public keys.

---

## Pending Transfers

If Society B is offline when Society A attempts a transfer:

- Society A records an `inter_society_transfer` row with `status = pending`
- The sender's account is placed in a soft hold for the pending amount — the balance appears reduced but the debit has not been posted to the ledger yet
- Society A retries on an exponential backoff schedule
- The sender sees the transfer as "pending" in their transaction history
- If the transfer does not settle within a configurable timeout, it is cancelled: the hold is released, the sender is notified, no ledger entries are made

A pending transfer that succeeds on retry proceeds through the normal flow from step 3 onward.

---

## Reconciliation

Periodically (and whenever either society requests it), the Federation reconciles reported transfers against both local records:

1. Each society pushes its inter-society transfer log to the Federation for the reconciliation window
2. The Federation matches transfers by their shared transaction reference (a UUID generated by Society A and included in both records)
3. Discrepancies are flagged:
   - **One-sided**: Society A reports a transfer that Society B has no record of (or vice versa)
   - **Amount mismatch**: both report the transfer but with different amounts (should be impossible if signatures were verified, but caught here as a final check)
4. Flagged discrepancies are held for human review by Community Bank Service administrators at both societies and at the Federation

A well-functioning pair of societies should have zero discrepancies. Discrepancies indicate a software bug, a network failure that wasn't recovered, or an attempted fraud.

---

## Rebalancing: Bilateral Bancor Mechanism

Large bilateral imbalances are economically unhealthy: surplus societies accumulate unused Franks while deficit societies face liquidity constraints. Inspired by Keynes's Bancor proposal, the system applies **symmetric pressure** on both surplus and deficit positions to encourage gradual rebalancing.

### The Problem with One-Sided Pressure

Traditional approach (penalties only on deficit):
- Deficit society pays interest/fees
- Surplus society has no incentive to reduce surplus
- Results in: deficits forced to contract, surpluses continue accumulating
- Deflationary bias (hurts deficit economies disproportionately)

**Bancor insight:** Both extreme surplus and extreme deficit indicate imbalanced trade. Both should face pressure to rebalance.

### How Bilateral Bancor Works

Each bilateral relationship has a **balanced trade zone** centered on zero. Positions outside this zone for extended periods incur **imbalance fees** paid by both parties.

**Balanced zones by relationship maturity:**
```
New relationship (<1 year):     ±10,000 Franks (narrow tolerance)
Established relationship (1-5): ±25,000 Franks (moderate tolerance)  
Mature relationship (5+):       ±50,000 Franks (wide tolerance)
```

**Grace period:** 90 days outside balanced zone before fees begin. Short-term imbalances are normal and healthy.

**After grace period expires:** Both societies in the imbalanced pair pay demurrage fees based on the imbalance size.

### Fee Structure

**Imbalance fee calculation (monthly):**
```javascript
function calculateBilateralImbalanceFee(position, balancedZone, daysImbalanced) {
  const imbalance = Math.abs(position);
  
  // No fee within balanced zone
  if (imbalance <= balancedZone) return 0;
  
  // Grace period: first 90 days imbalanced
  if (daysImbalanced < 90) return 0;
  
  const excess = imbalance - balancedZone;
  
  // Progressive demurrage (monthly rate on excess):
  // 0.5% on first 30k excess
  // 1.0% on next 50k excess
  // 2.0% on anything above 80k excess
  
  let monthlyRate = 0;
  if (excess <= 30000) {
    monthlyRate = 0.005;
  } else if (excess <= 80000) {
    monthlyRate = 0.005 + ((excess - 30000) / excess) * 0.005;
  } else {
    monthlyRate = 0.01 + ((excess - 80000) / excess) * 0.01;
  }
  
  return Math.floor(excess * monthlyRate);
}
```

**Example: Atlanta ↔ Columbus**
```
Bilateral position:
- Atlanta: -85,000 Franks (deficit)
- Columbus: +85,000 Franks (surplus)

Balanced zone for mature relationship: ±50,000
Imbalance: 85,000 (outside zone by 35,000)
Days imbalanced: 120 days (past grace period)

Monthly imbalance fee: 35,000 × 0.5% = 175 Franks

BOTH societies pay:
- Atlanta pays 175 Franks/month to Federation pool
- Columbus pays 175 Franks/month to Federation pool
- Total: 350 Franks/month collected from imbalanced pair
```

### Where Do Fees Go?

**Federation Rebalancing Pool:**
- Collects all imbalance fees from unbalanced pairs
- Redistributes monthly to societies maintaining balanced trade
- Formula: Your share = (Your balanced relationships / Total balanced relationships)

**Example distribution:**
```
Month's collection: 50,000 Franks from various imbalanced pairs

Societies with all relationships in balanced zone:
- Philadelphia: 12 balanced relationships → 12/200 = 6% → 3,000 Franks
- Boston: 8 balanced relationships → 8/200 = 4% → 2,000 Franks
- Denver: 10 balanced relationships → 10/200 = 5% → 2,500 Franks
...

Network total: 200 balanced relationships
Each society rewards proportional to balanced trade maintenance
```

**Benefits:**
- **Rewards balanced trade** — societies maintaining balance earn rebates
- **Penalizes extreme positions** — both surplus and deficit pay costs
- **Funds mutual aid** — pool can also fund emergency assistance
- **Symmetric pressure** — neither party is "blamed," both incentivized to negotiate

### How Fees Create Rebalancing Pressure

**On deficit society (Atlanta at -85k):**
- Pays 175 Franks/month demurrage
- Incentivized to: export more goods/services to Columbus, reduce imports from Columbus
- Or: negotiate direct Frank transfer from surplus elsewhere
- Or: accept short-term credit line with Columbus (interest cheaper than demurrage)

**On surplus society (Columbus at +85k):**
- Pays 175 Franks/month demurrage
- Has 85k Franks "sitting idle" earning negative return
- Incentivized to: import more from Atlanta, invest in Atlanta businesses, extend credit line to Atlanta
- Or: transfer surplus to a society where Columbus has deficit (network-wide rebalancing)

**Both parties want to fix it.** The fee doesn't care whose "fault" the imbalance is. Both have skin in the game.

### Rebalancing Mechanisms

**1. Natural trade adjustment:**
```
Atlanta increases exports to Columbus (earns Franks)
Columbus increases imports from Atlanta (spends Franks)
→ Position drifts toward balance
→ Fees decrease, then disappear when back in balanced zone
```

**2. Direct Frank transfer (debt settlement):**
```
Columbus has surplus Franks sitting idle, paying demurrage
Atlanta wants to reduce deficit to stop demurrage

Negotiation:
- Columbus transfers 35,000 Franks to Atlanta (gift or loan)
- Atlanta's position: -85k → -50k (back in balanced zone)
- Columbus's position: +85k → +50k (back in balanced zone)
- Both stop paying demurrage
```

**3. Triangular rebalancing:**
```
Atlanta deficit with Columbus: -85k (paying demurrage)
Atlanta surplus with Denver: +60k (paying demurrage on other side)
Columbus deficit with Denver: -40k

Solution:
- Atlanta sends 35k Franks to Columbus (fixes Atlanta-Columbus)
- Denver sends 25k Franks to Columbus (fixes Denver-Columbus)
- Atlanta sends 25k Franks to Denver (fixes Atlanta-Denver)
→ All three pairs closer to balance
→ Federation can help discover/coordinate these triangular settlements
```

**4. Credit line with interest:**
```
Columbus extends 35k Frank credit line to Atlanta
- Interest: 1.5%/month (cheaper than 2× demurrage)
- Term: 6 months
- Effect: Position improves immediately, Atlanta pays interest instead of demurrage
- Columbus earns interest income instead of paying demurrage
- Win-win until Atlanta can rebalance through trade
```

### Structural Enforcement: Automatic Fee Deduction

The imbalance fee is **not billed** — it's **automatically deducted from every inter-society transfer** like a progressive processing fee. This makes it structurally impossible to ignore.

**How it works:**

When Atlanta sends 1000 Franks to Columbus (position: -80k, 30k outside ±50k balanced zone):

```
Step 1: Atlanta's bank calculates daily imbalance fee
- Position: -80,000 Franks (30,000 excess beyond ±50k zone)
- Atlanta's daily fee: 30,000 × 0.5% / 30 days = ~5 Franks/day
- Atlanta pays half: 2.5 Franks (Columbus pays other half)

Step 2: Atlanta's bank deducts fee from transfer
- Transfer amount: 1000 Franks
- Atlanta's fee deduction: -2.5 Franks
- Net sent to Columbus: 997.5 Franks
- Fee forwarded to Federation pool: 2.5 Franks

Step 3: Transfer payload sent to Columbus
{
  "sender": "alice@atlanta",
  "recipient": "bob@columbus", 
  "gross_amount": 1000,
  "atlanta_fee": 2.5,
  "net_amount": 997.5,
  "bilateral_position": -80000,
  "balanced_zone": 50000,
  "signature": "..."
}

Step 4: Columbus's bank verifies and deducts its own fee
- Recalculates: position +80k, 30k excess, Columbus owes 2.5 Franks/day
- Verifies Atlanta's calculation matches
- Deducts Columbus's share: 997.5 - 2.5 = 995 Franks
- Credits recipient bob@columbus: 995 Franks
- Forwards Columbus's fee to Federation: 2.5 Franks

Step 5: Both banks report to Federation
- Total collected: 5 Franks (2.5 from Atlanta + 2.5 from Columbus)
- Added to monthly rebalancing pool
- Federation tracks for end-of-month distribution
```

**Recipient sees:**
```
Transfer from alice@atlanta: 995 Franks
  Gross amount: 1000 Franks
  Atlanta imbalance fee: -2.5 Franks
  Columbus imbalance fee: -2.5 Franks
  Net received: 995 Franks
```

**Why this is structural:**

1. **Extracted from money flow** — fee comes out of every transfer automatically, not billed later
2. **Peer-verified** — Columbus independently calculates and verifies Atlanta's fee deduction, rejects if wrong
3. **Bilateral enforcement** — both banks must agree on calculation for transfer to succeed
4. **Continuous pressure** — every transaction costs more when imbalanced, immediate feedback
5. **Can't avoid** — only way to avoid fees is to rebalance or stop trading (which defeats the purpose)
6. **Progressive friction** — worse the imbalance, more expensive every transfer becomes
7. **Transparent** — transfer payload shows gross amount + fees + net amount

**Properties:**

- **Grace period still applies**: first 90 days outside balanced zone have zero fee deduction
- **Small transfers protected**: minimum fee is 0.01 Franks (transfers <2 Franks have negligible fees)
- **Same total fee regardless of splitting**: sending 1000 Franks as 1 transfer or 100×10 Frank transfers costs the same total fee
- **Real-time calculation**: based on current bilateral position at moment of transfer
- **Automatic forwarding**: both banks forward collected fees to Federation immediately

**Example: Imbalance gets worse**

If position drifts to -95k (45k excess beyond ±50k):
```
Daily fee rises to: 45,000 × 0.75% / 30 days ≈ 11.25 Franks/day
Per-transfer fee on 1000 Franks: 11.25/2 ≈ 5.6 Franks from Atlanta, 5.6 from Columbus
Recipient receives: 1000 - 5.6 - 5.6 = 988.8 Franks

Every transfer now 1.1% more expensive
Strong incentive to rebalance before position worsens
```

**Example: Back in balanced zone**

If societies rebalance to -45k (inside ±50k zone):
```
Imbalance fee: 0 Franks
Transfer of 1000 Franks delivers full 1000 Franks
No friction, normal trading resumes
Both societies stop hemorrhaging fees
```

**This makes rebalancing economically rational:**
- Imbalanced trade becomes progressively more expensive
- Every transaction reminds both parties of the cost
- Rebalancing instantly removes the fee drag
- Natural market pressure without central mandates

### Federation's Role

**Monitoring:**
- Tracks all bilateral positions (reported by societies after each transfer)
- Maintains Rebalancing Pool (receives automatic fee forwards)
- Calculates monthly distributions to balanced societies
- Publishes network-wide imbalance statistics (anonymized)

**Coordination (optional):**
- Identifies triangular rebalancing opportunities
- Suggests credit line arrangements between imbalanced pairs
- Facilitates multi-party settlement negotiations
- Helps societies discover rebalancing strategies

**Does NOT:**
- Bill or collect fees (fees auto-deducted and forwarded by societies)
- Mandate specific rebalancing actions
- Force transfers
- Dictate trade policy
- Punish societies (fees are automatic protocol, not punishment)

### Integration with Circuit Breakers

The imbalance fees work alongside circuit breakers:

**Circuit breakers** (immediate, hard limits):
- Prevent catastrophic drain
- Bilateral deficit limits (-50k max)
- Total deficit limits (-100k max)
- Emergency protection

**Imbalance fees** (gradual, soft pressure):
- Encourage healthy trade balance
- Create economic incentive to rebalance
- Reward balanced trade
- Long-term sustainability

**Example:**
```
Atlanta ↔ Columbus:
- Bilateral limit: -100,000 (hard stop)
- Balanced zone: ±50,000 (fee-free)
- Grace period: 90 days

Atlanta drifts to -60k:
→ Outside balanced zone, grace period starts
→ No fees yet, no transfer blocks

Day 90 at -60k:
→ Imbalance fees begin: ~50 Franks/month
→ Still plenty of room before -100k hard limit
→ Gradual pressure to rebalance

Atlanta drifts to -95k:
→ Imbalance fees: ~450 Franks/month (painful)
→ Approaching -100k hard limit
→ Strong incentive to act before hitting limit

Atlanta tries to hit -100k:
→ Transfers blocked by circuit breaker
→ Cannot get worse
→ Must rebalance to resume normal operations
```

### Default Configuration

```javascript
const BANCOR_CONFIG = {
  // Balanced zones (fee-free bands)
  balancedZone: {
    newRelationship: 10000,      // <1 year
    established: 25000,          // 1-5 years  
    mature: 50000                // 5+ years
  },
  
  // Grace period before fees begin
  gracePeriodDays: 90,
  
  // Progressive fee rates (monthly on excess)
  feeSchedule: [
    { upTo: 30000, rate: 0.005 },   // 0.5%
    { upTo: 80000, rate: 0.010 },   // 1.0%  
    { above: 80000, rate: 0.020 }   // 2.0%
  ],
  
  // Fee collection and distribution
  billingPeriod: 'monthly',
  distributionFormula: 'proportional_to_balanced_relationships',
  
  // Integration with circuit breakers
  enforceWithCircuitBreakers: true
};
```

### Why This Works

**Addresses root cause:**
- Imbalanced trade is usually result of mismatched supply/demand
- Fees create immediate economic signal to both parties
- Self-correcting: more imbalance → higher fees → stronger incentive

**Symmetric and fair:**
- No moral judgment about "good creditors" vs "bad debtors"
- Both parties have equal responsibility to maintain balance
- Reflects Keynes's insight: extreme positions hurt the network

**Distributed and voluntary:**
- No central authority forcing rebalancing
- Societies choose how to respond (trade, transfer, credit, triangular)
- Market mechanisms work faster than mandates

**Gradual and forgiving:**
- Grace period allows short-term imbalances
- Fees start small, grow with severity and duration
- Many options to rebalance before hitting hard limits

**Network effects:**
- Rewards societies maintaining balanced trade
- Creates liquidity in Rebalancing Pool for mutual aid
- Encourages multi-party settlements (triangular rebalancing)
- Mature network has many balanced relationships, few extreme positions

The result: **bilateral imbalances are economically expensive for both parties**, creating strong incentive to maintain roughly balanced trade over time. Combined with circuit breakers, the system prevents catastrophic drain while encouraging healthy economic behavior through price signals rather than mandates.

---

## Data Model Implications

This design requires the following additions or extensions to the existing data model:

### In Governance (`neighboring_society` — already planned)
Extensions needed for circuit breakers and Bancor rebalancing:
- `public_key_cache` — the neighbor's public key, cached locally for signature verification
- `bilateral_deficit_limit` — maximum negative balance with this neighbor (default: 100,000 Franks)
- `bilateral_deficit_warning` — warning threshold (default: 75,000 Franks)
- `balanced_zone_limit` — fee-free zone around zero (default: 50,000 Franks for mature relationships)
- `relationship_established_at` — when relationship began (determines balanced_zone_limit)

### In Community Bank (new table: `inter_society_transfer`)
One row per inter-society transfer, on both the sending and receiving side.

| Column | Type | Description |
|---|---|---|
| `uuid` | TEXT | PRIMARY KEY |
| `transaction_ref` | TEXT | UNIQUE — shared reference generated by the initiating society, used for Federation reconciliation |
| `direction` | TEXT | `outbound` (we sent) or `inbound` (we received) |
| `remote_society_handle` | TEXT | The counterparty society |
| `local_account_uuid` | TEXT | FK → `account.uuid` — the sender's or recipient's local account |
| `clearinghouse_account_uuid` | TEXT | FK → `account.uuid` — this society's Clearinghouse Account |
| `gross_amount` | INTEGER | In Franks — original transfer amount before fees |
| `our_imbalance_fee` | INTEGER | Fee deducted by our society for bilateral imbalance |
| `their_imbalance_fee` | INTEGER | Fee deducted by counterparty society (reported in acknowledgement) |
| `net_amount` | INTEGER | Final amount after both fees: gross_amount - our_fee - their_fee |
| `bilateral_position_at_transfer` | INTEGER | Our position with counterparty at time of transfer |
| `status` | TEXT | `pending`, `settled`, `failed`, `cancelled` |
| `initiated_at` | DATETIME | When the transfer was first attempted |
| `settled_at` | DATETIME | When both sides confirmed |
| `transaction_uuid` | TEXT | FK → `transaction.uuid` — set when the ledger entries are posted |
| `failure_reason` | TEXT | Set if status = failed or cancelled |

### In Community Bank (Clearinghouse Account)
The Clearinghouse Account is an ordinary `account` row. Its `name` is `Clearinghouse` and its `principal_uuid` is the society's own UUID. No new table is needed — just a known special account like Treasury.

### In Community Bank (new table: `bilateral_position`)
Tracks the net position with each trading partner for Bancor rebalancing.

| Column | Type | Description |
|---|---|---|
| `neighbor_handle` | TEXT | PRIMARY KEY — the counterparty society |
| `current_balance` | INTEGER | Net position: positive = surplus, negative = deficit (in Franks) |
| `balance_zone_limit` | INTEGER | Fee-free band around zero (±50,000 for mature relationships) |
| `first_imbalanced_at` | DATETIME | When position first exceeded balanced_zone_limit (NULL if in zone) |
| `grace_period_expires_at` | DATETIME | When imbalance fees begin (90 days after first_imbalanced_at) |
| `last_updated_at` | DATETIME | When balance was last recalculated |

This is a derived/cached table — the authoritative balance is the Clearinghouse Account. Updated after each inter-society transfer.

### In Community Bank (new table: `imbalance_fee`)
Tracks monthly imbalance fees assessed for Bancor rebalancing.

| Column | Type | Description |
|---|---|---|
| `uuid` | TEXT | PRIMARY KEY |
| `billing_period` | TEXT | Month assessed (YYYY-MM format) |
| `neighbor_handle` | TEXT | The counterparty in the imbalanced pair |
| `position_at_assessment` | INTEGER | Balance at time of assessment (in Franks) |
| `excess_over_zone` | INTEGER | Amount beyond balanced_zone_limit |
| `days_imbalanced` | INTEGER | Days outside balanced zone |
| `fee_amount` | INTEGER | Demurrage fee in Franks |
| `assessed_at` | DATETIME | When fee was calculated |
| `paid_at` | DATETIME | When transferred to Federation pool (NULL if unpaid) |
| `transaction_uuid` | TEXT | FK → `transaction.uuid` — ledger entry for fee payment |

### In Community Bank (new table: `rebalancing_pool_distribution`)
Tracks rewards received from Federation pool for maintaining balanced trade.

| Column | Type | Description |
|---|---|---|
| `uuid` | TEXT | PRIMARY KEY |
| `distribution_period` | TEXT | Month distributed (YYYY-MM format) |
| `balanced_relationships_count` | INTEGER | How many of our relationships were in balanced zone |
| `network_total_balanced` | INTEGER | Total balanced relationships across network |
| `pool_total` | INTEGER | Total Franks in pool for distribution |
| `our_share` | INTEGER | Franks received: (our_balanced / network_total) × pool |
| `received_at` | DATETIME | When Federation transferred reward |
| `transaction_uuid` | TEXT | FK → `transaction.uuid` — ledger entry crediting account |

### In Federation (new table: `network_bilateral_positions`)
Federation's view of all bilateral positions for calculating fees and identifying rebalancing opportunities.

| Column | Type | Description |
|---|---|---|
| `society_a_handle` | TEXT | First society in pair (alphabetically) |
| `society_b_handle` | TEXT | Second society in pair (alphabetically) |
| `a_position` | INTEGER | Society A's net position (positive = surplus, negative = deficit) |
| `b_position` | INTEGER | Society B's net position (should equal -a_position) |
| `balanced_zone` | INTEGER | Fee-free band for this relationship |
| `grace_expires_at` | DATETIME | When fees begin (NULL if in balanced zone) |
| `last_updated_at` | DATETIME | When position was last updated |
| `PRIMARY KEY` | | `(society_a_handle, society_b_handle)` |

### In Federation (new table: `rebalancing_pool`)
Tracks the Federation's pool of collected imbalance fees and distributions.

| Column | Type | Description |
|---|---|---|
| `uuid` | TEXT | PRIMARY KEY |
| `transaction_type` | TEXT | `fee_collected` or `reward_distributed` |
| `period` | TEXT | Billing/distribution period (YYYY-MM) |
| `society_handle` | TEXT | Society paying fee or receiving reward |
| `amount` | INTEGER | Franks collected or distributed |
| `transaction_at` | DATETIME | When transaction occurred |
| `balance_after` | INTEGER | Pool balance after this transaction |

---

## Security Properties

- **Signature verification** — every inter-society message is signed and verified. A message that cannot be verified against the sender's registered public key is rejected before any state change.
- **Two-ledger corroboration** — a fraudulent transfer requires two independent ledgers to agree. Society A cannot credit a member's account without Society B having a matching debit record (and vice versa), because the Federation cross-verifies both during reconciliation.
- **Nonce / replay protection** — each transfer payload includes a nonce. Society B rejects a payload whose nonce has already been seen, preventing replay attacks.
- **No speculative debits** — Society A does not post a debit until it receives a signed acknowledgement from Society B. There is no window in which Franks are in transit and unaccounted for.
- **Federation as auditor, not custodian** — the Federation never holds Franks. It cannot be robbed. Its failure degrades reconciliation and rebalancing, but not the ability to transact.

---

## Circuit Breakers: Preventing Economic Drain

While the security properties above prevent fraud, they do not prevent a society from being economically drained through legitimate transfers. A society could be stripped of its medium of exchange through:

- **Bad governance** — members voting to send large amounts to other societies
- **Economic attack** — coordinated external demand for goods/services draining Franks
- **Clearinghouse mismanagement** — failing to monitor position, allowing unlimited deficit
- **Compromise** — attacker with bank access approving large legitimate-looking transfers

**Structural protections prevent complete drain through bilateral and distributed mechanisms:**

### 1. Bilateral Credit Limits

Each pair of societies establishes a **maximum bilateral deficit** — the largest negative balance one society will accept from the other.

**How it works:**
```
Atlanta ↔ Columbus bilateral limit: -50,000 Franks

Current position: Atlanta owes Columbus 35,000 Franks

Atlanta member tries to send 20,000 Franks to Columbus member
→ Would put Atlanta at -55,000 (exceeds -50,000 limit)
→ Transfer REJECTED by Atlanta's bank before even sending

Columbus cannot extract more than 50,000 Franks net from Atlanta
```

**Key properties:**
- **Bilateral negotiation** — each pair agrees on limit based on trade volume, trust level
- **Symmetric or asymmetric** — Atlanta→Columbus limit can differ from Columbus→Atlanta limit
- **Locally enforced** — each society enforces its own deficit limit before sending
- **Distributed protection** — cannot be overridden by Federation or third party
- **Soft limit option** — can flag transfers that approach limit for governance review

**Database implementation:**
```sql
-- In neighboring_society table
ALTER TABLE neighboring_society ADD COLUMN bilateral_deficit_limit INTEGER DEFAULT 100000;
ALTER TABLE neighboring_society ADD COLUMN bilateral_deficit_warning INTEGER DEFAULT 75000;

-- Check before transfer
SELECT clearinghouse_balance_with_neighbor('columbus') < bilateral_deficit_limit;
```

**Benefits:**
- Distributes risk across many small exposures
- One compromised/hostile society can only drain up to limit
- Society maintains liquidity even if multiple neighbors hit limits

### 2. Total Deficit Circuit Breaker

Society sets a **maximum total deficit** across all trading partners. When breached, outbound transfers automatically halt until rebalancing occurs or governance overrides.

**How it works:**
```
Columbus total deficit limit: -200,000 Franks

Current clearinghouse balance: -185,000 Franks (summed across all neighbors)

Member tries to send 20,000 Franks outbound
→ Would put total at -205,000 (exceeds limit)
→ Transfer REJECTED
→ Member sees: "Society at deficit limit. Rebalancing in progress."
```

**Three-tier thresholds:**
- **Warning (80%)** — governance notified, no action required
- **Soft limit (95%)** — large transfers (>10,000 Franks) require officer approval
- **Hard limit (100%)** — all outbound transfers halted automatically

**Override mechanism:**
- Governance can vote to temporarily raise limit (emergency provision)
- Requires supermajority (2/3) and 24-hour deliberation
- Override expires after 30 days, reverts to configured limit

**Benefits:**
- Prevents society from being completely drained
- Maintains minimum liquidity for internal operations
- Automatic protection, no human intervention required
- Democratic override preserves sovereignty

### 3. Minimum Reserve Requirement

Society must maintain a **minimum positive clearinghouse balance** — cannot go below zero without explicit governance approval.

**How it works:**
```
Columbus minimum reserve: 50,000 Franks (configured by governance)

Current clearinghouse balance: +60,000 Franks

Member tries to send 15,000 Franks outbound
→ Would put balance at +45,000 (below 50,000 minimum)
→ Transfer REJECTED
→ Alternative: Transfer flagged for governance approval
```

**Two enforcement modes:**
- **Hard reserve** — cannot breach without governance vote (conservative)
- **Soft reserve** — can breach, but triggers warnings and review (flexible)

**Benefits:**
- Ensures society always has positive position
- Never becomes net debtor to network
- Psychologically reinforces fiscal discipline

### 4. Distributed Credit Lines (Mutual Aid)

Societies can establish **credit lines** with trusted peers, allowing temporary deficit beyond bilateral limit when needed.

**How it works:**
```
Atlanta ↔ Columbus:
- Bilateral limit: -50,000 Franks (normal trading)
- Credit line: additional -25,000 Franks (emergency buffer)
- Total available: -75,000 Franks

Columbus hits -50,000 deficit with Atlanta
→ Triggers credit line negotiation
→ Atlanta governance votes whether to extend credit
→ If approved: Columbus can go to -75,000
→ Credit line has interest terms: +500 Franks/month
→ Columbus must rebalance back above -50,000 within 90 days
```

**Credit line terms:**
- **Interest rate** — compensation for extending credit (typically 1-2% per month)
- **Maturity** — deadline to return to normal limit (30-180 days)
- **Collateral** — society may offer future trade commitments or services
- **Revocation** — creditor can revoke with notice if behavior degrades

**Benefits:**
- Provides liquidity during temporary imbalance
- Mutual aid prevents cascading failures
- Market mechanism (interest) encourages responsible use
- Distributed across many potential creditors (no central bank needed)

### 5. Velocity Limits

Maximum transfer rate per time period prevents rapid drain.

**How it works:**
```
Columbus velocity limits:
- Per-transfer: 50,000 Franks (single transaction cap)
- Per-hour: 100,000 Franks outbound
- Per-day: 500,000 Franks outbound
- Per-week: 2,000,000 Franks outbound

Hour 1: Member sends 80,000 Franks
Hour 1: Second member tries to send 30,000 Franks
→ Would exceed 100,000/hour limit
→ Transfer QUEUED until Hour 2
→ Member sees: "Transfer scheduled for processing in 45 minutes"
```

**Exemptions:**
- Emergency mutual aid transfers (voted by governance)
- Rebalancing settlements (Federation-initiated)
- Clearinghouse reconciliation adjustments

**Benefits:**
- Prevents instantaneous drain (attack has limited bandwidth)
- Provides time to detect and respond to anomalies
- Smooth out bursty trading patterns

### 6. Multi-Signature for Large Transfers

Transfers above threshold require multiple approvals.

**How it works:**
```
Columbus multi-sig thresholds:
- <10,000 Franks: member + bank officer (normal approval)
- 10,000-50,000 Franks: requires 2 bank officers
- 50,000-200,000 Franks: requires 3 officers + Treasurer
- >200,000 Franks: requires governance vote

Member requests 150,000 Frank transfer to Atlanta member
→ Flags for multi-sig review
→ 3 officers + Treasurer must approve
→ All four review: purpose, counterparty, impact on clearinghouse
→ If approved: transfer proceeds
→ If rejected: member notified with reason
```

**Benefits:**
- Prevents single compromised account from large drain
- Human review catches anomalous patterns
- Aligns large transfers with collective interest

### 7. Neighbor Vouch-Based Dynamic Limits

Bilateral limits increase based on vouching relationships and interaction history.

**How it works:**
```
Atlanta ↔ Columbus relationship:

Year 1 (new relationship):
- No vouch from Atlanta for Columbus
- Bilateral limit: -10,000 Franks (minimal exposure)
- 100 successful transactions, no issues

Year 3 (vouching earned):
- Atlanta vouches for Columbus (strong confidence)
- 5000+ successful transactions
- Bilateral limit automatically increases to -50,000 Franks

Year 10 (deep trust):
- Both vouch for each other (mutual strong)
- 50,000+ successful transactions, never defaulted
- Bilateral limit: -200,000 Franks
```

**Algorithm:**
```javascript
function calculateBilateralLimit(peer) {
  let baseLimit = 10000; // Franks
  
  // Vouch multiplier
  const vouch = getVouchForPeer(peer);
  if (vouch && vouch.confidence === 'strong') {
    baseLimit *= 5;
  } else if (vouch && vouch.confidence === 'moderate') {
    baseLimit *= 3;
  }
  
  // Transaction history multiplier
  const txCount = getSuccessfulTransactionCount(peer);
  const historyMultiplier = Math.min(Math.log10(txCount + 1), 3);
  baseLimit *= historyMultiplier;
  
  // Relationship age bonus
  const ageYears = getRelationshipAge(peer);
  baseLimit *= (1 + (ageYears / 10)); // +10% per year, capped at 3x
  
  // Default history penalty
  if (hasDefaultHistory(peer)) {
    baseLimit *= 0.1; // Severe penalty for past defaults
  }
  
  return Math.floor(baseLimit);
}
```

**Benefits:**
- Limits grow organically with trust
- New/untrusted societies can't extract much
- Rewards good behavior with increased credit
- Integrates with vouching system for consistency

### 8. Clearinghouse Dashboard & Alerts

Real-time monitoring with automated alerts prevents drift into danger zone.

**Dashboard shows:**
- Current clearinghouse balance (total across network)
- Bilateral positions with each neighbor (sorted by size)
- Proximity to limits (traffic light: green/yellow/red)
- Recent large transfers (last 7 days, >10,000 Franks)
- Rebalancing recommendations

**Automated alerts:**
- Email/notification when approaching any limit (80%)
- Daily summary to Treasurer showing net position trend
- Warning when 3+ neighbors simultaneously approaching limits (coordinated attack pattern)
- Flag when velocity spike detected (>2x normal rate)

**Benefits:**
- Visibility prevents accidental drift
- Early warning enables proactive rebalancing
- Pattern detection catches coordinated attacks

### Default Implementation: Conservative Starter Config

New societies should start with conservative limits, relaxing them as relationships mature:

```javascript
// Initial configuration for new society
const DEFAULT_LIMITS = {
  // Bilateral
  bilateralDeficitLimit: 25000,      // -25k Franks per neighbor
  bilateralDeficitWarning: 20000,    // Warn at -20k
  
  // Total clearinghouse
  totalDeficitLimit: 100000,         // -100k total across network
  totalDeficitWarning: 80000,        // Warn at -80k
  minimumReserve: 50000,             // Never go below +50k if possible
  
  // Velocity
  maxPerTransfer: 25000,             // 25k per transaction
  maxPerHour: 50000,                 // 50k per hour
  maxPerDay: 200000,                 // 200k per day
  
  // Multi-sig
  officerApprovalThreshold: 10000,   // 2 officers above 10k
  governanceVoteThreshold: 100000,   // Vote required above 100k
  
  // Dynamic
  enableVouchBasedLimits: true,      // Adjust limits based on vouches
  enableAutoRebalancing: true        // Accept Federation rebalancing
};
```

### Why This Makes Societies Resilient

**Single bad actor:**
- Can only drain up to bilateral limit (~25-50k Franks)
- Cannot drain entire society
- Velocity limits slow the drain
- Multi-sig catches large unusual transfers

**Multiple compromised accounts:**
- Each limited by velocity limits
- Total deficit breaker halts at -100k
- Cannot reach zero liquidity

**Economic attack (coordinated external demand):**
- Distributed across many bilateral limits
- Total deficit breaker provides backstop
- Credit lines from peers provide emergency liquidity
- Governance can vote emergency measures

**Bad governance:**
- Multi-sig prevents single vote from catastrophic transfer
- Velocity limits provide time for opposition to organize
- Override requires supermajority + deliberation time
- Community can fork if governance consistently terrible

**The result:** A society may have liquidity problems, may struggle with imbalances, may need to rebalance aggressively — but **cannot be utterly stripped** of its medium of exchange. The structural protections are bilateral (peer-to-peer limits) and distributed (many peers, many limits, many circuit breakers), not centralized.
