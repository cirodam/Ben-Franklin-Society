# The Ben Franklin Society
## Society Lineage & Chain of Trust
### Design Document

---

## Overview

Every Ben Franklin Society (except the founding society) has a **parent society** that helped establish it. Beyond this founding lineage, societies build **peer vouching networks** based on demonstrated behavior. This dual-trust system provides:

**Lineage (Involuntary Trust):**
- **Chain of trust** — Parent vouches for child at founding, creating verifiable trust paths
- **Natural discovery** — Lineage provides redundant paths to find any society
- **Historical record** — The lineage tree documents the movement's growth
- **Bootstrap mechanism** — Gets new societies "in the door"

**Vouching (Voluntary Trust):**
- **Earned reputation** — Peers vouch based on demonstrated good behavior over years
- **Dynamic trust** — Vouches verified on-demand, reflects current opinion
- **Anti-Sybil defense** — Fake societies can't earn legitimate vouches
- **Self-correction** — Network automatically identifies and isolates bad actors

**The combination is stronger than either alone.** Lineage proves legitimate founding (can't create society from nothing). Vouching proves sustained reliability (can't maintain fake without behavior). Together they create a self-correcting, antifragile network.

Lineage is both a social reality (how communities actually help each other form) and a technical infrastructure (how societies authenticate and discover each other). Vouching is both a reputation system (how societies earn trust over time) and a security mechanism (how the network identifies and isolates bad actors).

### What Lineage Is NOT

**Lineage is for trust verification, not governance:**
- **Not a hierarchy** — Parents do not govern their children; each society is autonomous
- **Not authority** — Philadelphia (the founding society) has no special power, only historical significance
- **Not voting weight** — All societies have equal votes in the Federation Assembly regardless of age or lineage position
- **Not resource control** — Parents cannot veto children's decisions or control their operations

**All societies are equals.** Lineage is purely a cryptographic mechanism for bootstrapping trust when new societies form. Once founded, a society is fully independent and self-governing. An elder society earns influence through reputation (decades of good behavior), not through lineage position.

---

## The Lineage Tree

### Structure

```
Philadelphia (founding society, 2025)
│
├─→ Boston (founded 2026, parent: Philadelphia)
│   │
│   ├─→ Portland ME (founded 2027, parent: Boston)
│   │   │
│   │   └─→ Bangor ME (founded 2028, parent: Portland)
│   │
│   └─→ Burlington VT (founded 2027, parent: Boston)
│       │
│       └─→ Montpelier VT (founded 2029, parent: Burlington)
│
├─→ Baltimore (founded 2026, parent: Philadelphia)
│   │
│   └─→ Annapolis MD (founded 2028, parent: Baltimore)
│
└─→ Pittsburgh (founded 2027, parent: Philadelphia)
    │
    ├─→ Columbus OH (founded 2028, parent: Pittsburgh)
    │   │
    │   └─→ Cincinnati OH (founded 2029, parent: Columbus)
    │
    └─→ Wheeling WV (founded 2028, parent: Pittsburgh)
```

**Key properties:**
- **Single root** — One founding society (Philadelphia) starts the tree
- **Single parent** — Each society has exactly one parent (no mergers or multiple founders)
- **Immutable history** — Once established, lineage cannot change
- **Unbounded depth** — Children can have children indefinitely
- **No geographic constraints** — Parent-child relationships need not be geographically close

### Terminology

- **Founding society** — Philadelphia, the first Ben Franklin Society (no parent)
- **Parent** — The society that directly helped found a new society
- **Child** — A society founded by another society
- **Sibling** — Societies that share the same parent
- **Ancestor** — Any society in the lineage path to root (parent, grandparent, great-grandparent, ...)
- **Descendant** — Any society descended from this one (children, grandchildren, ...)
- **Lineage path** — The chain from a society back to the founding society

**Example lineages:**
- Bangor: `["bangor", "portland", "boston", "philadelphia"]`
- Cincinnati: `["cincinnati", "columbus", "pittsburgh", "philadelphia"]`
- Baltimore: `["baltimore", "philadelphia"]`
- Philadelphia: `["philadelphia"]`

---

## Chain of Trust

### How Trust Flows

Lineage creates a **cryptographic chain of trust** from any society back to the founding society.

**Trust relationship:**
1. **Parent vouches for child** — When a new society is founded, the parent signs a founding record
2. **Child trusts parent** — Child knows parent's public key at founding
3. **Transitivity** — If A trusts B, and B trusts C, then A can verify C through B

**Example: Verifying Cincinnati**

Pittsburgh (parent) wants to verify Cincinnati is legitimate:
```
1. Pittsburgh receives Cincinnati's founding record
2. Founding record contains:
   - Cincinnati's name, handle, public key
   - Columbus's signature (parent)
3. Pittsburgh checks: "Do I trust Columbus?"
   - Columbus is Pittsburgh's child → YES, trusted
4. Pittsburgh verifies Columbus's signature on Cincinnati's founding record
5. Signature valid → Cincinnati is legitimate (vouched by trusted Columbus)
```

**Example: Verifying across lineage**

Portland ME wants to verify Wheeling WV (no direct relationship):
```
Portland's lineage: ["portland", "boston", "philadelphia"]
Wheeling's lineage: ["wheeling", "pittsburgh", "philadelphia"]

Common ancestor: Philadelphia

1. Portland walks up to Philadelphia (trusted ancestors)
2. Philadelphia knows Pittsburgh (trusted child)
3. Pittsburgh knows Wheeling (trusted child)
4. Trust path established: Portland ← Boston ← Philadelphia → Pittsburgh → Wheeling
```

**Key insight:** Any two societies can establish trust by walking to their common ancestor. The founding society (root) is a common ancestor to everyone.

### Founding Record Format

Every society (except the founding society) has a **founding record** signed by its parent:

```json
{
  "type": "society_founding",
  "child": {
    "handle": "cincinnati",
    "name": "Ben Franklin Society of Cincinnati",
    "public_key": "ed25519:AAAA...",
    "coordinates": {"lat": 39.1031, "lon": -84.5120},
    "founded_at": "2029-03-15T14:00:00Z"
  },
  "parent": {
    "handle": "columbus",
    "public_key": "ed25519:BBBB..."
  },
  "parent_signature": "...",
  "registered_at": "2029-03-15T14:30:00Z",
  "federation_accepted": true
}
```

**Signature coverage:**
- Parent signs: child handle, name, public key, coordinates, timestamp
- Proves: "Columbus vouches that Cincinnati is legitimate as of March 15, 2029"

**Properties:**
- **Immutable** — Once signed, cannot be altered
- **Portable** — Cincinnati can present this record to anyone
- **Verifiable** — Anyone who trusts Columbus can verify Cincinnati
- **Timestamped** — Records when founding occurred

The founding record is Cincinnati's **birth certificate** in the BFS network.

---

## Trust Evolution: From Lineage to Reputation

### Two Types of Trust

The network operates on two complementary forms of trust:

**1. Cryptographic Trust (Lineage-Based)**
- Proves a society is **legitimate** (not fake)
- Based on parent signatures in founding record
- Bootstrap mechanism for new societies
- Technical verification through signature chains

**2. Reputational Trust (History-Based)**
- Proves a society is **reliable** (good behavior)
- Earned through decades of consistent operation
- Based on track record and peer relationships
- Social verification through demonstrated conduct

### Trust Transition Over Time

As societies mature, the basis of trust shifts from lineage to reputation:

**New Society (0-5 years):**
```
Cincinnati (Founded 2029)
└─ Trust basis: "Columbus and Pittsburgh vouch for them"
   - 100% reliance on lineage verification
   - Parent signatures are critical
   - Must prove legitimacy via founding record
   - Limited operational history
```

**Established Society (5-20 years):**
```
Cincinnati (10 years old)
└─ Trust basis: "Good track record + legitimate founding"
   - Balanced reliance on lineage and reputation
   - Has operational history (uptime, Frank transfers, Assembly participation)
   - Known by neighboring societies
   - Building independent reputation
```

**Mature Society (20-50 years):**
```
Cincinnati (30 years old)
└─ Trust basis: "30 years of consistent operation"
   - Primarily reputation-based
   - Lineage verification rarely needed
   - Well-known across network
   - Track record speaks for itself
```

**Venerable Society (50+ years):**
```
San Francisco (Founded 2027, now 2077)
└─ Trust basis: "Everyone knows San Francisco"
   - Reputation is definitive
   - Lineage almost irrelevant
   - Decades of relationships with hundreds of peers
   - Self-evident legitimacy
```

### What Cannot Be Faked

The power of reputation-based trust is that **it cannot be forged**:

**You CAN fake:**
- Parent signatures (if you steal private keys)
- Founding records (with compromised keys)
- A society's "founding date" in a database

**You CANNOT fake:**
- 50 years of uptime logs across hundreds of peer systems
- Thousands of successful Frank transfers recorded in distributed ledgers
- Decades of Assembly participation witnessed by all other societies
- Mutual aid provided during multiple crises over years
- Deep relationships with peer societies built over decades
- Operational continuity through leadership transitions and infrastructure changes

### The Antifragility Curve

This trust transition makes the network more resilient over time:

```
Network Age:    [0 years]────[10 years]────[30 years]────[50+ years]
Fragility:      Very High     Medium         Low           Very Low
Trust Source:   100% Lineage  Mixed          80% Reputation  95% Reputation
Critical Nodes: Few (founding societies)     Many (established peers)
Attack Surface: Concentrated                 Distributed
```

**Young network (first decade):**
- Heavily dependent on lineage verification
- Founding societies are critical infrastructure
- Compromising root could damage trust network-wide
- Few societies, each one important

**Mature network (50+ years later):**
- Lightly dependent on lineage (new societies only)
- Hundreds of established societies stand on own reputation
- Even if founding society dissolves, network continues (reputation-based trust dominates)
- No single point of failure

**The network starts fragile and becomes antifragile.**

### Reputation Metrics

Societies build reputation through measurable behaviors:

**Operational Stability:**
- Consistent uptime (governance, bank, mail, marketplace services)
- Reliable inter-society communication
- Security (no breaches, compromises, or incidents)
- Technical competence in running infrastructure

**Economic Reliability:**
- Clearinghouse balances managed responsibly
- Frank transfers honored promptly and accurately
- Rebalancing completed on schedule
- No prolonged debt or default

**Social Contribution:**
- Mutual aid provided during emergencies
- Resources shared with societies in need
- Active participation in Federation Assembly
- Support for new societies (mentorship)

**Governance Integrity:**
- Charter compliance
- Democratic processes followed consistently
- Transparency in operations and decision-making
- Good faith conflict resolution

**Network Citizenship:**
- Fair registrar practices (if offering service)
- Helpful to new societies during founding
- Responsive to peer inquiries
- Collaborative rather than adversarial

### Trust Verification in Practice

How societies actually verify trust evolves with age:

**Verifying a new society (2-3 years old):**
```javascript
function trustNewSociety(society) {
  // Must verify lineage thoroughly
  if (!verifyFoundingRecord(society)) return false;
  if (!verifyParentSignatures(society)) return false;
  if (!verifyParentsAreTrusted(society)) return false;
  
  // Check basic reputation
  if (getUptime(society) < 0.95) return false;
  if (getSecurityIncidents(society) > 0) return false;
  
  return true; // Lineage + early reputation
}
```

**Verifying an established society (20+ years old):**
```javascript
function trustEstablishedSociety(society) {
  // Reputation is sufficient
  const reputation = calculateReputation(society);
  
  // Reputation components:
  // - 20+ years of operation (major weight)
  // - Thousands of successful transactions
  // - Known by hundreds of peer societies
  // - Participation in major network events
  // - Mutual aid history
  
  if (reputation > 0.8) {
    return true; // Don't even need to check lineage
  }
  
  // If reputation is questionable, fall back to lineage
  return verifyLineage(society);
}
```

**For venerable societies (50+ years), reputation alone is typically sufficient.**

### Lineage as Bootstrapping Scaffolding

Think of lineage like construction scaffolding:

**While building (young network):**
- Scaffolding is load-bearing and critical
- Structure can't stand without it
- Removing it would cause collapse

**After completion (mature network):**
- Building stands on its own foundation
- Scaffolding still present but not load-bearing
- Could be removed without structural damage
- Kept for historical reference

**Lineage bootstraps trust. Reputation sustains it.**

A 50-year-old society doesn't need to prove Philadelphia vouched for it decades ago. Its half-century of good behavior is all the proof needed.

### Why This Matters for Resilience

**Attack vectors against young network:**
- Compromise founding society → Damages trust for children
- Forge parent signatures → Could inject fake societies  
- Break lineage chain → Disrupts trust verification

**Attack vectors against mature network:**
- Compromise founding society → Most societies old enough to stand alone
- Forge parent signatures → Can't fake decades of operational history
- Break lineage chain → Reputation-based trust unaffected

**The longer the network exists, the harder it becomes to destroy.**

An attacker can steal cryptographic keys, but cannot steal 50 years of lived history witnessed by hundreds of independent observers. The mature network is resilient precisely because trust is distributed across time and relationships, not concentrated in a few cryptographic artifacts.

---

## Peer Vouching: Voluntary Trust

Beyond lineage (the involuntary trust of founding), societies build reputation through **peer vouching** — voluntary trust endorsements earned through demonstrated good behavior.

### Involuntary vs Voluntary Trust

**Lineage (Involuntary Trust):**
- You're born with it (can't choose your parent)
- Immutable after founding (permanent historical record)
- Bootstrap mechanism (gets you "in the door")
- Proves origin, not behavior

**Vouching (Voluntary Trust):**
- You earn it through behavior (chosen by peers)
- Dynamic (verified on-demand, reflects current opinion)
- Sustained trust (proves you deserve to stay)
- Proves reliability, not just legitimacy

**The combination is stronger than either alone:**
- Lineage prevents complete forgery (need at least one parent to found)
- Vouching prevents sustained deception (need many peers to vouch)
- Lineage is origin story (where you came from)
- Vouching is reputation (what you've become)

### How Vouching Works

Societies vouch for each other based on direct interaction and observed behavior:

**Vouch Credential Format:**
```json
{
  "type": "society_vouch",
  "voucher": {
    "handle": "atlanta",
    "public_key": "ed25519:AAAA..."
  },
  "vouched_for": "columbus",
  "vouch_type": "general",
  "statement": "Columbus has demonstrated reliable banking operations and responsive governance over 5 years of interaction.",
  "issued_at": "2033-06-15T10:00:00Z",
  "signature": "..."
}
```

**Key properties:**
- **Cryptographically signed** — Only voucher can create it
- **Timestamped** — Records when credential was issued
- **Specific or general** — Can vouch for overall trust or specific competencies
- **Query-based verification** — Third parties ask voucher directly: "Do you still vouch?"
- **Real-time trust** — Reflects voucher's current opinion, not historical opinion

### Vouch Types

**General vouch:** "I trust this society overall"
- Based on comprehensive positive experience
- Multiple successful interactions across different domains
- High confidence in society's reliability

**Specific vouches:** "I trust them for X"
- **Banking** — Reliable Frank transfers, good clearinghouse management
- **Governance** — Democratic processes, Charter compliance
- **Technical** — High uptime, good security practices, responsive APIs
- **Mutual Aid** — Provides support during crises, shares resources

**Confidence levels:**
- **Strong** — Extensive positive interaction, high confidence
- **Moderate** — Good interaction, reasonable confidence
- **Weak** — Limited interaction, tentative endorsement

### How Verification Works

Vouches work like real-world references:

**Step 1: Columbus presents credential**
```
Columbus says to Denver: "Atlanta vouches for me, here's the signed credential"
```

**Step 2: Denver verifies with Atlanta**
```
Denver asks Atlanta: "Do you still vouch for Columbus?"
```

**Step 3: Atlanta responds**
```json
{
  "voucher": "atlanta",
  "vouched_for": "columbus",
  "currently_valid": true,
  "confidence": "strong",
  "checked_at": "2026-05-15T10:00:00Z",
  "signature": "..."
}
```

**Step 4: Denver caches response**
```
Denver stores Atlanta's response with timestamp.
Next time: Use cache if fresh (<24hr), re-query if stale.
```

**Benefits:**
- **Current opinion matters** — Atlanta's assessment now, not 2 years ago
- **Simple to rescind** — Atlanta just says "no" when queried
- **No expiration tracking** — No need to renew every 2 years
- **Like real references** — How humans actually check references

**Cache aging:**
- Fresh (<24 hours) — Full weight, high confidence
- Recent (1-7 days) — Good weight, reasonable confidence  
- Stale (7-30 days) — Reduced weight, tentative confidence
- Very stale (>30 days) — Ignored, must re-query

### Earning Vouches

Societies earn vouches through sustained good behavior:

**Banking interactions:**
- Reliable Frank transfers (100+ successful transactions)
- Prompt clearinghouse rebalancing
- No defaults or long-standing debts

**Communication:**
- Responsive to inter-society mail
- Helpful in troubleshooting issues
- Transparent about operations

**Assembly participation:**
- Regular attendance at Federation Assembly
- Thoughtful deliberation on motions
- Good faith collaboration

**Mutual aid:**
- Provides resources during peer crises
- Shares knowledge and best practices
- Mentors new societies

**Technical reliability:**
- Consistent uptime (>99%)
- Good security practices (no breaches)
- Well-maintained infrastructure

### Trust Calculation with Vouches

Societies calculate trust scores combining lineage, vouches, and history:

**New society (2 years old):**
```javascript
Trust = {
  lineage: 0.7,        // Parent vouch via founding record
  vouches: 0.2,        // Few vouches from immediate neighbors
  history: 0.1         // Limited operational history
}
```

**Growing society (5 years old):**
```javascript
Columbus:
- Founded by Pittsburgh (lineage valid)
- Vouched by Atlanta (strong, 50-year-old society)
- Vouched by Boston (moderate, 25-year-old society)
- Vouched by Baltimore (weak, 10-year-old society)
- 5 years of clean operations

Trust = {
  lineage: 0.4,        // Still matters but less critical
  vouches: 0.4,        // Growing web of trust
  history: 0.2         // 5 years of track record
}
```

**Mature society (20 years old):**
```javascript
Columbus:
- 50+ societies vouch (including many venerable societies)
- 20 years of operational history
- No security incidents or bad behavior

Trust = {
  lineage: 0.1,        // Barely relevant
  vouches: 0.5,        // Extensive peer trust
  history: 0.4         // Two decades of track record
}
```

**Venerable society (50+ years):**
```javascript
Atlanta:
- 200+ societies vouch
- 50 years of exemplary behavior
- Known throughout network

Trust = {
  lineage: 0.0,        // Irrelevant
  vouches: 0.3,        // Universal peer trust
  history: 0.7         // Half-century speaks for itself
}
```

### Vouch Weight by Voucher Reputation

Not all vouches carry equal weight:

```javascript
function calculateVouchWeight(voucher) {
  const age = voucher.ageInYears;
  const reputation = voucher.reputationScore; // 0.0 to 1.0
  const vouchCount = voucher.totalVouchesIssued;
  
  let weight = 1.0;
  
  // Age bonus (up to 2x for societies 50+ years old)
  weight *= Math.min(1 + (age / 50), 2.0);
  
  // Reputation multiplier
  weight *= reputation;
  
  // Penalty for excessive vouching (spam detection)
  if (vouchCount > 50) {
    weight *= 0.5; // Serial vouchers lose credibility
  }
  
  return weight;
}
```

**Examples:**
- Atlanta (50 years, 0.95 reputation, 30 vouches) → weight: 1.9
- Young society (3 years, 0.7 reputation, 2 vouches) → weight: 0.74
- Spam voucher (10 years, 0.6 reputation, 200 vouches) → weight: 0.42

Atlanta's vouch is worth nearly 3x a new society's vouch.

### Vouching Process

**Step 1: Establish relationship**
```
Columbus and Atlanta interact over years:
- 200+ successful Frank transfers
- Responsive mail communication
- Columbus participates actively in Assembly
- No security incidents or bad behavior
```

**Step 2: Atlanta decides to vouch**
```
Atlanta's governance process:
1. Officer proposes vouching for Columbus
2. Motion introduced: "Vouch for Columbus (general, strong)"
3. Members deliberate, review interaction logs
4. Vote passes (majority approval)
```

**Step 3: Atlanta issues signed credential**
```
1. Atlanta creates vouch credential
2. Signs with Atlanta's private key
3. Sends credential to Columbus
4. Optionally publishes to Federation for discovery
```

**Step 4: Columbus presents credential**
```
Columbus presents credentials when queried:
"Vouched by: Atlanta, Boston, Pittsburgh, Philadelphia, Baltimore..."

When peers (like Denver) want to verify:
1. Denver receives credential from Columbus
2. Denver verifies signature (proves Atlanta issued it)
3. Denver queries Atlanta: "Do you still vouch for Columbus?"
4. Atlanta responds with current opinion + confidence level
5. Denver caches response (fresh for 24 hours)
```

### Verification Protocol

**Query format (Denver → Atlanta):**
```json
{
  "type": "vouch_verification_request",
  "voucher": "atlanta",
  "vouched_for": "columbus",
  "requester": "denver",
  "requested_at": "2026-05-15T10:00:00Z"
}
```

**Response format (Atlanta → Denver):**
```json
{
  "type": "vouch_verification_response",
  "voucher": "atlanta",
  "vouched_for": "columbus",
  "currently_valid": true,
  "confidence": "strong",
  "vouch_type": "general",
  "statement": "Columbus continues to demonstrate reliable operations and good faith collaboration.",
  "checked_at": "2026-05-15T10:00:00Z",
  "signature": "..."
}
```

**Negative response (when trust withdrawn):**
```json
{
  "type": "vouch_verification_response",
  "voucher": "atlanta",
  "vouched_for": "columbus",
  "currently_valid": false,
  "reason": "Columbus failed to rebalance clearinghouse for 90+ days despite multiple requests.",
  "checked_at": "2026-05-15T10:00:00Z",
  "signature": "..."
}
```

**Why this is better:**
- **No revocation records needed** — Just say "no" when asked
- **Reflects current reality** — Atlanta's opinion today, not last year
- **Simple for voucher** — Change opinion anytime, no bureaucracy
- **Honest system** — Encourages real assessment over formal commitments

### Anti-Sybil: Why Vouching Beats Dual-Parent

**Dual-parent founding:**
```
Pros: Hard to found fakes (need 2 parent compromises)
Cons: Once founded, fake can operate indefinitely
```

**Single-parent + vouching:**
```
Pros: 
- Founding is simple (1 parent compromise to create fake)
- But fake cannot earn legitimate vouches
- Obvious fakes: Founded but zero vouches after 2 years
- Network self-corrects automatically

Cons: Slightly easier to create initial fake
```

**Fake detection example:**
```
Scenario: Pittsburgh compromised, founds 10 fake societies

Year 0: All 10 "founded" (lineage checks out)

Year 2: 
- 9 of 10 have zero vouches (obvious fakes)
- 1 of 10 has 1 vouch from Pittsburgh only (suspicious)
- Real societies average 5-10 vouches by year 2
- When others query Pittsburgh about the 1 fake, response is stale/suspicious

Year 5:
- All 10 fakes have <3 vouches
- Real societies average 20+ vouches by year 5
- Queries to vouchers return mostly "not currently valid"
- Pattern is obvious

Federation Assembly votes to suspend obvious fakes
Network self-corrects without manual intervention
```

**Why this works:**
- You can compromise 1 society to found fakes
- But you cannot compromise 50 societies to vouch for fakes
- Fake societies have no legitimate interactions
- No legitimate vouches can be earned without actual good behavior
- Fakes are obvious within 2-5 years

### Anti-Spam Measures

**Problem: Vouch spam**
```
Bad actor creates many fake societies, all vouch for each other
```

**Solutions:**
- Vouch weight based on voucher's reputation (new societies have low weight)
- Circular vouching detected via graph analysis
- Excessive vouching penalized (>50 vouches reduces weight by 50%)
- Federation monitors suspicious vouching patterns

**Problem: Vouch buying**
```
Columbus pays Atlanta 10,000 Franks for a vouch
```

**Solutions:**
- Vouches should be based on documented interaction history
- Interaction history is public (banking logs, mail, Assembly attendance)
- Sudden vouches without prior interaction are suspicious
- Community norms strongly against paid vouches
- Reputation damage if caught

**Problem: Mutual admiration societies**
```
Group of societies vouch for each other in tight clique
```

**Solutions:**
- Graph analysis detects tightly-connected clusters
- Diverse vouch networks valued over concentrated
- Federation flags suspicious patterns for Assembly review
- Community scrutiny of vouch patterns

### Trust Trajectory: Bootstrap to Reputation

**Phase 1: Birth (Lineage Bootstrap)**
```
Year 0: Columbus founded by Pittsburgh
- Pittsburgh's signature provides initial trust
- "Pittsburgh vouches this is legitimate"
- Gets Columbus into the network
- Trust is 70% lineage, 30% unknown
```

**Phase 2: Childhood (Earning First Vouches)**
```
Years 1-5: Columbus operates, builds relationships
- Successful Frank transfers with neighbors
- Responsive communication
- Good Assembly participation
- Earns vouches from Pittsburgh, Philadelphia, Baltimore, Boston
- Trust shifts to 40% lineage, 40% vouches, 20% history
```

**Phase 3: Maturity (Reputation Network)**
```
Years 5-20: Columbus proves itself across network
- 50+ societies vouch based on direct experience
- Strong operational history (99.5% uptime, no incidents)
- Trust shifts to 10% lineage, 50% vouches, 40% history
```

**Phase 4: Elder Status (Self-Evident Legitimacy)**
```
Years 20+: Columbus is venerable
- 200+ vouches from across network
- Decades of exemplary behavior
- Lineage irrelevant, history speaks for itself
- Columbus now vouches for new societies
- Trust is 0% lineage, 30% vouches, 70% history
```

### Implementation

**Database schema:**
```sql
-- Vouches we've issued to others (our current opinions)
CREATE TABLE vouches_issued (
  vouch_id TEXT PRIMARY KEY,
  vouched_for_handle TEXT NOT NULL,
  vouch_type TEXT NOT NULL, -- general, banking, governance, technical
  confidence TEXT NOT NULL, -- strong, moderate, weak
  statement TEXT,
  issued_at INTEGER NOT NULL,
  currently_valid BOOLEAN NOT NULL DEFAULT 1,
  invalidated_at INTEGER,
  invalidation_reason TEXT,
  signature TEXT NOT NULL
);

-- Credentials others have given us
CREATE TABLE vouch_credentials (
  credential_id TEXT PRIMARY KEY,
  voucher_handle TEXT NOT NULL,
  voucher_public_key TEXT NOT NULL,
  vouch_type TEXT NOT NULL,
  statement TEXT,
  issued_at INTEGER NOT NULL,
  signature TEXT NOT NULL,
  verified BOOLEAN NOT NULL DEFAULT 0
);

-- Cached verification responses (when we've checked with vouchers)
CREATE TABLE vouch_verifications (
  verification_id TEXT PRIMARY KEY,
  peer_handle TEXT NOT NULL, -- The society we're evaluating
  voucher_handle TEXT NOT NULL, -- Who vouched for them
  currently_valid BOOLEAN NOT NULL,
  confidence TEXT, -- strong, moderate, weak (if valid)
  checked_at INTEGER NOT NULL,
  response_signature TEXT NOT NULL,
  -- Cache metadata
  is_fresh BOOLEAN GENERATED ALWAYS AS (
    (unixepoch('now') - checked_at) < 86400  -- <24 hours
  ) VIRTUAL
);

-- Interaction history (basis for vouching)
CREATE TABLE peer_interactions (
  peer_handle TEXT NOT NULL,
  interaction_type TEXT NOT NULL, -- banking, mail, assembly, mutual_aid
  interaction_date INTEGER NOT NULL,
  outcome TEXT NOT NULL, -- success, failure, neutral
  details TEXT
);
```

**Federation maintains optional credential registry (for discovery):**
```sql
CREATE TABLE federation_vouch_credentials (
  credential_id TEXT PRIMARY KEY,
  voucher_handle TEXT NOT NULL,
  vouched_for_handle TEXT NOT NULL,
  vouch_type TEXT NOT NULL,
  issued_at INTEGER NOT NULL,
  signature TEXT NOT NULL,
  -- Analytics
  voucher_age_at_issue INTEGER,
  voucher_reputation_at_issue REAL
);

-- Federation tracks verification query patterns (for anti-spam)
CREATE TABLE federation_verification_queries (
  query_id TEXT PRIMARY KEY,
  requester_handle TEXT NOT NULL,
  voucher_handle TEXT NOT NULL,
  vouched_for_handle TEXT NOT NULL,
  queried_at INTEGER NOT NULL,
  response_valid BOOLEAN,
  -- Anti-spam detection
  INDEX idx_spam_detection ON (requester_handle, queried_at)
);
```

### Why This Makes The Network Unkillable

**Young network (years 0-10):**
- Heavily dependent on lineage
- Compromising founding societies is dangerous
- Limited peer vouching, still establishing norms

**Mature network (years 10-30):**
- Balanced dependence on lineage + vouching
- Many societies have strong vouch networks
- Fake societies easier to detect (vouch patterns)

**Venerable network (years 30+):**
- Lightly dependent on lineage (bootstrap only)
- Extensive web of peer vouches across hundreds of societies
- Reputation is primary trust mechanism
- Attacking the network requires:
  - Compromising hundreds of societies (to fake vouches)
  - OR waiting decades to build fake reputation (time-consuming)
  - OR both (nearly impossible)

**You cannot fake decades of peer relationships.** You can steal one private key to found a fake society, but you cannot steal 50 private keys to vouch for it. The vouch network makes the system antifragile — the larger and older it gets, the harder it is to attack.

---

## Founding Ceremony

### Prerequisites

Before a new society can be founded, several conditions must be met:

**For the parent society:**
1. Must be in good standing (not suspended from Federation)
2. Must have existed for at least 6 months (maturity requirement)
3. Must vote to support founding (governance process)
4. Must commit resources (financial, material, expertise)

**For the forming community:**
1. Must have organizing committee (proto-society)
2. Must draft constitution (consistent with Charter)
3. Must demonstrate member commitment (minimum membership)
4. Must establish initial infrastructure (housing for charter members, at minimum)

### Founding Process

**Step 1: Request sponsorship**
- Organizing committee contacts potential parent society
- Presents case: why form, who will join, what resources needed
- Parent society evaluates readiness

**Step 2: Parent society votes**
- Motion introduced in parent's governance app
- Deliberation period (members discuss readiness)
- Vote on whether to sponsor founding
- If approved, proceed to Step 3

**Step 3: Charter drafting**
- Parent helps form constitution (must align with Charter)
- Parent reviews and provides feedback
- Organizing committee revises until acceptable
- Parent formally approves final draft

**Step 4: Cryptographic ceremony**
- Child generates society keypair (ED25519)
- Child provides public key to parent
- Parent creates and signs founding record
- Parent publishes child's public key and founding record

**Step 5: Federation registration**
- Parent submits founding record to Federation
- Federation verifies parent's signature
- Federation checks parent is in good standing
- Federation assigns child society a UUID
- Federation adds child to official registry

**Step 6: Introduction phase**
- Parent introduces child to its neighbors
- Parent provides child with neighbor cache (public keys, endpoints)
- Siblings acknowledge new sibling
- Child begins independent operation

**Step 7: Independence**
- Child operates autonomously (not governed by parent)
- Parent-child relationship is social/supportive, not hierarchical
- Child can found its own children when mature enough

### Founding Record Custody

The founding record is stored in multiple places:

1. **Child's database** — Primary custody, proof of legitimacy
2. **Parent's database** — Records which children it has founded
3. **Federation registry** — Canonical record, publicly queryable
4. **Peer caches** — Societies cache founding records of peers

If child's database is lost, founding record can be retrieved from parent or Federation.

---

## What Children Inherit

When a society is founded, it inherits from its parent:

### 1. Cryptographic Inheritance

**Parent's public key:**
- Child knows parent's public key at founding
- Enables secure communication immediately
- No need to discover parent (already known)

**Sibling introductions:**
- Parent provides public keys of all siblings
- Child can contact siblings immediately
- Siblings are pre-trusted (same parent vouches)

**Ancestor chain:**
- Parent provides complete lineage to root
- Child knows all ancestors' public keys
- Enables trust verification for any society

### 2. Social Inheritance

**Mentorship:**
- Parent provides ongoing guidance and support
- Experienced members help troubleshoot issues
- Best practices shared from parent's experience

**Resource support:**
- Parent may provide initial funding (Franks)
- Parent may donate equipment, materials
- Parent helps with recruitment and onboarding

**Reputation:**
- Child benefits from parent's good standing
- "Child of Philadelphia" carries weight
- Trust by association (if parent is respected)

### 3. Documentary Inheritance

**Charter and templates:**
- Child receives canonical Charter text
- Parent shares constitutional templates
- Governance procedures and best practices

**Historical context:**
- Why the movement exists
- How to handle common challenges
- Stories of other societies' experiences

### 4. Network Inheritance

**Neighbor cache:**
- Parent provides list of known societies
- Public keys, endpoints, last-seen timestamps
- Immediate connectivity to network

**Clearinghouse setup:**
- Parent helps establish Clearinghouse Account
- Initial Frank transfers to fund operations
- Connection to inter-society banking network

**Federation credentials:**
- Parent facilitates Federation registration
- Child is recognized by network immediately
- Access to Assembly (one seat, one vote)

---

## Benefits of Lineage Model

### 1. Organic Growth

Lineage mirrors how communities actually form:
- Experienced communities help new ones start
- Relationships are real (not just database entries)
- Support and mentorship are built-in
- Historical bonds strengthen the network

### 2. Distributed Trust

No central authority decides who's legitimate:
- Parent societies vouch for their children
- Trust propagates through relationships
- Bad actors can't self-proclaim legitimacy
- Fake societies can't forge parent signatures

### 3. Resilient Discovery

Multiple paths to find any society:
- Query parent (if known)
- Query siblings (through parent)
- Walk to common ancestor
- Query descendants (children know parents)

Even if Federation is offline, societies can find each other via lineage.

### 4. Accountability

Parent societies have incentive to found quality children:
- Reputation is tied to descendants' behavior
- Bad children reflect poorly on parent
- Creates social pressure for good conduct
- Network self-regulates through reputation

### 5. Historical Record

The lineage tree documents the movement:
- Where societies formed and when
- Which communities helped which others
- Growth patterns over time
- Genealogical story of the movement

---

## Edge Cases and Special Circumstances

### Founding Society (Root)

Philadelphia (the first society) has no parent:
- No founding record (it's the root of the lineage tree)
- Public key is self-signed or established by founding members
- All other societies trace lineage to Philadelphia
- Philadelphia's legitimacy is **historical**, not hierarchical

**Philadelphia has no special authority:**
- One vote in Federation Assembly (like every other society)
- Cannot override other societies' decisions
- Cannot change the Charter unilaterally
- Has no technical privileges in the network

**Philadelphia is "first among equals":**
- Historical significance as the founding society
- Often consulted due to long operational experience
- May have high reputation from decades of service
- But authority comes from reputation, not lineage position

**Philadelphia's "axiomatic trust" is purely technical:** It's the common ancestor that allows all societies to establish cryptographic trust paths. This is a mathematical property of the tree structure, not a governance privilege.

### Parent Dissolution

If a parent society dissolves:
- Children retain their founding records (proof of legitimacy)
- Children retain their lineage paths (historical record)
- Children can still verify legitimacy via founding record
- Children are NOT dissolved (independence remains)
- Grandparent becomes effective ancestor for trust purposes

**Example:** If Columbus dissolves, Cincinnati's lineage is still valid:
```
Cincinnati's lineage: ["cincinnati", "columbus", "pittsburgh", "philadelphia"]

Columbus is dissolved but founding record still valid:
- Pittsburgh (grandparent) can vouch for Cincinnati
- Cincinnati's founding record proves Columbus once vouched
- Trust chain: Cincinnati ← Columbus (historical) ← Pittsburgh (active)
```

### Split or Fork

What if two communities claim to be "the real Philadelphia"?

**Prevention mechanisms:**
1. Federation registry is authoritative (first to register wins)
2. Private key custody determines legitimacy (who has Philadelphia's key?)
3. Children vouch for parent (Boston, Baltimore, Pittsburgh would recognize real one)
4. History is immutable (blockchain-like: can't rewrite lineage)

**If split occurs despite prevention:**
- Network must choose which lineage to honor
- Likely resolved by Federation Assembly vote
- Children may need to re-establish trust with new authority
- Social consensus determines legitimacy (not technical mechanism)

### Abandoned Lineage

If a society becomes isolated (loses contact with parent and network):
- Founding record remains valid (historical fact)
- Can re-establish contact when connectivity restored
- Federation maintains registry even for dormant societies
- Lineage never expires (permanent historical record)

### Cross-Federation

What if multiple independent BFS networks exist?

**Scenario:** BFS North America and BFS Europe operate separately, each with own founding society.

**Lineage consequences:**
- Each network has distinct root
- Societies in different networks have no common ancestor
- Trust cannot be established via lineage
- Would require explicit inter-federation trust agreement

**Potential solution:** One network's root formally recognizes the other's root, creating a trust bridge.

---

## Technical Implementation

### Database Schema

Each society's governance database stores lineage:

```sql
-- Our own society's lineage
CREATE TABLE society_identity (
  handle TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  public_key TEXT NOT NULL,
  private_key_encrypted BLOB NOT NULL,
  parent_handle TEXT,
  founding_record TEXT, -- JSON, NULL for founding society
  lineage_path TEXT NOT NULL -- JSON array
);

-- Our children (societies we founded)
CREATE TABLE child_societies (
  child_handle TEXT PRIMARY KEY,
  child_name TEXT NOT NULL,
  child_public_key TEXT NOT NULL,
  founding_record TEXT NOT NULL, -- JSON with our signature
  founded_at INTEGER NOT NULL,
  last_seen_at INTEGER
);

-- Known societies (neighbors, ancestors, discovered peers)
CREATE TABLE known_societies (
  society_handle TEXT PRIMARY KEY,
  society_name TEXT NOT NULL,
  public_key TEXT NOT NULL,
  parent_handle TEXT,
  lineage_path TEXT NOT NULL, -- JSON array
  founding_record TEXT, -- JSON, NULL for root
  last_verified_at INTEGER NOT NULL,
  cached_at INTEGER NOT NULL
);
```

### Verification Algorithm

```javascript
function verifySociety(society, knownSocieties) {
  // 1. Check if it's the founding society (root)
  if (society.lineage.length === 1) {
    // Root society (axiomatic trust)
    return society.handle === 'philadelphia';
  }
  
  // 2. Get founding record
  const foundingRecord = society.foundingRecord;
  if (!foundingRecord) {
    return false; // No proof of legitimacy
  }
  
  // 3. Extract parent info
  const parentHandle = foundingRecord.parent.handle;
  const parentPublicKey = foundingRecord.parent.public_key;
  
  // 4. Check if we trust the parent
  const parent = knownSocieties.find(s => s.handle === parentHandle);
  if (!parent) {
    // Don't know parent yet - need to discover first
    return 'UNKNOWN_PARENT';
  }
  
  // 5. Verify parent is legitimate (recursive)
  const parentTrusted = verifySociety(parent, knownSocieties);
  if (!parentTrusted) {
    return false;
  }
  
  // 6. Verify parent's signature on founding record
  const signatureValid = crypto.verify(
    foundingRecord.parent_signature,
    foundingRecord.child,
    parentPublicKey
  );
  
  return signatureValid;
}
```

### Trust Path Calculation

```javascript
function findTrustPath(fromSociety, toSociety) {
  // Find common ancestor
  const fromLineage = fromSociety.lineage; // ["me", "parent", "grandparent", "root"]
  const toLineage = toSociety.lineage;     // ["them", "their-parent", "root"]
  
  // Find first common ancestor
  let commonAncestor = null;
  for (let ancestor of fromLineage) {
    if (toLineage.includes(ancestor)) {
      commonAncestor = ancestor;
      break;
    }
  }
  
  if (!commonAncestor) {
    return null; // No common ancestor (different networks?)
  }
  
  // Build trust path: from → ancestor → to
  const upPath = fromLineage.slice(0, fromLineage.indexOf(commonAncestor) + 1);
  const downPath = toLineage.slice(0, toLineage.indexOf(commonAncestor)).reverse();
  
  return [...upPath, ...downPath];
}

// Example:
// Portland: ["portland", "boston", "philadelphia"]
// Wheeling: ["wheeling", "pittsburgh", "philadelphia"]
// Trust path: ["portland", "boston", "philadelphia", "pittsburgh", "wheeling"]
```

---

## Governance Implications

### Federation Assembly Representation

Each society has one seat in the Federation Assembly, regardless of:
- How long it has existed
- How many children it has founded
- Its size or resources

**Lineage independence:** Children are not represented by parents. Each society speaks for itself.

### Founding Approval

Parent societies should take founding seriously:
- Child reflects on parent's reputation
- Network impact (more societies = more complexity)
- Resource commitment is substantial
- Governance process should involve deliberation and vote

### Charter Consistency

Children must adopt constitutions consistent with the Charter:
- Parent reviews child's draft constitution
- Federation verifies Charter compliance at registration
- Ensures movement-wide coherence
- Prevents "child societies" that violate core principles

---

## Summary

The Ben Franklin Society network uses two complementary trust systems:

### Lineage: Involuntary Trust (Bootstrap)

Society lineage provides:

1. **Chain of trust** — Cryptographic verification through parent signatures
2. **Discovery mechanism** — Walk lineage to find any society
3. **Historical record** — Documents how the movement grew
4. **Social infrastructure** — Reflects real mentorship relationships
5. **Distributed authority** — No central gatekeeper, trust flows through relationships

Every society (except Philadelphia) has a parent that vouched for it at founding. This creates a tree of communities, each legitimized by those that came before. **Lineage is involuntary** — you're born with it, can't change it, and it proves your origin.

### Vouching: Voluntary Trust (Sustained)

Peer vouching provides:

1. **Earned reputation** — Societies vouch for peers based on demonstrated good behavior
2. **Dynamic trust** — Vouches verified on-demand, reflects current opinion of voucher
3. **Anti-Sybil protection** — Fake societies can't earn legitimate vouches
4. **Self-correction** — Network automatically identifies and isolates bad actors
5. **Distributed verification** — Trust requires many peers, not just parent

**Vouching is voluntary** — you earn it through behavior, peers choose to endorse you, and it proves your reliability over time.

### The Combination Is Powerful

**Lineage alone:**
- Proves you were legitimately founded
- But doesn't prove ongoing good behavior
- Can be faked by compromising one parent

**Vouching alone:**
- Proves current good behavior
- But doesn't prevent complete forgery (no founding proof)
- Can be gamed by creating fake societies to vouch for each other

**Lineage + Vouching together:**
- Lineage proves legitimate founding (need at least one parent)
- Vouching proves sustained good behavior (need many peers)
- Fake societies are obvious (founded but no vouches after 2 years)
- Network self-corrects (bad actors lose vouches, isolated automatically)
- Trust grows stronger over time (more history + more vouches)

### Trust Evolution Over Time

**Year 0 (Founding):**
- Trust: 70% lineage (parent signature), 30% unknown
- Society just entered network, no track record

**Years 1-5 (Childhood):**
- Trust: 40% lineage, 40% vouches (5-20 peers), 20% history
- Building relationships, earning first vouches

**Years 5-20 (Maturity):**
- Trust: 10% lineage, 50% vouches (50+ peers), 40% history
- Strong reputation network established

**Years 20+ (Elder Status):**
- Trust: 0% lineage, 30% vouches (200+ peers), 70% history
- Self-evident legitimacy, history speaks for itself

### Why This Is Unkillable

**Attack young network:**
- Compromise one founding society
- Found fake children
- Fakes have lineage but no vouches
- Obvious within 2-5 years

**Attack mature network:**
- Must compromise hundreds of societies to fake vouches
- OR wait decades to build fake relationships (time-consuming)
- Cannot fake operational history witnessed by many peers
- Network isolates bad actors automatically

**The older the network gets, the harder it is to destroy.** You can steal one private key to found a fake, but you cannot steal 200 private keys to vouch for it. You cannot fake 50 years of peer relationships. Trust is distributed across time, relationships, and hundreds of independent observers.

### Core Principles

**Lineage is for trust verification, not governance.** All societies are equals. No society has special authority over others. Parents do not govern children. Philadelphia is first among equals, with historical significance but no special power.

**Lineage is involuntary, vouching is voluntary.** Lineage gets you in the door (proves origin). Vouching proves you deserve to stay (proves behavior). Together, they create a self-correcting, antifragile network.

**Trust flows through relationships, not central authority.** No gatekeeper decides who's legitimate. Parent signatures prove founding. Peer vouches prove reliability. Decades of history prove longevity. The network is the authority.

This is how communities help each other come into being, how trust propagates without central control, and how the movement becomes stronger with each passing year.
