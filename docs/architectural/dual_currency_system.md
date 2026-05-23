# Dual Currency System: Franks and Florens

## Overview

The BFS Federation employs a **dual-currency architecture** inspired by medieval European trade systems (circa 1150-1350). This design protects local economies from trade-induced money supply depletion while enabling fluid inter-society commerce.

**Two currencies, two purposes:**
- **Franks**: Local mutual aid currency (society-specific)
- **Florens**: Federal trade currency (network-wide)

**Core principle**: Societies cannot be stripped of wealth through trade imbalances because their local currency supply is structurally protected.

## Historical Precedent

### Medieval European Model

During the cathedral-building era (1150-1350), European cities operated dual-currency systems:

**Local currencies (Brakteats, Deniers, Pfennigs):**
- Valid only within issuing city/region
- High demurrage (25% annually through periodic re-stamping)
- Encouraged circulation and investment in public works
- Could not be used for long-distance trade

**Trade currencies (Gold Florins, Ducats):**
- Valid across regions
- Precious metal backed
- No demurrage, stable store of value
- Used exclusively for inter-regional commerce

This system enabled:
- Prosperous local economies (high money velocity)
- Massive investment in public infrastructure (cathedrals, hospitals, bridges)
- Robust long-distance trade networks
- Protection of local money supplies

Medieval peasants—mostly illiterate with zero formal education—successfully managed this complexity for over 200 years.

## Franks: Local Currency

### Properties

**Issuance:**
- 2,000 Franks per member per year (birthday issuance)
- Issued by society's Community Bank
- Automatic, algorithmic, non-discretionary

**Demurrage:**
- 6% annually on individual holdings
- Encourages spending, investing, and lending
- Discourages hoarding
- Collected demurrage funds public projects and mutual aid

**Geographic Constraint:**
- Philadelphia Franks exist only in Philadelphia accounts
- Boston Franks exist only in Boston accounts
- **Technically impossible** to send Franks outside issuing society
- Each society's Frank supply is completely isolated

**Supply:**
- Determined solely by: `members × 2,000 Franks/year × circulation_period`
- Independent of trade balance
- Protected from external drain by geographic constraint

### Use Cases

- Daily transactions within society
- Purchasing local goods and services
- Mutual aid between members
- Funding community projects
- All internal economic activity

### Money Supply Protection

**Example: Philadelphia trade deficit**

```
Scenario: Philadelphia runs persistent import surplus for 10 years
- Total imports: 1,500,000 Florens spent
- Total exports: 500,000 Florens earned
- Net trade balance: -1,000,000 Florens (entire endowment depleted)

Philadelphia members' Floren holdings: ~0 (exhausted)
Philadelphia members' Frank holdings: 2,000,000 (UNCHANGED)

Result:
✗ Cannot import anymore (no Florens available)
✓ Local economy continues thriving (Franks circulating normally)
✓ Bakeries, childcare, construction, services all functioning
✓ Internal mutual aid system intact
✓ Community infrastructure maintained

Philadelphia has lost import capacity, not wealth.
Time pressure to develop export capabilities without local economic crisis.
```

## Florens: Federal Trade Currency

### Properties

**Issuance:**
- One-time endowment from Federal Bank on society founding
- 1,000 Florens per member (e.g., 1,000 members = 1,000,000 Florens)
- Grant, not loan (no repayment obligation)
- Distributed directly to member accounts

**Demurrage:**
- **None** on individual holdings
- Florens are stable store of value
- Can be accumulated without penalty
- Different purpose than Franks (trade settlement vs. circulation)

**Mobility:**
- Valid throughout entire federation
- Can move freely between societies
- Held in individual member accounts
- Used for all inter-society transactions

**Scarcity:**
- Finite supply (endowment only, no ongoing issuance)
- Can be depleted through net imports
- Can be accumulated through net exports
- Scarcity provides natural trade discipline

### Use Cases

- Purchasing goods/services from other societies
- Traveling between societies
- Inter-society commerce
- Building trade relationships
- Visitors spending in local economies

### Earning Florens

**Initial endowment:**
- Received automatically on society founding
- 1,000 Florens per member

**Through exports:**
- Sell goods/services to members in other societies
- Receive payment in Florens
- Primary mechanism for acquiring Florens post-endowment

**Through peer transfers:**
- Receive Florens from other members (gifts, payments)
- Florens circulate between individuals

**Through exchange (potentially):**
- Future feature: Community Banks may offer Frank → Floren exchange
- Would require society-level Floren reserves
- Design TBD

## How They Work Together

### Universal Acceptance

**Within any society, both currencies are accepted:**

```
Philadelphia bakery:
"Bread: 5 Franks OR 5 Florens"

Accepts:
✓ Philadelphia Franks (from locals)
✓ Florens (from locals or visitors)
✗ Boston Franks (invalid in Philadelphia)

Fixed exchange rate: 1 Frank = 1 Floren
(Merchants set prices, market determines acceptance)
```

### Transaction Flows

**Local transaction (Philadelphia member to Philadelphia member):**

```
John buys bread from local merchant (5 Franks)

John's account: Philadelphia Franks -5
Merchant's account: Philadelphia Franks +5

Simple internal transfer.
No Florens involved.
No federal layer involvement.
```

**Inter-society transaction (Philadelphia member to Boston member):**

```
John (Philadelphia) buys copper from Will (Boston) - 100 Florens

John's account:
  Florens: 1,000 → 900

Will's account:
  Florens: 1,200 → 1,300

Direct peer-to-peer Floren transfer.
Both societies track transactions for clearinghouse position monitoring.
No Frank movement (each society's Franks stay trapped locally).
```

**Visitor transaction (Boston member visits Philadelphia):**

```
Sarah (Boston) visits Philadelphia bakery
Bread: 5 Franks (but Sarah has 0 Philadelphia Franks)

Sarah's account:
  Boston Franks: 3,000 (cannot spend in Philadelphia)
  Florens: 2,500 → 2,495

Merchant's account:
  Philadelphia Franks: 12,450 (unchanged)
  Florens: 2,340 → 2,345

Sarah pays with Florens (works everywhere).
Merchant can spend received Florens locally or save for imports.
```

## Federal Bank Role

### Society Founding Endowment

**When Philadelphia joins federation:**

```
1. Philadelphia submits founding application
2. Federal Bank verifies: 1,000 members
3. Federal Bank creates: 1,000,000 Florens
4. Federal Bank distributes: 1,000 Florens to each member account
5. Society now has trade capacity
```

**Floren creation:**
- Federal Bank creates Florens as needed for endowments
- No fixed supply cap
- No scarcity constraint on federation growth
- Florens backed by network of societies (not commodity)

### Monitoring and Intervention

**Federal Bank tracks each society:**

```
Metrics:
- Total Florens held by society members (sum of all accounts)
- Inter-society transaction flows (imports vs exports)
- Floren depletion rate
- Warning thresholds

Warning levels:
- 50% depleted (500,000 → 500,000 Florens): Advisory
- 75% depleted (500,000 → 250,000 Florens): Concern
- 90% depleted (500,000 → 100,000 Florens): Crisis intervention
```

**Intervention strategies:**

```
When society reaches crisis threshold:

1. Capability Assessment
   - What exports could this society develop?
   - What knowledge/skills gaps exist?
   - What infrastructure is needed?

2. Knowledge Transfer
   - Training programs from surplus societies
   - Technical assistance
   - Skill development

3. Infrastructure Grants
   - Equipment for production capacity
   - Facilities for export industries
   - Funded from federal capacity-building pool

4. Conditional Floren Grant
   - Emergency Floren injection (if needed)
   - Conditional on export development plan
   - Goal: Address root cause, not just symptom
```

### Demurrage Collection (Optional Future Feature)

**Potential enhancement:**

```
Demurrage on society-level clearinghouse positions:
- Track aggregate surplus/deficit per society
- Progressive demurrage on surplus positions (e.g., 2-4% annually)
- Collected Florens fund capacity-building grants
- Incentivizes balanced trade without penalizing individuals
- Symmetric pressure on both surplus and deficit societies

Design: TBD
Currently: No demurrage on Florens (simpler initial model)
```

## Trade Imbalance Dynamics

### Natural Discipline Through Scarcity

**Philadelphia persistent deficit:**

```
Year 0: 1,000,000 Florens (endowment)
Year 1: Import 150k, Export 100k → Net -50k → 950,000 remaining
Year 2: Import 150k, Export 100k → Net -50k → 900,000 remaining
Year 3: Import 150k, Export 100k → Net -50k → 850,000 remaining
...
Year 10: 500,000 Florens remaining (50% depleted)

Natural consequences:
- Members running low on Florens individually
- Import capacity declining
- Pressure to develop exports
- Incentive to reduce non-essential imports
- No artificial intervention needed yet
```

**Boston persistent surplus:**

```
Year 0: 1,000,000 Florens (endowment)
Year 1: Export 200k, Import 100k → Net +100k → 1,100,000 held
Year 2: Export 200k, Import 100k → Net +100k → 1,200,000 held
Year 3: Export 200k, Import 100k → Net +100k → 1,300,000 held
...
Year 10: 2,000,000 Florens held (2× endowment)

Natural consequences:
- Members accumulating Florens
- High import capacity
- Incentive to import more (or invest Florens elsewhere)
- No penalty (no demurrage on Florens)
- "Wealthy" in trade capacity
```

### Why Imbalances Exist

Trade imbalances are **signals of structural differences**, not moral failures:

**Capability gaps:**
- Philadelphia can't manufacture medical equipment (knowledge gap)
- Boston has developed medical manufacturing (capability advantage)
- Solution: Knowledge transfer, training, equipment grants

**Resource geography:**
- Montana society sits on copper deposits
- Philadelphia has no mines
- Solution: Fair compensation, resource sharing agreements

**Development stage:**
- Young society (1 year old): Building capacity, high import needs
- Mature society (20 years old): Diversified, balanced trade
- Solution: Patience, development support, capability building

**Demographic differences:**
- Retirement community: Lower production, higher consumption
- Working-age community: Higher production, surplus capacity
- Solution: Mutual aid, transfer programs, accommodation

**Specialization:**
- Agricultural society: Food surplus, manufacturing deficit
- Urban society: Manufacturing surplus, food deficit
- Solution: Complementary trade (but may not be 1:1 balanced)

### Federal Response Philosophy

**Goal: Resilient, capable societies (not enforced equality)**

```
Federal does NOT:
✗ Punish deficit societies ("you're doing it wrong")
✗ Mandate equal outcomes (all societies must balance)
✗ Impose austerity (stop importing essentials)
✗ Create dependency (permanent financial support)

Federal DOES:
✓ Monitor for crisis signals (severe depletion)
✓ Identify root causes (knowledge vs resource vs development gaps)
✓ Coordinate knowledge transfer (surplus helps deficit learn)
✓ Provide capacity-building support (infrastructure, training)
✓ Facilitate capability exchange (mutual aid at federation level)
✓ Ensure every society can meet member needs
```

## User Experience

### Account Structure

**Member account display:**

```
John's Account (Philadelphia Community Bank)
───────────────────────────────────────────
🟢 Philadelphia Franks: 4,523
   (Valid in Philadelphia only)
   
🟡 Florens: 847
   (Valid everywhere)

Total local buying power: 5,370
```

### Payment Interface

**Local purchase in Philadelphia:**

```
Item: Bread from local bakery
Price: 5 Franks

Payment options:
○ Pay 5 Philadelphia Franks (default)
○ Pay 5 Florens (alternative)

[Confirm Payment]

System defaults to Franks (they have demurrage, spend them first).
User can override to pay with Florens.
```

**Import from another society:**

```
Item: Copper from Boston supplier
Price: 100 Florens

Payment options:
● Pay 100 Florens (required)

Your Florens: 847 → 747

[Confirm Payment]

Only Florens work for inter-society trade.
No Frank option (can't send Franks outside society).
```

### Travel Between Societies

```
Sarah (Boston member) traveling to Philadelphia:

Sarah's account:
  Boston Franks: 3,000 (Cannot use in Philadelphia)
  Florens: 2,500 (Works everywhere)

When Sarah arrives in Philadelphia:
- Can spend Florens at any merchant
- Cannot spend Boston Franks (invalid outside Boston)
- Merchants display: "5 Franks OR 5 Florens"
- Sarah always pays with Florens

If Sarah moves to Philadelphia permanently:
- Boston Franks: Remain in Boston account (locked)
- Florens: Transfer to Philadelphia account
- Philadelphia issues new birthday Franks going forward
```

### Learning Curve

**Week 1 (new member):**
```
Confused: "Why do I have two kinds of money?"

Friends explain:
"Franks are for here, Florens work everywhere.
Pay with Franks locally, save Florens for imports."

Simple mental model.
```

**Month 1:**
```
Member intuitively understands:
- Check Franks for local purchases
- Check Florens before importing
- Franks stay home, Florens travel
- Becomes second nature
```

**Year 1:**
```
Teaching new member:
"Oh yeah, it's easy. Franks for local, Florens for trade.
Just like video game currencies—different purposes."

Experienced users find it obvious.
```

### Visual Design

**Color coding:**
- Franks: 🟢 Green (local, growing, grounded)
- Florens: 🟡 Gold/Yellow (valuable, mobile, trade)

**Icons:**
- Franks: House, community, roots
- Florens: Network, bridges, wings

**Terminology:**
- "Local currency" (Franks)
- "Trade currency" (Florens)
- Never: "Primary" and "secondary" (implies hierarchy)

## Technical Implementation

### Database Schema

**Member accounts table:**

```sql
CREATE TABLE member_accounts (
  member_uuid TEXT PRIMARY KEY,
  society_handle TEXT NOT NULL,
  franks_balance INTEGER NOT NULL DEFAULT 0,  -- In cents (5,234.56 → 523456)
  florens_balance INTEGER NOT NULL DEFAULT 0, -- In cents
  last_birthday_issuance DATE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (member_uuid) REFERENCES members(uuid)
);
```

**Transactions table:**

```sql
CREATE TABLE transactions (
  uuid TEXT PRIMARY KEY,
  from_member_uuid TEXT NOT NULL,
  to_member_uuid TEXT NOT NULL,
  currency TEXT NOT NULL CHECK (currency IN ('franks', 'florens')),
  amount_cents INTEGER NOT NULL,
  description TEXT,
  timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (from_member_uuid) REFERENCES members(uuid),
  FOREIGN KEY (to_member_uuid) REFERENCES members(uuid)
);
```

**Society clearinghouse tracking:**

```sql
CREATE TABLE clearinghouse_positions (
  society_handle TEXT PRIMARY KEY,
  florens_net_position INTEGER NOT NULL DEFAULT 0, -- Aggregate (sum of all member Florens)
  florens_initial_endowment INTEGER NOT NULL,
  last_calculated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### Frank Transfer Constraints

**Enforced at API level:**

```typescript
export async function transferFranks(params: {
  from_member: string;  // john@philadelphia.bfs.org
  to_member: string;    // sarah@philadelphia.bfs.org
  amount_cents: number;
}): Promise<void> {
  const fromSociety = extractSociety(params.from_member);
  const toSociety = extractSociety(params.to_member);
  
  if (fromSociety !== toSociety) {
    throw new Error(
      'Franks cannot be sent outside your society. ' +
      'Use Florens for inter-society payments.'
    );
  }
  
  // Proceed with internal transfer
  await db.transferFranks(params);
}
```

**Enforced at database level:**

```sql
-- Trigger to prevent cross-society Frank transfers
CREATE TRIGGER prevent_cross_society_franks
BEFORE INSERT ON transactions
WHEN NEW.currency = 'franks'
BEGIN
  SELECT CASE
    WHEN (SELECT society_handle FROM members WHERE uuid = NEW.from_member_uuid)
      != (SELECT society_handle FROM members WHERE uuid = NEW.to_member_uuid)
    THEN RAISE(ABORT, 'Franks cannot leave society')
  END;
END;
```

### Floren Transfer (Unconstrained)

```typescript
export async function transferFlorens(params: {
  from_member: string;  // john@philadelphia.bfs.org
  to_member: string;    // will@boston.bfs.org (any society)
  amount_cents: number;
}): Promise<void> {
  // No society constraint check
  // Florens can go anywhere
  
  await db.transferFlorens(params);
  
  // Update clearinghouse tracking
  await updateClearinghousePositions(params);
}
```

## Open Questions / Future Design

### 1. Frank → Floren Exchange Mechanism

**Should Community Banks allow members to exchange Franks for Florens?**

**Option A: No exchange (strict)**
- Members can only earn Florens through exports
- Forces export development
- Simplest implementation

**Option B: Limited exchange from reserves**
- Society maintains Floren reserve pool
- Members can exchange up to limit (e.g., 500 Franks → 500 Florens per year)
- Protects against complete depletion
- More flexibility

**Option C: Peer-to-peer exchange**
- Members trade with each other
- Market-determined exchange rate
- Decentralized, no society involvement

**Decision: TBD (likely start with Option A, add B/C if needed)**

### 2. Demurrage on Florens

**Should Florens have demurrage?**

**Current design: No demurrage**
- Simpler mental model (one currency with demurrage, one without)
- Florens as stable store of value encourages trade
- Scarcity provides discipline without demurrage

**Alternative: Add demurrage**
- Consistent with Frank demurrage (philosophical alignment)
- Discourages Floren hoarding
- Funds federal capacity-building through collection

**Decision: Start without demurrage, reassess after observing behavior**

### 3. Society-Level Demurrage on Clearinghouse Positions

**Should surplus societies pay demurrage on aggregate positions?**

**Potential design:**
```
Society clearinghouse position: +500,000 Florens (surplus)
Annual demurrage: 2-4% progressive
Collected Florens fund capacity-building grants for deficit societies
Creates symmetric pressure (surplus and deficit both face costs)
```

**Decision: Future enhancement, not initial implementation**

### 4. Federal Capacity-Building Fund

**How is the fund capitalized?**

**Current endowment model:**
- Federal creates Florens for endowments (no limit)
- No collection mechanism yet
- Grants would require creating additional Florens

**Potential sources:**
- Society-level demurrage (if implemented)
- Voluntary contributions from surplus societies
- Federal issuance (creating Florens as needed)
- Portion of initial endowments reserved

**Decision: TBD, not blocking for initial implementation**

## Summary

**The dual-currency architecture achieves:**

✅ **Complete money supply protection**: Local Franks cannot drain through trade  
✅ **Natural trade discipline**: Floren scarcity provides feedback without artificial limits  
✅ **Society autonomy**: Each society controls Frank issuance independently  
✅ **Trade fluidity**: Florens enable frictionless inter-society commerce  
✅ **Crisis prevention**: Deficits hurt import capacity, not local economies  
✅ **Clear price signals**: Two currencies, two purposes, no confusion about roles  
✅ **Proven model**: Medieval system worked for 200+ years  
✅ **Manageable complexity**: Simple rules, observable behavior, social learning  

**Franks and Florens: Different currencies for different jobs.**

Local mutual aid requires captive currency with demurrage.  
Inter-society trade requires mobile currency with stability.  
Both together create a resilient, protected, vibrant federation economy.
