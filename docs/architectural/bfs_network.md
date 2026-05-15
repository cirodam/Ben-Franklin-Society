# The Ben Franklin Society
## .bfs Network & Society Lineage
### Design Document

---

## Overview

The Ben Franklin Society network uses a dual-stack addressing system:
- **`.org` domains** — Public internet access via traditional DNS, used for external-facing websites and services
- **`.bfs` domains** — Distributed mesh network resolved via cryptographic registry

The `.bfs` network is designed in the spirit of the original internet: distributed, peer-to-peer, resilient, with no single point of failure. The Federation acts as a coordination tool and "root nameserver" but the system continues to function even when the Federation is offline.

**What uses .bfs:**
- Ben Franklin Society communities (`philadelphia.bfs`, `boston.bfs`)
- Personal sites registered through society registrars (`alice.bfs`)
- Society-sponsored subdomains for members (`alice.philadelphia.bfs`)
- Community projects and local businesses (`bakery.bfs`, `mutual-aid.boston.bfs`)
- Self-registered independent sites (no society vouching)

**How it works:**
- Societies function as **domain registrars**, competing to provide registration services
- Users pay registration fees in Franks (market-rate pricing)
- Society's signature cryptographically vouches for domain holder
- Multiple resolution paths: Federation → neighbors → lineage walk
- No single point of failure, works even when Federation is offline

The namespace is open. Anyone can register a `.bfs` domain through any society's registrar service, or self-register directly with the Federation.

---

## Society Lineage

### Genealogy as Infrastructure

Every Ben Franklin Society (except the founding society) has a **parent society** — the established community that helped found it. This creates a tree structure rooted at the original society:

```
Philadelphia (founding society, 2025)
├─→ Boston (founded 2026, parent: Philadelphia)
│   ├─→ Portland ME (2027, parent: Boston)
│   └─→ Burlington VT (2027, parent: Boston)
├─→ Baltimore (2026, parent: Philadelphia)
└─→ Pittsburgh (2027, parent: Philadelphia)
    └─→ Columbus OH (2028, parent: Pittsburgh)
```

### What a Child Inherits

When a parent society helps found a new society, the child inherits:

- **Parent's public key** — Immediate trust relationship for secure communication
- **Sibling introductions** — Contact details for other children of the same parent
- **Ancestor chain** — Complete lineage path back to the founding society
- **Charter & templates** — Founding documents, procedures, constitutional templates
- **Initial neighbors** — Parent's known peers become child's initial neighbor cache

This inheritance is cryptographically verified. The parent signs the child's founding record, which includes:
- Child's society name and handle
- Child's public key
- Child's initial endpoints (`.org` and `.bfs`)
- Founding date and timestamp
- Parent's signature

### Founding Ceremony

When a new society is founded:

1. **Parent society votes** to formally recognize the new community
2. **Parent generates founding record** — signed document attesting to child's legitimacy
3. **Child generates keypair** — establishes its own cryptographic identity
4. **Parent introduces child** to its neighbors and to the Federation
5. **Child caches lineage** — stores complete path back to root: `child → parent → grandparent → ... → root`

The founding record is the child's proof of legitimacy. It can be presented to any society to establish initial trust.

### Lineage Properties

- **Single parent** — Each society has exactly one parent (no mergers, no multiple lineage)
- **Immutable history** — Lineage cannot be changed once established
- **No re-parenting** — If a parent society dissolves, the child retains its historical lineage
- **No special authority** — The founding society has historical significance but no governance power over descendants

The root society (Philadelphia) is first among equals. It has seniority in the lineage tree but no inherent authority over other societies.

---

## .bfs Name Resolution

### Record Format

Every society publishes a signed `.bfs` record to the network:

```json
{
  "handle": "philadelphia",
  "domain": "philadelphia.bfs",
  "endpoints": {
    "governance": "https://governance.philadelphia.org",
    "bank": "https://bank.philadelphia.org",
    "mail": "https://mail.philadelphia.org",
    "marketplace": "https://marketplace.philadelphia.org"
  },
  "public_key": "ed25519:AAAA...",
  "parent": null,
  "lineage": ["philadelphia"],
  "coordinates": {"lat": 39.9526, "lon": -75.1652},
  "published_at": "2025-06-15T12:00:00Z",
  "ttl": 86400,
  "signature": "..."
}
```

The signature covers all fields except `signature` itself. It proves:
- The record was created by the society's private key holder
- The content has not been tampered with
- The endpoints are authentic

### Resolution Algorithm

When a custom `.bfs` browser client needs to resolve `columbus.bfs`:

```
1. Check local cache
   ├─→ HIT: Verify signature, check TTL, use if valid
   └─→ MISS: Continue to step 2

2. Query Federation (fast path)
   ├─→ SUCCESS: Cache record, verify signature, return
   └─→ TIMEOUT/OFFLINE: Continue to step 3

3. Query known neighbors (recursive)
   ├─→ Broadcast "WHO_HAS columbus" to cached neighbors
   ├─→ Neighbors check their caches and return if found
   ├─→ SUCCESS: Verify signature, cache, return
   └─→ NO RESPONSES: Continue to step 4

4. Query parent society (lineage walk)
   ├─→ Ask parent "Do you know columbus?"
   ├─→ Parent checks siblings, cousins, own cache
   ├─→ SUCCESS: Verify signature, cache, return
   └─→ MISS: Continue to step 5

5. Query grandparent (escalate up lineage)
   ├─→ Walk up lineage chain (parent → grandparent → ... → root)
   ├─→ Each ancestor searches its descendants
   ├─→ SUCCESS: Verify signature, cache, return
   └─→ MISS: Return "NOT_FOUND"
```

### Cryptographic Verification

Every `.bfs` record retrieved from any source must be verified before use:

1. **Parse record** — Extract fields and signature
2. **Verify signature** — Use `public_key` field to verify signature matches content
3. **Check TTL** — Ensure `published_at + ttl` is in the future
4. **Validate endpoints** — Ensure they are well-formed URLs

If verification fails, the record is rejected and resolution continues. This prevents:
- **Spoofing** — Cannot forge a record without the private key
- **Tampering** — Altering any field invalidates the signature
- **Cache poisoning** — Malicious peers cannot inject fake records

Records are **self-authenticating**. No certificate authority is needed. The signature proves the record came from the society it claims to represent.

---

## Federation's Role

The Federation is the **authoritative registry** for `.bfs` records, but it is not required for resolution.

### What the Federation Does

1. **Maintains canonical registry** — Stores all published `.bfs` records in a central database
2. **Serves as root nameserver** — Provides fast, authoritative resolution when online
3. **Tracks lineage tree** — Maintains complete genealogy of all societies
4. **Verifies founding records** — Checks parent signatures when new societies register
5. **Serves historical records** — Provides ancestor chain for any society

### What the Federation Does Not Do

- **Does not control resolution** — Societies can resolve names without Federation
- **Does not validate signatures** — Each client verifies signatures locally
- **Does not route traffic** — All communication is direct peer-to-peer
- **Does not have special keys** — Cannot sign records on behalf of societies

### Federation Availability

When the Federation is **online**:
- Resolution is fast (single authoritative query)
- New societies can register immediately
- Lineage queries are instant

When the Federation is **offline**:
- Resolution falls back to peer-to-peer discovery
- Societies use cached records and neighbor queries
- Lineage walks happen via direct parent/grandparent queries
- New societies cannot register (must wait for Federation to return)

The network degrades gracefully. Existing societies can communicate indefinitely without the Federation. Only founding new societies requires Federation availability.

---

## Distributed Discovery Mechanisms

### Neighbor Caching

Every society maintains a `neighboring_society` table:

```sql
CREATE TABLE neighboring_society (
  society_handle TEXT PRIMARY KEY,
  bfs_domain TEXT NOT NULL,
  endpoints TEXT NOT NULL, -- JSON
  public_key TEXT NOT NULL,
  parent_handle TEXT,
  lineage TEXT NOT NULL, -- JSON array
  last_seen_at INTEGER NOT NULL,
  cached_at INTEGER NOT NULL
);
```

When a society communicates with a peer (for banking, mail, etc.), it caches that peer's `.bfs` record. The cache is:
- **Automatically refreshed** — Re-verified on each contact
- **Shared with neighbors** — Peers can query each other's caches
- **Time-limited** — Records expire based on TTL
- **Signature-verified** — Invalid records are purged

### Recursive Queries

When Society A needs to resolve `unknown.bfs`:

1. A broadcasts `WHO_HAS unknown` to its cached neighbors (B, C, D, ...)
2. Each neighbor checks its cache and responds if it has a valid record
3. A receives responses, verifies signatures, caches best result
4. If multiple responses, prefer: most recent, shortest lineage distance, lowest latency

This is a **gossip protocol**. Records propagate through the network as societies communicate. Frequently-contacted societies are cached by many peers. Obscure societies may only be known via lineage queries.

### Lineage-Based Discovery

If recursive queries fail, walk the lineage tree:

```
Columbus needs to reach Portland ME:

1. Query parent (Pittsburgh) → MISS
2. Query grandparent (Philadelphia) → "Portland is grandchild via Boston"
3. Query Philadelphia's cache → Returns Boston's record
4. Query Boston directly → Returns Portland's record
5. Cache Portland's record, establish direct connection
```

Lineage guarantees a path exists between any two societies. In the worst case, walk all the way to the root and broadcast down the tree.

---

## Custom Browser Client

A `.bfs` browser is a lightweight client (browser extension or standalone app) that:

1. **Intercepts `.bfs` requests** — Detects when user visits `*.bfs` domain
2. **Resolves via distributed protocol** — Uses Federation → neighbors → lineage
3. **Verifies signatures** — Rejects invalid records
4. **Caches aggressively** — Reduces Federation dependency
5. **Falls back to normal DNS** — For `.org`, `.com`, etc.

### User Experience

```
User visits: columbus.bfs

Browser extension:
1. Resolves columbus.bfs → endpoints object
2. Determines service (governance, bank, mail, marketplace)
3. Redirects to actual endpoint: https://governance.columbus.org
4. User sees columbus.bfs in address bar (overlay)
5. Green lock icon shows cryptographic verification
```

The `.bfs` domain is a **semantic layer** over traditional HTTPS. It provides:
- **Discovery** — Find societies without DNS
- **Trust** — Verify endpoints cryptographically
- **Resilience** — Multiple resolution paths
- **Privacy** — Queries don't leak to central authority

---

## Non-Society .bfs Sites

The `.bfs` namespace is not limited to Ben Franklin Society communities. Individuals, projects, blogs, and other entities can publish content on `.bfs` domains.

### Personal Sites

Individuals can get `.bfs` domains in two ways:

**Option 1: Register top-level domain through society registrar**
```
alice.bfs              → Alice's personal blog (registered via Philadelphia)
bakery.bfs             → Local bakery (registered via Baltimore)
mutual-aid.bfs         → Community project (registered via Boston)
```

Process:
1. Alice contacts Philadelphia's registrar service
2. Pays registration fee (e.g., 50 Franks/year, or free if member)
3. Provides public key and endpoint
4. Philadelphia signs and publishes record
5. Alice owns `alice.bfs`, Philadelphia vouches for it

**Option 2: Society-sponsored subdomain (member benefit)**
```
alice.philadelphia.bfs     → Alice's subdomain (sponsored by Philadelphia)
bakery.baltimore.bfs       → Local business subdomain (sponsored by Baltimore)
mutual-aid.boston.bfs      → Community project subdomain (sponsored by Boston)
```

Process:
1. **Member requests subdomain** — Alice asks Philadelphia to sponsor `alice.philadelphia.bfs`
2. **Society approves** — Philadelphia's governance decides (could be automatic for members)
3. **Society signs record** — Philadelphia creates and signs a `.bfs` record for Alice's site
4. **Record published** — Record is published to Federation and distributed via peer network
5. **Alice controls content** — Alice hosts her site wherever she wants, society vouches for the domain

**Trust model:**
- Society's signature vouches for the domain holder's identity
- Society does not control content (just attests domain ownership)
- Society can revoke if domain is used for abuse/spam
- Members keep their subdomains as long as they're in good standing

### Independent .bfs Sites

Sites can register top-level `.bfs` domains through **societies acting as registrars**.

#### Societies as Registrars

Any society can function as a domain registrar, providing registration services to anyone (not just their own members):

```
Alice wants alice.bfs:
1. Contacts Philadelphia (or any society offering registrar services)
2. Pays registration fee (e.g., 50 Franks per year)
3. Provides public key and endpoint information
4. Philadelphia verifies payment, creates and signs the record
5. Philadelphia publishes record to Federation
6. Alice controls the domain, Philadelphia vouches for it
```

**Economic model:**
- Societies set their own registration fees (market competition)
- Revenue goes to society's general fund
- Creates economic incentive for societies to provide quality service
- Societies can offer free/discounted registrations to their own members
- Multi-year registrations possible (discount for prepayment)

**Society responsibilities as registrar:**
- Verify registrant identity (KYC if desired, or pseudonymous)
- Sign and publish domain records
- Handle renewals (annual or multi-year)
- Provide technical support
- Revoke domains only for egregious abuse (spam, phishing, malware)

**Trust model:**
- Society's signature vouches for domain holder
- Society doesn't control content (holder controls hosting)
- User sees: "Registered by Philadelphia • Vouched since 2026"
- Societies build reputation as registrars (good/bad service, reasonable revocation policies)

**Why this works better than direct Federation registration:**
- **Distributed trust** — Multiple registrars, not single point
- **Economic sustainability** — Societies earn revenue for providing service
- **Accountability** — Societies have reputation incentive to police abuse
- **Competition** — Societies compete on price, service quality, policies
- **Spam prevention** — Cost barrier + society verification
- **Identity verification** — Societies can choose verification level

#### Direct Federation Registration (Alternative)

For users who don't want society vouching, direct registration is possible:

1. **Submit to Federation directly** — No society intermediary
2. **Pay higher fee** — e.g., 200 Franks (spam prevention + no vouching discount)
3. **Self-sign record** — Generate own keypair, sign own record
4. **Publish to network** — Federation distributes, peers cache

**Trust model:**
- No society vouches for authenticity
- Browser shows "Self-registered - verify identity independently"
- Good for pseudonymous sites that don't want identity verification
- Can build reputation over time through peer reviews/links

Most users would prefer society registration (lower cost + trusted vouching). Direct registration is for edge cases: anonymity, distrust of all registrars, philosophical preference.

### Subdomain Delegation

Societies can delegate subdomain signing authority:

```
Philadelphia sponsors:
├─→ members.philadelphia.bfs (delegated to membership committee)
│   ├─→ alice.members.philadelphia.bfs
│   └─→ bob.members.philadelphia.bfs
├─→ projects.philadelphia.bfs (delegated to project coordinator)
│   ├─→ food-coop.projects.philadelphia.bfs
│   └─→ tool-library.projects.philadelphia.bfs
└─→ businesses.philadelphia.bfs (delegated to commerce service)
    └─→ bakery.businesses.philadelphia.bfs
```

**Delegation record:**
- Parent signs record delegating signing authority for subdomain
- Delegate generates own keypair for signing child records
- Child records include both delegate signature AND parent's delegation record
- Verification checks both signatures in chain

### Use Cases

**Personal publishing:**
- Member blogs, portfolios, personal projects
- No corporate hosting, no surveillance capitalism
- Society provides infrastructure support

**Community projects:**
- Mutual aid networks, tool libraries, time banks
- Neighborhood associations, block clubs
- Open source projects, digital commons

**Local businesses:**
- Society member businesses get authentic .bfs presence
- Customers can verify business is society-vetted
- Alternative to corporate platforms (Yelp, Google, etc.)

**Information resources:**
- Community wikis, documentation, archives
- Local news sites, event calendars
- Educational resources, tutorials

### Record Format for Non-Society Sites

**Subdomain (society-sponsored):**
```json
{
  "domain": "alice.philadelphia.bfs",
  "type": "personal_subdomain",
  "sponsor": "philadelphia",
  "endpoints": {
    "website": "https://alice.example.com"
  },
  "owner_public_key": "ed25519:BBBB...",
  "registered_at": "2026-03-15T12:00:00Z",
  "expires_at": null,
  "ttl": 86400,
  "sponsor_signature": "...",
  "owner_signature": "..."
}
```

**Top-level (society-registered):**
```json
{
  "domain": "alice.bfs",
  "type": "registered",
  "registrar": "philadelphia",
  "endpoints": {
    "website": "https://alice.example.com"
  },
  "owner_public_key": "ed25519:BBBB...",
  "registered_at": "2026-03-15T12:00:00Z",
  "expires_at": "2027-03-15T12:00:00Z",
  "renewal_fee": 50,
  "ttl": 86400,
  "registrar_signature": "...",
  "owner_signature": "..."
}
```

**Self-registered (no society):**
```json
{
  "domain": "anonymous-blog.bfs",
  "type": "self_registered",
  "registrar": null,
  "endpoints": {
    "website": "https://somewhere.onion"
  },
  "owner_public_key": "ed25519:CCCC...",
  "registered_at": "2026-03-15T12:00:00Z",
  "expires_at": "2027-03-15T12:00:00Z",
  "renewal_fee": 200,
  "ttl": 86400,
  "owner_signature": "..."
}
```

**Signature coverage:**
- `registrar_signature` / `sponsor_signature` — Society vouches for domain ownership
- `owner_signature` — Owner proves they control the endpoint and public key

For self-registered sites, only `owner_signature` is present.

**Expiration:**
- Subdomains: No expiration (valid as long as sponsorship continues)
- Registered domains: Annual or multi-year, must be renewed
- Federation sends renewal reminders 30 days before expiration
- Expired domains enter 30-day grace period, then released

### Registrar Economics & Management

Societies that offer registrar services can treat it as a revenue stream:

**Pricing models:**
- **Member discount** — Free or heavily discounted for society members
- **Non-member pricing** — Market rate (e.g., 50 Franks/year)
- **Premium domains** — Higher fees for short/desirable names
- **Multi-year discounts** — 3-year registration at 2.5× annual rate
- **Bulk pricing** — Organizations registering many domains

**Revenue allocation:**
- Registrar fees flow into society's general fund
- Society decides allocation (infrastructure, operations, mutual aid)
- Could dedicate percentage to hosting services for registered domains
- Transparent accounting (all members can see registrar revenue)

**Competitive dynamics:**
- Societies compete on price, service quality, and policies
- Users can transfer domains between registrars (with both parties' consent)
- Registrars with good reputation attract more registrations
- Bad actors (arbitrary revocation, poor service) lose market share

**Operational costs:**
- Running registrar service is low-cost (just signing records)
- Main costs: technical support, abuse monitoring, infrastructure
- Profitable even at low registration fees
- Scales well (marginal cost per domain is near zero)

**Registrar discovery:**
- Federation maintains list of active registrars
- Shows pricing, policies, reputation metrics
- Users compare and choose based on preferences
- Societies can advertise registrar services on their .bfs sites

### Moderation

Societies are responsible for their sponsored subdomains:
### Moderation

**For subdomains (society-sponsored):**
- Society can revoke sponsorship if domain is abused
- May have content policies (but enforcement is optional)
- Cannot censor content (owner controls hosting)
- Can only disassociate (revoke vouching)
- Free speech emphasis: revocation only for extreme abuse

**For registered domains (society as registrar):**
- Registrar can refuse renewal if domain used for egregious abuse
- Cannot revoke mid-term (domain valid until expiration)
- Registrar policies must be transparent (published in registration terms)
- Users can transfer to different registrar before expiration
- Registrar reputation includes revocation history (arbitrary revocation hurts business)

**Federation-level moderation:**
- Federation maintains a **blocklist** for network-wide threats:
  - Spam, phishing, malware distribution
  - Requires Federation Assembly vote (high bar)
  - Societies can override locally (ignore blocklist for their users)
- Blocklisted domains remain registered but marked as untrusted
- Users see warning but can proceed (like browser security warnings)

**Philosophy:**
The `.bfs` network favors free expression over centralized content control. Moderation happens at edges (societies/registrars) not center (Federation). Users choose registrars whose policies align with their values.

---

## Security Considerations

### Key Management

Each society's private key is:
- Generated at founding (or by parent during charter)
- Stored encrypted at rest (outside database, like MFA secrets)
- Used only for signing `.bfs` records and inter-society messages
- Backed up securely by society administrators

If a private key is compromised:
1. Society generates new keypair
2. Publishes new record signed by old key (revocation)
3. Publishes new record signed by new key (rotation)
4. Notifies Federation and neighbors
5. Old key is distrusted after grace period

### Signature Validation

Every client must verify every signature. A signature covers:
- All record fields (handle, endpoints, pubkey, timestamp, etc.)
- Cryptographic hash of content
- Society's private key

Verification proves:
- Record authenticity (only the society could sign it)
- Record integrity (content hasn't been altered)
- Record freshness (timestamp is recent)

### Trust Bootstrapping

When a brand new society first comes online:
1. Has parent's signature on founding record
2. Presents founding record to Federation
3. Federation verifies parent's signature
4. Federation accepts society into registry
5. Society can now publish its own records

Parent's signature is the **root of trust** for new societies. Parent vouches for child. If parent is trusted, child inherits that trust.

### Denial of Service

Malicious peers could:
- **Flood with queries** — Rate limit responses, cache aggressively
- **Send fake records** — Reject invalid signatures immediately
- **Spam the registry** — Federation rate limits new registrations

The signature requirement makes large-scale forgery impractical. An attacker would need to compromise a society's private key to inject fake records.

---

## Implementation Notes

### Database Schema Additions

Add to each society's governance database:

```sql
CREATE TABLE society_lineage (
  society_handle TEXT PRIMARY KEY,
  parent_handle TEXT,
  founding_date INTEGER NOT NULL,
  founding_record TEXT NOT NULL, -- JSON, includes parent signature
  lineage_path TEXT NOT NULL -- JSON array: ["child", "parent", "grandparent", ..., "root"]
);

-- Our own society's record (exactly one row)
INSERT INTO society_lineage VALUES (
  'columbus',
  'pittsburgh',
  1735689600,
  '{...}',
  '["columbus", "pittsburgh", "philadelphia"]'
);
```

### Federation API Endpoints

```
POST   /bfs/register        Register new society (requires parent signature)
GET    /bfs/resolve/:handle Resolve handle to full record
GET    /bfs/lineage/:handle Get ancestor chain for society
GET    /bfs/descendants/:handle Get all children/grandchildren
POST   /bfs/update          Update own record (requires signature)
GET    /bfs/search          Search by name, location, or parent
```

### Resolution Protocol (Pseudo-code)

```javascript
async function resolve(handle) {
  // 1. Check cache
  let record = cache.get(handle);
  if (record && isValid(record)) return record;
  
  // 2. Query Federation
  try {
    record = await federation.resolve(handle);
    if (verify(record)) {
      cache.set(handle, record);
      return record;
    }
  } catch (e) { /* offline */ }
  
  // 3. Query neighbors
  for (let neighbor of neighbors) {
    record = await neighbor.query(handle);
    if (record && verify(record)) {
      cache.set(handle, record);
      return record;
    }
  }
  
  // 4. Walk lineage
  let ancestor = parent;
  while (ancestor) {
    record = await ancestor.search(handle);
    if (record && verify(record)) {
      cache.set(handle, record);
      return record;
    }
    ancestor = ancestor.parent;
  }
  
  throw new Error('Not found');
}
```

---

## Advantages

1. **Resilient** — Multiple resolution paths, no single point of failure
2. **Self-authenticating** — Signatures prove authenticity without CA
3. **Distributed** — Peer-to-peer discovery, gossip protocol propagation
4. **Lineage-aware** — Genealogy provides natural trust and discovery paths
5. **Privacy-preserving** — Queries don't leak to central authority
6. **Simple** — DNS-like semantics, easy to implement and understand
7. **Graceful degradation** — Works better with Federation, works without it

---

## Future Considerations

**Namespace & Identity:**
- **Naming conflicts** — What if two societies claim the same handle?
- **Portable identity** — Can individuals keep their `.bfs` domain if they move societies?
- **Domain trading** — Should `.bfs` domains be transferable?
- **Namespace governance** — Who decides on reserved/prohibited names?

**Technical Infrastructure:**
- **IPv6 integration** — Could `.bfs` domains map to dedicated IPv6 ranges?
- **Onion routing** — Should browser support Tor-like anonymity for .bfs traffic?
- **Mobile support** — How do mobile devices cache and resolve efficiently?
- **CDN/caching** — Can societies run .bfs caching nodes for better performance?
- **Search engines** — How does search/discovery work across .bfs network?

**Content & Applications:**
- **Static site hosting** — Should societies provide free hosting for member sites?
- **Dynamic applications** — How do .bfs sites with databases/backends work?
- **Media streaming** — Can .bfs support peer-to-peer video/audio?
- **Decentralized social** — Could .bfs host federated social networks?
- **Commerce** — Can .bfs sites accept Frank payments natively?

**Governance & Policy:**
- **Abuse handling** — What's the appeal process for blocklisted domains?
- **DMCA/copyright** — How are legal requests handled in distributed system?
- **Content moderation** — What responsibilities do sponsoring societies have?
- **Cross-federation** — Could multiple independent BFS networks interconnect?

**Bridge to Traditional Internet:**
- **Gateway services** — Should there be .bfs → .org proxies for non-browser users?
- **Archive/preservation** — Who archives .bfs sites for posterity?
- **Migration tools** — Can sites easily move from traditional DNS to .bfs?

---

## Summary

The `.bfs` network combines cryptographic trust, peer-to-peer discovery, and genealogical structure to create a resilient mesh network that needs no central authority. The Federation accelerates the system when online but is not required for operation. Every society inherits trust and connectivity from its parent, creating a web of relationships that mirrors the social reality of how communities actually form and help each other.

Beyond just society infrastructure, `.bfs` opens a namespace for personal publishing, community projects, and local businesses. Societies function as **domain registrars**, competing to provide registration services at market rates. This creates:
- **Economic sustainability** — Registrar fees fund society operations
- **Distributed trust** — Multiple independent registrars, not monopoly control
- **Market dynamics** — Societies compete on price, service quality, and policies
- **Community vouching** — Registered domains are cryptographically attested by trusted societies

Users can choose:
- **Society-registered top-level domains** (`alice.bfs`) — Vouched by registrar, annual fee
- **Society-sponsored subdomains** (`alice.philadelphia.bfs`) — Free/discounted for members
- **Self-registered domains** — No vouching, higher fee, maximum privacy

It's an alternative internet: distributed, community-owned, resistant to surveillance and corporate control. No GoDaddy, no ICANN — just communities vouching for each other and providing infrastructure services.

This is the internet as it was meant to be: distributed, trustless, end-to-end.
