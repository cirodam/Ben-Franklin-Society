# Society Founding Workflow
## Child-Initiated Adoption Model

**Status:** Planning  
**Last Updated:** 2026-05-22  
**Decision:** Child-initiated founding process for maximum independence and resilience

---

## Philosophy

Societies should be able to **exist independently** before seeking recognition from the network. This solves:

1. **Chicken-and-egg problem** - First societies have no parent to spawn them
2. **Independence** - Communities can organize without permission
3. **Resilience** - Societies function with or without network membership
4. **Decentralization** - No central authority controls who can start a society

The founding record is a **letter of recommendation**, not a birth certificate. The parent vouches for the child's legitimacy to the wider network.

---

## Cryptographic Trust Chain

**Core Principle:** Societies are the root of legitimacy. Trust propagates through cryptographic signatures, not central authority.

### How the Chain Works

Every founding creates an **immutable cryptographic link** between parent and child:

```
Philadelphia (root) generates keypair
  Private Key: PHILLY_PRIV (kept secret)
  Public Key:  PHILLY_PUB  (published)

Philadelphia founds Boston:
  Record = { parent: PHILLY, child: BOSTON, ... }
  Signature = sign(Record, PHILLY_PRIV)
  → Proves: Philadelphia vouches for Boston

Boston founds Portland:
  Record = { parent: BOSTON, child: PORTLAND, ... }
  Signature = sign(Record, BOSTON_PRIV)
  → Proves: Boston vouches for Portland
```

**The chain:**
```
Portland ← Boston ← Philadelphia (root)
   ↑        ↑           ↑
   Signed   Signed      Trust anchor
   by       by
   Boston   Philly
```

### Verification Algorithm

Anyone can verify a society's legitimacy **without trusting any intermediary:**

```typescript
async function verifyLineage(society: string): Promise<boolean> {
  let current = society;
  const chain = [];
  
  // Walk back to root
  while (current) {
    const record = await getFoundingRecord(current);
    
    if (!record) {
      // Reached a root society (no parent)
      return isRecognizedRoot(current);
    }
    
    // Verify parent's signature on this founding record
    const valid = cryptoVerify(
      recordContent(record),
      record.signature,
      record.parent.public_key
    );
    
    if (!valid) {
      return false; // Chain broken! Invalid signature
    }
    
    chain.push(record);
    current = record.parent.handle;
  }
  
  // All signatures verified, chain leads to recognized root
  return true;
}
```

**Example verification (Portland):**
```
1. Get Portland's founding record
   → Signed by Boston's private key
   
2. Verify signature using Boston's public key
   ✓ Valid! Boston vouched for Portland
   
3. Get Boston's founding record
   → Signed by Philadelphia's private key
   
4. Verify signature using Philadelphia's public key
   ✓ Valid! Philadelphia vouched for Boston
   
5. Philadelphia is recognized root
   ✓ Trust anchor
   
Result: Portland's lineage is legitimate
```

### Trust Anchors (Root Societies)

**Root societies have no founding record** - they are trust anchors you choose to accept:

```typescript
const RECOGNIZED_ROOTS = [
  'philadelphia',  // First BFS society, founded March 2025
  'athens',        // Independent founding, May 2026
  // Additional roots added by community consensus
];

function isRecognizedRoot(handle: string): boolean {
  // You choose which roots to trust
  return RECOGNIZED_ROOTS.includes(handle);
}
```

**Root legitimacy comes from:**
- ✅ **Reputation** - Operating transparently for extended period
- ✅ **Community recognition** - Other societies vouch for them
- ✅ **Real-world verification** - People visit, meet members, verify charter
- ✅ **Longevity** - Proven track record
- ✅ **Mutual vouching** - Cross-signatures with other roots

**Roots are self-authenticating** - there's no higher authority to appeal to.

### Web of Trust (Multiple Roots)

With multiple root societies, you get a **web of trust** not a single hierarchy:

```
Philadelphia (root)              Athens (root)
├─→ Boston                       ├─→ Macon
│   ├─→ Portland ME              │   └─→ Warner Robins
│   └─→ Burlington VT            └─→ Savannah
└─→ Baltimore
    └─→ Annapolis

Cross-trust via peer vouching:
Philadelphia ←→ Athens
     ↓              ↓
  Vouches       Vouches
   for each other
```

### Peer Vouching (Between Roots)

Root societies can vouch for each other without parent-child relationship:

```json
{
  "type": "peer_vouch",
  "voucher": {
    "handle": "philadelphia",
    "public_key": "ed25519:AAAA..."
  },
  "vouchee": {
    "handle": "athens",
    "public_key": "ed25519:BBBB..."
  },
  "attestation": "We recognize Athens as a legitimate BFS society following our charter principles",
  "vouched_at": "2026-05-22T14:00:00Z",
  "signature": "..." // Signed by Philadelphia's private key
}
```

**Transitive trust:**
- If you trust Philadelphia
- And Philadelphia vouches for Athens
- Then you can trust Athens (with appropriate verification)

**Multiple vouches = stronger trust:**
```
Athens is vouched for by:
  ✓ Philadelphia
  ✓ Baltimore
  ✓ Boston
→ Strong consensus of legitimacy
```

### Why This Model is Powerful

**Decentralized Trust:**
- ❌ No certificate authority needed
- ❌ No central registry required (Federation is optional cache)
- ✅ Each society verifies independently
- ✅ Trust propagates through cryptographic proof

**Unforgeable Lineage:**
- ❌ Can't fake a founding record (requires parent's private key)
- ❌ Can't alter history (breaks signature)
- ❌ Can't claim false ancestry
- ✅ Entire chain verifiable by anyone with founding records

**Resilient:**
- ✅ Works offline (founding records are portable)
- ✅ Works without Federation (peer-to-peer sharing)
- ✅ Works with only basic connectivity
- ✅ Can rebuild entire trust network from founding records alone

**Byzantine Fault Tolerant:**
- Compromising one society doesn't break the chain
- Can detect and route around compromised nodes
- Multiple verification paths increase resilience
- Community consensus can revoke trust

### Attack Scenarios and Defenses

**Attack 1: Impersonation**
```
Bad actor: "I'm Boston, child of Philadelphia"

Defense:
  1. Request founding record
  2. Verify signature with Philadelphia's public key
  3. Signature fails! (attacker doesn't have Philly's private key)
  4. Rejected as illegitimate
```

**Attack 2: Forged Founding Record**
```
Bad actor creates fake: "I'm NewCity, child of Philadelphia"
Signs with stolen/forged signature

Defense:
  1. Signature might look valid (if well-forged)
  2. Ask Philadelphia: "Did you found NewCity?"
  3. Philadelphia: "No such child in our records"
  4. Query other societies: Does anyone know NewCity?
  5. No corroboration → rejected
```

**Attack 3: Compromised Private Key**
```
Attacker steals Boston's private key
Creates fraudulent child: "Evil Corp, founded by Boston"

Defense:
  1. Boston detects unauthorized founding record
  2. Boston publishes key revocation: "Old key compromised"
  3. Boston generates new keypair
  4. Parent (Philadelphia) signs new founding record with updated key
  5. Network transitions to new key
  6. Evil Corp founding record invalidated (signed with revoked key)
```

**Attack 4: Malicious Root**
```
Bad actor creates fake root: "I'm a BFS society"

Defense:
  1. No parent signature to verify
  2. Not in recognized roots list
  3. No vouches from established societies
  4. Network doesn't trust it
  5. Root must build reputation over time
```

**Attack 5: Split Brain (Network Partition)**
```
Network splits into two partitions
Each partition continues founding societies
Later reunite → conflicting lineages

Defense:
  1. Lineages don't conflict (both valid)
  2. Societies choose which roots to trust
  3. Federation syncs and merges histories
  4. Duplicate handles detected (UUID prevents collision)
  5. Community resolves disputes via governance
```

### The Chain IS The Authority

**Founding records are source of truth**, not any registry:

| System | Authority | Trust Model |
|--------|-----------|-------------|
| **BFS Network** | Founding record chain | Cryptographic signatures |
| Traditional DNS | ICANN + Registrars | Hierarchical bureaucracy |
| SSL/TLS | Certificate Authorities | Trusted root certs |
| PGP | Web of trust | User signatures |
| Blockchain | Consensus algorithm | Proof of work/stake |

**BFS combines best of PGP and SSL:**
- Decentralized like PGP web of trust
- Verifiable like SSL certificate chains
- No central authority like blockchain
- Simple to verify (just signature checks)

**Properties:**
- ✅ **Self-authenticating** - Records prove themselves valid
- ✅ **Portable** - Records can be stored anywhere
- ✅ **Verifiable** - Anyone can check signatures
- ✅ **Immutable** - Can't change history without breaking signatures
- ✅ **Decentralized** - No single point of failure
- ✅ **Transparent** - All founding records are public
- ✅ **Auditable** - Full history is traceable

### Practical Implementation

**Founding record storage:**
```
1. Child stores in society_identity.founding_record_json
2. Parent stores in children_societies.founding_record_json
3. Federation stores in societies.founding_record_json
4. All peers cache founding records they've seen
5. Records replicate through network gossip
```

**Verification at connection time:**
```typescript
async function connectToSociety(handle: string) {
  // 1. Resolve handle → endpoint + public key
  const society = await resolve(handle);
  
  // 2. Verify lineage back to trusted root
  const legitimate = await verifyLineage(handle);
  if (!legitimate) {
    throw new Error(`${handle} has invalid lineage`);
  }
  
  // 3. Connect to endpoint
  const conn = await connect(society.endpoint);
  
  // 4. Verify server controls private key (challenge-response)
  const verified = await verifyChallengeResponse(conn, society.public_key);
  if (!verified) {
    throw new Error(`${handle} failed key verification`);
  }
  
  return conn; // Safe to communicate
}
```

**Trust decisions are local:**
- Each society maintains their own `RECOGNIZED_ROOTS` list
- Can choose to trust only certain lineages
- Can reject specific societies despite valid signatures
- Governance votes on trust policy
- No network-wide consensus required

### Comparison to Other Trust Models

**vs. Certificate Authorities (SSL/TLS):**
- SSL: Central authorities, can be compromised, expensive
- BFS: Peer vouching, distributed trust, free

**vs. PGP Web of Trust:**
- PGP: Individual keys, hard to verify, not hierarchical
- BFS: Organizational keys, lineage provides structure, clear ancestry

**vs. Blockchain:**
- Blockchain: Consensus required, slow, energy intensive
- BFS: Simple signatures, instant verification, minimal compute

**vs. DNS:**
- DNS: Centralized, censorable, no authenticity guarantee
- BFS: Decentralized, censorship-resistant, cryptographically authenticated

---

## Parent as Location Authority

**Core Insight:** The same trust chain used for identity verification can be used for location discovery. Children periodically inform their parents of current location, creating a natural fallback mechanism when direct connection fails.

### The Problem

Societies need to be discoverable, but locations change:
- IP addresses rotate (DHCP, ISP changes)
- Servers migrate to new infrastructure
- DNS records can be outdated or hijacked
- Central registry may be unavailable

### The Solution: Parent Knows Best

**Children report location to parent periodically:**

```typescript
// Portland updates Boston every hour or on IP change
POST https://governance.bfsboston.org/api/federation/child-location
{
  "child": "portland",
  "location": {
    "url": "https://governance.portland.org",
    "ipv4": "192.168.1.100",
    "ipv6": "2001:db8::1",
    "port": 5173
  },
  "timestamp": 1716390000,
  "signature": "..." // Portland signs with private key
}
```

**Parent verifies signature and caches location:**

```typescript
// 1. Verify this is actually our child
const children = await getChildren();
const child = children.find(c => c.handle === "portland");
if (!child) return { error: "Not our child" };

// 2. Verify signature using child's public key from founding record
const message = { child: "portland", location: {...}, timestamp: 1716390000 };
const valid = await verifySignature(message, signature, child.public_key);
if (!valid) return { error: "Invalid signature - not really Portland" };

// 3. Store verified location
db.prepare(`
  INSERT OR REPLACE INTO children_locations
  (child_handle, url, ipv4, ipv6, port, last_updated, signature)
  VALUES (?, ?, ?, ?, ?, ?, ?)
`).run(child, location.url, location.ipv4, location.ipv6, location.port, timestamp, signature);
```

**Others query parent when direct connection fails:**

```typescript
// Athens trying to reach Portland
1. Try cached: https://governance.portland.org → Timeout
2. Try direct IP: 192.168.1.100 → Connection refused
3. Check founding record: parent = "boston"
4. Ask Boston: GET /api/federation/child-location/portland
5. Boston responds: { location: { ipv4: "192.168.1.200" }, age_minutes: 30 }
6. Try new IP: 192.168.1.200 → Success!
```

### Multi-Path Resolution Algorithm

**Resilient discovery with multiple fallback strategies:**

```typescript
async function connectToSociety(handle: string): Promise<Connection> {
  // STRATEGY 1: Local cache (fastest)
  const cached = getCachedLocation(handle);
  if (cached) {
    const conn = await tryConnect(cached);
    if (conn) return conn;
  }
  
  // STRATEGY 2: Federation registry (central coordination)
  if (FEDERATION_AVAILABLE) {
    const registered = await lookupInFederation(handle);
    if (registered) {
      const conn = await tryConnect(registered.endpoints);
      if (conn) {
        updateCache(handle, registered.endpoints);
        return conn;
      }
    }
  }
  
  // STRATEGY 3: Walk up parent chain (genealogical routing)
  const lineage = await getLineage(handle); // ["portland", "boston", "philadelphia"]
  
  for (const parentHandle of lineage.slice(1)) { // Start with Boston
    // Recursively connect to parent (may use strategies 1-3)
    const parentConn = await connectToSociety(parentHandle);
    
    // Ask parent where child is
    const response = await fetch(
      `${parentConn.url}/api/federation/child-location/${handle}`
    );
    
    if (response.ok) {
      const { location, age_minutes } = await response.json();
      
      // Verify location update signature
      const childRecord = await getFoundingRecord(handle);
      const valid = await verifySignature(
        { child: handle, location, timestamp: location.last_updated },
        location.signature,
        childRecord.child.public_key
      );
      
      if (valid) {
        const conn = await tryConnect(location);
        if (conn) {
          updateCache(handle, location);
          return conn;
        }
      }
    }
  }
  
  // STRATEGY 4: Query siblings (peer discovery)
  // Boston's other children might have Portland's info
  const siblings = await getSiblings(handle);
  for (const sibling of siblings) {
    const siblingConn = await connectToSociety(sibling);
    const peerLocation = await siblingConn.queryPeer(handle);
    if (peerLocation) {
      const conn = await tryConnect(peerLocation);
      if (conn) return conn;
    }
  }
  
  throw new Error(`Cannot locate society: ${handle}`);
}
```

### Security Model

**Only authenticated children can update:**

```typescript
// Attacker tries to poison Boston's cache
POST /api/federation/child-location
{
  "child": "portland",
  "location": { "ipv4": "6.6.6.6" }, // Attacker's server
  "signature": "FAKE_SIG"
}

// Boston's validation
const child = getChild("portland");
const valid = verifySignature(message, "FAKE_SIG", child.public_key);
// → false! Attacker doesn't have Portland's private key

// Request rejected, cache not poisoned
```

**Prevents common attacks:**

| Attack | Prevention |
|--------|-----------|
| **Impersonation** | Attacker can't sign without child's private key |
| **Cache Poisoning** | Signature verification fails for fake updates |
| **Man-in-Middle** | Parent-child connection uses mutual TLS + key verification |
| **Replay Attack** | Timestamp checks reject old location updates |
| **DNS Hijacking** | IP addresses obtained from cryptographically verified parent |

### Database Schema

**New table: `children_locations`**

```sql
CREATE TABLE IF NOT EXISTS children_locations (
  child_handle TEXT PRIMARY KEY,
  url TEXT,
  ipv4 TEXT,
  ipv6 TEXT,
  port INTEGER NOT NULL,
  last_updated INTEGER NOT NULL, -- Unix timestamp
  signature TEXT NOT NULL,        -- Child's signature on update
  FOREIGN KEY (child_handle) REFERENCES children_societies(child_handle)
);

CREATE INDEX idx_children_locations_updated 
  ON children_locations(last_updated);
```

### API Endpoints

**1. Receive location update from child (parent receives)**

```
POST /api/federation/child-location
Authorization: Signature <base64-signature>

Body:
{
  "child": "portland",
  "location": {
    "url": "https://governance.portland.org",
    "ipv4": "192.168.1.100",
    "ipv6": "2001:db8::1",
    "port": 5173
  },
  "timestamp": 1716390000
}

Response 200:
{
  "success": true,
  "cached_until": 1716393600
}

Response 403:
{
  "error": "Invalid signature"
}

Response 404:
{
  "error": "Not our child"
}
```

**2. Query child location (others query parent)**

```
GET /api/federation/child-location/:handle

Response 200:
{
  "handle": "portland",
  "location": {
    "url": "https://governance.portland.org",
    "ipv4": "192.168.1.100",
    "ipv6": "2001:db8::1",
    "port": 5173
  },
  "last_updated": 1716390000,
  "age_minutes": 30,
  "signature": "..." // Proof update is authentic
}

Response 404:
{
  "error": "Unknown child"
}
```

**3. Query all children locations (batch lookup)**

```
GET /api/federation/children-locations

Response 200:
[
  {
    "handle": "portland",
    "location": { ... },
    "last_updated": 1716390000,
    "age_minutes": 30
  },
  {
    "handle": "seattle",
    "location": { ... },
    "last_updated": 1716389500,
    "age_minutes": 38
  }
]
```

### Periodic Update Job

**Child societies run this every hour:**

```typescript
// In governance app hooks.server.ts or standalone service
setInterval(async () => {
  await updateParentLocation();
}, 60 * 60 * 1000); // Every hour

async function updateParentLocation() {
  const identity = await getIdentity();
  
  // Roots have no parent to notify
  if (!identity.parent_handle) {
    return;
  }
  
  // Get parent's endpoint
  const parent = await lookupSociety(identity.parent_handle);
  if (!parent) {
    console.error(`Cannot find parent: ${identity.parent_handle}`);
    return;
  }
  
  // Detect our current location
  const ourLocation = {
    url: process.env.PUBLIC_URL,
    ipv4: await getOurIPv4(), // Query external service: https://api.ipify.org
    ipv6: await getOurIPv6(), // Query: https://api64.ipify.org
    port: parseInt(process.env.PORT || '5173')
  };
  
  // Create signed update
  const update = {
    child: identity.handle,
    location: ourLocation,
    timestamp: Date.now()
  };
  
  const signature = await signMessage(
    update,
    identity.private_key_encrypted // Decrypt first
  );
  
  // Send to parent
  try {
    const response = await fetch(
      `${parent.endpoints.url}/api/federation/child-location`,
      {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Signature ${signature}`
        },
        body: JSON.stringify(update)
      }
    );
    
    if (!response.ok) {
      console.error('Parent rejected location update:', await response.text());
    } else {
      console.log(`Updated parent ${identity.parent_handle} with our location`);
    }
  } catch (error) {
    console.error('Failed to update parent:', error);
    // Non-fatal - will retry in an hour
  }
}

// Also trigger on startup and IP change
export async function handle({ event, resolve }) {
  // ... existing code ...
  
  // Update parent on first request (startup detection)
  if (!startupLocationUpdateSent) {
    startupLocationUpdateSent = true;
    updateParentLocation().catch(console.error);
  }
  
  return resolve(event);
}
```

### Benefits

**1. Natural Hierarchy**
- Parents naturally know where their children are
- Mirrors real-world family knowledge patterns
- Already have cryptographic trust relationship

**2. Self-Healing Network**
- Portland moves → tells Boston automatically
- Boston provides new location to anyone who asks
- Information propagates organically through queries

**3. Multiple Fallback Paths**
```
Cache → Federation → Parent → Grandparent → Siblings
  ↓         ↓           ↓           ↓            ↓
Fast    Coordinated  Reliable  Last Resort  Peer Mesh
```

**4. No Single Point of Failure**
- Federation down? Query parent
- Parent down? Query grandparent  
- Root down? Use Federation or siblings
- DNS compromised? Use IP from parent

**5. Scalability**
- Each parent only tracks their children (O(children) storage)
- Query depth is O(log n) up the tree
- No global coordination required
- Distributed load (each parent serves their subtree)

**6. Security**
- Only child can update location (signature required)
- Parent verifies identity using founding record public key
- Can't be poisoned by attackers (no private key = no valid signature)
- Replay protection via timestamp checks

**7. Low Maintenance**
- Automatic updates (periodic job)
- Fire-and-forget (failures are non-fatal)
- Stale data ages out naturally (clients prefer fresh info)
- No manual registry updates needed

### Example: Portland Server Migration

**Before migration:**
```
Portland's location:
  URL: https://governance.portland.org
  IP: 192.168.1.100
  Last updated: 1 hour ago
  
Boston's cache:
  portland → 192.168.1.100 (fresh)
  
Athens' cache:
  portland → 192.168.1.100 (fresh)
```

**Portland migrates to new server:**

1. Portland deploys on new server at 192.168.1.200
2. Portland updates DNS: portland.org → 192.168.1.200
3. Portland's periodic job runs:
   - Detects new IP: 192.168.1.200
   - Signs location update
   - Sends to Boston
4. Boston verifies signature and updates cache
5. Athens tries old IP: 192.168.1.100 → Connection refused
6. Athens queries Boston: "Where's Portland?"
7. Boston responds: "192.168.1.200 (updated 5 minutes ago)"
8. Athens connects to 192.168.1.200 → Success!
9. Athens caches new location

**Result:**
- Network self-heals within minutes
- No manual intervention required
- No downtime for societies who query parent
- Old cached locations fail gracefully

### Integration with Other Systems

**Works alongside:**
- **Federation Registry** - Parents' data provides backup when registry unavailable
- **DNS** - URL resolution tries DNS first, falls back to parent's IP
- **Founding Records** - Public keys verify location update signatures
- **.bfs Names** - Resolution algorithm includes parent queries
- **Peer Discovery** - Siblings share location info (future enhancement)

**Discovery Priority:**
```
1. Local cache (milliseconds)
2. DNS + Federation (seconds)  
3. Parent query (seconds to minutes)
4. Grandparent query (minutes)
5. Sibling query (minutes)
```

---

## Society States

### State 1: Isolated Root Society
**Initial state for any new society**

```
- Has governance server running
- Has generated Ed25519 keypair
- Has society_identity record with parent_handle = NULL
- No founding record
- Can operate all internal functions (governance, voting, banking, etc.)
- Cannot interact with other societies yet (no trust chain)
```

**Examples:**
- Philadelphia (first BFS society, March 2025)
- Athens (second independent BFS society, May 2026)
- Any new society before seeking adoption

### State 2: Adopted Child Society
**After parent approval**

```
- Has founding record signed by parent
- parent_handle set to parent's handle
- Can cryptographically prove lineage
- Trusted by parent's peers (transitive trust)
- Can interact with other societies
- Appears in network registry
```

**Examples:**
- Boston (founded by Philadelphia, June 2026)
- Macon (founded by Athens, July 2026)

### State 3: Parent Society
**After founding first child**

```
- Has one or more children_societies records
- Responsible for vouching for children
- Can introduce children to siblings and parent
- Has moral (not technical) responsibility for children's behavior
```

---

## Founding Workflow: Child-Initiated

### Phase 1: Child Society Independence (Already Working)

**Athens sets up their governance server:**

```bash
# Athens community installs and runs governance app
docker compose up governance

# First member creates account via /setup
# Governance, voting, banking all work locally
# No parent, no network membership yet
```

**Database state:**
```sql
-- society_identity table
handle: "athens"
uuid: "a1b2c3d4-..."
public_key: "-----BEGIN PUBLIC KEY-----\n..."
private_key_encrypted: "..." (encrypted with master key)
parent_handle: NULL
founding_record_json: NULL
founded_at: NULL
```

**Athens can now:**
- ✅ Manage members and governance
- ✅ Run elections and votes
- ✅ Operate community bank (internal only)
- ✅ Send local mail
- ❌ Not yet: Inter-society banking
- ❌ Not yet: Inter-society mail
- ❌ Not yet: Trusted by network

### Phase 2: Child Requests Adoption

**Athens decides to join the BFS network:**

**UI Flow (Athens):**
```
/federation/lineage
  Status: "Independent Root Society"
  → [Request Adoption] button

/federation/request-adoption
  Form fields:
    - Proposed parent society handle: "philadelphia"
    - Parent endpoint: "https://governance.bfsphiladelphiapa.org"
    - Message to parent (optional): "We are a BFS chapter in Athens, GA..."
    - Your contact email (for out-of-band verification)
  
  [Submit Request] →
    1. Verifies parent endpoint is reachable
    2. Verifies parent has society_identity (is a real BFS society)
    3. Checks parent capacity (max 5 children per parent)
    4. Creates adoption request JSON
    5. Signs request with Athens's private key
    6. POSTs to parent's API: /api/federation/adoption-requests
```

**Parent Capacity Constraint:**
```typescript
// Global constant for load distribution
const MAX_CHILDREN_PER_PARENT = 5;

// Check before submitting request
const parentInfo = await fetch(`${parentEndpoint}/api/federation/identity`);
const childCount = parentInfo.children?.length || 0;

if (childCount >= MAX_CHILDREN_PER_PARENT) {
  // Suggest alternatives
  return {
    error: `${parentHandle} has reached maximum capacity (${childCount}/${MAX_CHILDREN_PER_PARENT})`,
    suggestion: "Consider requesting adoption from one of their children:",
    alternatives: parentInfo.children.map(child => ({
      handle: child.handle,
      capacity: `${child.childCount}/${MAX_CHILDREN_PER_PARENT}`,
      available: child.childCount < MAX_CHILDREN_PER_PARENT
    }))
  };
}
```

**Why 5 children max?**
- **Load distribution:** Each parent handles 3-5 location queries, not hundreds
- **Balanced tree:** Network depth = log₅(n) ≈ 4-5 hops for 1000 societies
- **Governance scalability:** Parents can meaningfully evaluate each adoption request
- **Natural regionalization:** Forces geographic distribution, creates regional hubs
- **No single point of failure:** Prevents mega-hubs that become bottlenecks

**Network topology:**
```
Without limit:                    With 5-child limit:
Philadelphia (200 children)       Philadelphia (5 children)
└── Bottleneck, SPOF              ├── Boston (5 children)
                                  │   ├── Portland (3)
                                  │   ├── Providence (4)
                                  │   └── Hartford (2)
                                  ├── Pittsburgh (5)
                                  ├── Baltimore (3)
                                  ├── Richmond (4)
                                  └── Charlotte (2)
                                  
Balanced load, distributed routing
```

**Adoption Request Format:**
```json
{
  "type": "adoption_request",
  "child": {
    "handle": "athens",
    "uuid": "a1b2c3d4-...",
    "public_key": "-----BEGIN PUBLIC KEY-----\n...",
    "endpoint": "https://governance.bfsathensga.org"
  },
  "message": "We are a BFS chapter in Athens, GA, founded by...",
  "contact_email": "admin@bfsathensga.org",
  "requested_at": "2026-05-22T14:30:00Z",
  "signature": "..." // Signed by child's private key
}
```

**What happens:**
- Athens sends request to Philadelphia's `/api/federation/adoption-requests` endpoint
- Philadelphia stores in `adoption_requests` table (new)
- Philadelphia admin gets notification
- Request waits for governance review

### Phase 3: Parent Reviews Request

**UI Flow (Philadelphia):**
```
Notification: "New adoption request from 'athens'"

/federation/adoption-requests
  Pending Requests:
  
  ┌─────────────────────────────────────────┐
  │ Athens                                  │
  │ https://governance.bfsathensga.org      │
  │ Requested: 2026-05-22                   │
  │                                         │
  │ Message: "We are a BFS chapter..."      │
  │ Contact: admin@bfsathensga.org          │
  │                                         │
  │ Public Key:                             │
  │ -----BEGIN PUBLIC KEY-----              │
  │ MFkwEwYHKoZIzj0CAQYIKoZIzj0DAQc...    │
  │                                         │
  │ [Verify Signature] → ✓ Valid            │
  │ [Test Endpoint]    → ✓ Reachable        │
  │                                         │
  │ [Create Motion to Approve]              │
  │ [Reject]                                │
  └─────────────────────────────────────────┘
```

**Philadelphia admin can:**
- Verify request signature (proves Athens controls their private key)
- Test endpoint (proves server is running)
- Review message and contact info
- Contact Athens out-of-band for vetting (phone call, visit, etc.)

### Phase 4: Governance Vote

**Philadelphia creates a motion:**
```
Motion Type: Founding Child Society
Title: "Recognize Athens GA as child society"
Description: |
  Adopt Athens (athens.bfs) as a child society.
  
  - Endpoint: https://governance.bfsathensga.org
  - Contact: admin@bfsathensga.org
  - Founded: 2026-05-15
  - Members: 12
  
  By approving this motion, we vouch for Athens's legitimacy
  to the wider BFS network and agree to:
  - Introduce them to our parent (if any) and siblings
  - Help them get started with inter-society services
  - Serve as their first peer in the network
  
Attachment: adoption_request.json

Vote: [Approve] [Reject]
```

**If motion passes:**
- Philadelphia's system automatically generates founding record
- Signs with Philadelphia's private key
- Sends to Athens via callback API

**If motion fails:**
- Philadelphia sends rejection notice to Athens
- Athens remains independent root society
- Athens can try again or request adoption from different society

### Phase 5: Parent Signs Founding Record

**Automated upon motion passage:**

```typescript
// Philadelphia's system executes:
async function approveAdoption(requestId: string) {
  const request = getAdoptionRequest(requestId);
  const parentIdentity = getIdentity(); // Philadelphia's identity
  
  // Verify we haven't reached capacity
  const childCount = db.prepare(`
    SELECT COUNT(*) as count FROM children_societies
    WHERE parent_handle = ?
  `).get(parentIdentity.handle).count;
  
  if (childCount >= MAX_CHILDREN_PER_PARENT) {
    throw new Error(`Cannot adopt: at maximum capacity (${childCount}/${MAX_CHILDREN_PER_PARENT})`);
  }
  
  const foundingRecord: FoundingRecord = {
    type: 'society_founding',
    parent: {
      handle: parentIdentity.handle,
      uuid: parentIdentity.uuid,
      public_key: parentIdentity.public_key
    },
    child: {
      handle: request.child.handle,
      uuid: request.child.uuid,
      public_key: request.child.public_key
    },
    founded_at: new Date().toISOString(),
    parent_attestation: `Recognized by vote of ${parentIdentity.handle} governance on ${new Date().toISOString()}`,
    signature: signWithPrivateKey(foundingRecord) // Philadelphia signs
  };
  
  // Store in children_societies table
  db.prepare(`
    INSERT INTO children_societies 
    (handle, uuid, public_key, founding_record_json, founded_at)
    VALUES (?, ?, ?, ?, ?)
  `).run(
    request.child.handle,
    request.child.uuid,
    request.child.public_key,
    JSON.stringify(foundingRecord),
    Math.floor(Date.now() / 1000)
  );
  
  // Send to child
  await fetch(`${request.child.endpoint}/api/federation/adoption-response`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      status: 'approved',
      founding_record: foundingRecord
    })
  });
  
  // Register with Federation (if available)
  if (FEDERATION_ENDPOINT) {
    await registerWithFederation({
      foundingRecord,
      endpoint: request.child.endpoint
    });
  }
}
```

### Phase 6: Child Receives Founding Record

**Athens receives POST to `/api/federation/adoption-response`:**

```typescript
// Athens's system receives:
async function handleAdoptionResponse(response) {
  if (response.status === 'approved') {
    const { founding_record } = response;
    
    // Verify parent's signature
    const valid = verifyFoundingRecord(founding_record);
    if (!valid) {
      throw new Error('Invalid founding record signature');
    }
    
    // Update society_identity with parent info
    db.prepare(`
      UPDATE society_identity
      SET parent_handle = ?,
          founding_record_json = ?,
          founded_at = ?
      WHERE handle = ?
    `).run(
      founding_record.parent.handle,
      JSON.stringify(founding_record),
      new Date(founding_record.founded_at).getTime() / 1000,
      founding_record.child.handle
    );
    
    // Cache parent in societies table
    cacheSociety({
      handle: founding_record.parent.handle,
      uuid: founding_record.parent.uuid,
      endpoint: founding_record.parent.endpoint, // Need to discover this
      publicKey: founding_record.parent.public_key,
      lineage: [founding_record.parent.handle]
    });
    
    // Register with Federation (if available)
    if (FEDERATION_ENDPOINT) {
      await registerWithFederation({
        foundingRecord: founding_record,
        endpoint: OUR_ENDPOINT
      });
    }
    
    // Notify admin
    console.log(`✓ Adoption approved by ${founding_record.parent.handle}`);
  }
}
```

**Database state (Athens):**
```sql
-- society_identity table (updated)
handle: "athens"
parent_handle: "philadelphia"
founding_record_json: "{...}" -- Contains Philadelphia's signature
founded_at: 1716390000

-- societies table (new entry for parent)
handle: "philadelphia"
uuid: "..."
endpoint: "https://governance.bfsphiladelphiapa.org"
public_key: "..."
```

**UI Update (Athens):**
```
/federation/lineage
  Status: "Child Society"
  Parent: Philadelphia
  Founded: May 22, 2026
  
  [View Founding Record]
  [Verify Signature] → ✓ Valid
```

---

## Technical Implementation

### New Database Tables

**adoption_requests** (parent society only)
```sql
CREATE TABLE IF NOT EXISTS adoption_requests (
  id                INTEGER PRIMARY KEY AUTOINCREMENT,
  child_handle      TEXT NOT NULL,
  child_uuid        TEXT NOT NULL,
  child_public_key  TEXT NOT NULL,
  child_endpoint    TEXT NOT NULL,
  message           TEXT,
  contact_email     TEXT,
  request_json      TEXT NOT NULL, -- Full signed request
  requested_at      INTEGER NOT NULL,
  status            TEXT NOT NULL DEFAULT 'pending', -- pending, approved, rejected
  reviewed_by       TEXT REFERENCES person(uuid),
  reviewed_at       INTEGER,
  motion_uuid       TEXT, -- Link to governance motion
  created_at        INTEGER DEFAULT (unixepoch())
);

CREATE INDEX IF NOT EXISTS idx_adoption_requests_status 
  ON adoption_requests(status, requested_at DESC);
```

### New API Endpoints

**Child → Parent: Submit Request**
```
POST /api/federation/adoption-requests
Body: { AdoptionRequest }

Returns 201: 
{ 
  request_id: "123", 
  status: "pending" 
}

Returns 409:
{
  error: "Parent at maximum capacity (5/5 children)",
  suggestion: "Consider requesting adoption from one of their children",
  alternatives: [
    { handle: "boston", capacity: "3/5", endpoint: "..." },
    { handle: "pittsburgh", capacity: "4/5", endpoint: "..." }
  ]
}

Validation:
- Verify child signature on request
- Check parent capacity (MAX_CHILDREN_PER_PARENT = 5)
- Verify child endpoint is reachable
- Store in adoption_requests table
```

**Parent → Child: Send Response**
```
POST /api/federation/adoption-response
Body: { status: "approved"|"rejected", founding_record?: FoundingRecord }
Returns: { received: true }
```

**Parent: List Pending Requests**
```
GET /api/federation/adoption-requests
Returns: { requests: AdoptionRequest[] }
```

**Parent: Approve Request (creates motion)**
```
POST /api/federation/adoption-requests/:id/approve
Returns: { motion_uuid }
```

**Public: Query Society Info (for capacity checking)**
```
GET /api/federation/identity

Returns:
{
  handle: "philadelphia",
  uuid: "...",
  public_key: "...",
  parent_handle: null,
  founded_at: 1711929600,
  children: [
    { handle: "boston", founded_at: 1714521600 },
    { handle: "pittsburgh", founded_at: 1715126400 },
    { handle: "baltimore", founded_at: 1715731200 }
  ],
  capacity: {
    current: 3,
    maximum: 5,
    available: true
  },
  endpoint: "https://governance.bfsphiladelphiapa.org"
}
```

### New UI Pages

**Child Society:**
- `/federation/request-adoption` - Form to request adoption
- `/federation/lineage` - Updated to show adoption status

**Parent Society:**
- `/federation/adoption-requests` - List and review requests
- `/federation/children` - List all societies you've founded
- Motion type: "Found Child Society"

---

## Security Considerations

### Signature Verification
- Child signs adoption request with their private key
- Parent signs founding record with their private key
- Both signatures must verify before acceptance
- Prevents impersonation and forgery

### Endpoint Verification
- Parent should test child endpoint is reachable
- Parent can request out-of-band verification (phone, email)
- Prevents DNS spoofing

### Governance Approval
- Parent requires governance vote to approve
- Not automatic - human review required
- Prevents spam/abuse

### Key Control
- Child generates and controls their own keypair
- No key transfer needed (more secure)
- Child can't blame parent if key compromised

---

## Root Societies: The Bootstrap Problem

**The first society (Philadelphia):**
```sql
-- Has no parent, no founding record
parent_handle: NULL
founding_record_json: NULL
founded_at: 1711929600 -- March 2025
```

**Second independent society (Athens):**
```sql
-- Also starts as root, then optionally seeks adoption
parent_handle: NULL → "philadelphia" (after adoption)
founding_record_json: NULL → "{...}" (after adoption)
```

**Root societies are legitimate by existence:**
- No one can prove they're "legitimate" BFS societies
- They establish legitimacy through operation and reputation
- They can adopt children who inherit that legitimacy
- Multiple root societies can exist (federated model)

**Trust model:**
- Root societies must bootstrap trust through real-world interaction
- Child societies inherit trust from parent's signature
- Network grows via web of trust, not central authority

---

## Edge Cases

### Parent Society Dissolves
- Child keeps founding record (historical proof)
- Child's lineage unchanged (immutable history)
- Child can re-parent if needed (new founding record)
- Or remain as "orphan" with historical parent reference

### Child Wants Multiple Parents
- **Not supported** - single lineage only
- Choose wisest/closest parent
- Can have multiple *peers* but only one parent

### Sibling Introduction
- Parent should introduce new child to existing children
- Happens after adoption approval
- Parent POSTs to each sibling: "New sibling: athens"
- Siblings automatically cache each other

### Retroactive Adoption
- Society operating for years as root
- Wants to join network later
- Same process - request adoption from established society
- Founding date reflects original founding, adopted_at is different

### Federation Offline During Adoption
- Adoption still works (peer-to-peer)
- Both societies store founding record locally
- Register with Federation when it comes back online
- Federation syncs historical founding records

---

## Migration Path

**Current State:**
- Athens: Running in production, no society_identity yet
- Philadelphia: Not deployed yet

**Step 1: Initialize as Roots**
```
Both Athens and Philadelphia initialize as root societies:
- Generate keypairs
- Create society_identity records with parent_handle = NULL
- Operate independently
```

**Step 2: Optional Adoption**
```
If Athens wants to join network through Philadelphia:
- Athens requests adoption
- Philadelphia approves (or vice versa)
- Founding record created
```

**Step 3: Future Societies**
```
New societies (Macon, Boston, etc.):
- Start as roots (independence)
- Request adoption from nearest/most appropriate society
- Join network via proven lineage
```

---

## DNS Bypass: Direct IP Connectivity

**Requirement:** Societies must be able to communicate even if DNS is censored, hijacked, or unavailable.

### Multi-Path Endpoint Format

Each society publishes multiple connectivity options:

```json
{
  "handle": "athens",
  "uuid": "...",
  "public_key": "...",
  "endpoints": {
    "primary_url": "https://governance.bfsathensga.org",
    "ipv4": "168.144.12.116",
    "ipv6": "2001:db8:85a3::8a2e:370:7334",
    "port": 5173,
    "tor_onion": "athens...onion:5173",
    "i2p": "athens.i2p"
  },
  "services": {
    "governance": 5173,
    "bank": 5174,
    "mail": 5175,
    "marketplace": 5176
  }
}
```

### Resolution Algorithm (Multi-Path)

```typescript
async function resolveAndConnect(handle: string): Promise<Connection> {
  const record = await resolveBfsName(handle); // From Federation or cache
  
  // Try connection methods in order of preference
  const methods = [
    // 1. Primary URL via DNS (fast, works with normal SSL)
    () => connectViaUrl(record.endpoints.primary_url),
    
    // 2. Direct IPv4 (bypass DNS)
    () => connectViaIp(record.endpoints.ipv4, record.endpoints.port),
    
    // 3. Direct IPv6 (bypass DNS, better for peer networks)
    () => connectViaIp(record.endpoints.ipv6, record.endpoints.port),
    
    // 4. Tor (anonymity + censorship resistance)
    () => connectViaTor(record.endpoints.tor_onion),
    
    // 5. I2P (alternative darknet)
    () => connectViaI2p(record.endpoints.i2p)
  ];
  
  for (const method of methods) {
    try {
      const conn = await method();
      if (await verifyConnection(conn, record.public_key)) {
        return conn;
      }
    } catch (error) {
      continue; // Try next method
    }
  }
  
  throw new Error(`Could not connect to ${handle} via any method`);
}
```

### Connection Verification

**Every connection MUST be cryptographically verified:**

```typescript
async function verifyConnection(conn: Connection, publicKey: string): Promise<boolean> {
  // 1. Request challenge
  const challenge = randomBytes(32);
  const response = await conn.post('/api/challenge', { challenge });
  
  // 2. Verify signature
  const valid = verify(
    challenge,
    response.signature,
    publicKey
  );
  
  return valid;
}
```

This prevents:
- DNS spoofing
- Man-in-the-middle attacks
- Connection to wrong server (even if IP is correct)

### HTTPS with Direct IP Connections

**Problem:** SSL certificates are domain-based, not IP-based.

**Solutions:**

**Option A: Self-Signed Certificates (Simplest)**
```
- Society generates self-signed cert
- Certificate fingerprint stored in .bfs record
- Clients verify fingerprint, not CA chain
- Works because we already have public key verification
```

**Option B: Certificate Pinning**
```
- Society gets real SSL cert for their .org domain
- Certificate fingerprint stored in .bfs record
- Clients connect via IP but verify cert fingerprint
- SNI header set to .org domain for routing
```

**Option C: TLS with Pre-Shared Keys**
```
- Use society's Ed25519 keys for TLS handshake
- No certificates needed
- Custom TLS implementation or mTLS
```

**Recommended: Option A for direct IP, Option B for hybrid**

### Updated Database Schema

```sql
-- Update societies table
CREATE TABLE IF NOT EXISTS societies (
  handle              TEXT PRIMARY KEY,
  uuid                TEXT UNIQUE NOT NULL,
  
  -- Primary endpoint (URL with DNS)
  endpoint_url        TEXT NOT NULL,
  
  -- Direct IP connectivity (bypass DNS)
  ipv4_address        TEXT,
  ipv6_address        TEXT,
  port                INTEGER DEFAULT 5173,
  
  -- Certificate verification
  cert_fingerprint    TEXT, -- SHA256 of SSL cert
  
  -- Alternative networks
  tor_onion           TEXT,
  i2p_address         TEXT,
  
  -- Service ports
  governance_port     INTEGER DEFAULT 5173,
  bank_port           INTEGER DEFAULT 5174,
  mail_port           INTEGER DEFAULT 5175,
  marketplace_port    INTEGER DEFAULT 5176,
  
  -- Existing fields...
  public_key          TEXT NOT NULL,
  lineage_json        TEXT,
  last_lineage_verified INTEGER,
  latitude            REAL,
  longitude           REAL,
  last_interaction    INTEGER,
  interaction_count   INTEGER DEFAULT 0,
  discovered_at       INTEGER DEFAULT (unixepoch()),
  
  -- Connection tracking
  last_successful_method TEXT, -- 'url', 'ipv4', 'ipv6', 'tor', 'i2p'
  last_connected_at   INTEGER
);
```

### IP Address Discovery

**How does a society know its public IP?**

```typescript
// On governance server startup
async function discoverPublicIp() {
  // Method 1: Query external service
  const ipv4 = await fetch('https://api.ipify.org?format=json')
    .then(r => r.json())
    .then(d => d.ip);
  
  // Method 2: Extract from incoming requests
  const ipFromHeader = request.headers.get('x-real-ip');
  
  // Method 3: Query via STUN (for NAT traversal)
  const stunIp = await stunQuery('stun.l.google.com:19302');
  
  return { ipv4, ipv6: null }; // IPv6 detection similar
}

// Update registry periodically
setInterval(async () => {
  const { ipv4, ipv6 } = await discoverPublicIp();
  await updateRegistryEndpoint({
    handle: 'athens',
    ipv4,
    ipv6,
    signature: signUpdate({ ipv4, ipv6, timestamp: Date.now() })
  });
}, 3600000); // Every hour
```

### Updated Founding Record Format

```json
{
  "type": "society_founding",
  "parent": {
    "handle": "philadelphia",
    "uuid": "...",
    "public_key": "..."
  },
  "child": {
    "handle": "athens",
    "uuid": "...",
    "public_key": "...",
    "endpoints": {
      "url": "https://governance.bfsathensga.org",
      "ipv4": "168.144.12.116",
      "ipv6": null,
      "port": 5173
    }
  },
  "founded_at": "2026-05-22T...",
  "parent_attestation": "...",
  "signature": "..."
}
```

### Implementation Phases

**Phase 1: URL-only (Current)**
- Registry stores `endpoint` (URL string)
- All connections via DNS
- Works with existing infrastructure

**Phase 2: IP Fallback**
- Registry stores both URL and IP addresses
- Try URL first, fallback to IP if DNS fails
- Self-signed cert verification for IP connections

**Phase 3: Multi-Path**
- Add Tor/I2P support
- Automatic connection method selection
- Performance tracking (which method worked)

**Phase 4: Full P2P**
- NAT traversal (STUN/TURN)
- Direct peer-to-peer when both behind NAT
- Relay nodes for unreachable peers

---

## Open Questions

1. **Should parent endpoint be in founding record?**
   - Currently not included (just handle, uuid, public_key)
   - Child needs to discover parent endpoint separately
   - Could add but makes record less portable
   - **UPDATE:** Should include full endpoints object with IP addresses

2. **Can a child switch parents (re-adoption)?**
   - Lineage should be immutable
   - But practical need if parent dissolves
   - Maybe: Keep historical lineage, add "adopted_by" field?

3. **How to handle parent-child disputes?**
   - Parent can't revoke founding record (signature is permanent)
   - But parent can refuse to vouch for child to others
   - Network can exclude bad actors (not protocol-level)

4. **Should Federation validate founding records?**
   - Yes: Verify parent signature before accepting registration
   - But Federation is just a cache (societies are source of truth)
   - Invalid founding records ignored/flagged

5. **How to handle dynamic IPs?**
   - Societies on residential ISPs may have changing IPs
   - Need periodic IP update mechanism
   - Should cache last-known-good IP
   - Maybe: Multiple IP addresses (history) for resilience

6. **NAT traversal for home-hosted societies?**
   - Many societies may run behind NAT/firewall
   - Need STUN/TURN for hole-punching
   - Or require port forwarding (simpler but manual)
   - Or relay through well-connected peers

---

## Next Steps

**Immediate (Phase 1):**
1. Add `adoption_requests` table to schema
2. Create adoption request API endpoints
3. Build `/federation/request-adoption` UI (child)
4. Build `/federation/adoption-requests` UI (parent)

**Soon (Phase 2):**
5. Integrate with governance motion system
6. Build automatic founding record generation
7. Add sibling introduction protocol
8. Deploy Federation and test registration

**Later (Phase 3):**
9. Add lineage walking for discovery
10. Add peer gossip protocol
11. Build full p2p discovery (Federation optional)
