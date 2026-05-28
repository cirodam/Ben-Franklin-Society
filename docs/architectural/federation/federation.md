# The Ben Franklin Society
## The Federation
### High-Level Design

---

## What the Federation Is

The Federation is a shared institution collectively owned by all Ben Franklin Society communities. It exists because the challenges communities face — scarcity, displacement, climate, collapse of surrounding systems — are larger than any one community can address alone.

Its purposes are:
- To connect societies so they can find each other and act together
- To coordinate the movement of scarce resources to where they are most desperately needed
- To support societies in crisis, including those that must migrate in their entirety
- To maintain the shared definition of what a Ben Franklin Society is and hold member societies to it

The Federation coordinates between societies; it does not govern them. Societies are the principals; the Federation is their shared instrument.

The Federation has no inherent authority over any society. Its only real lever is the society directory — being listed means a society is discoverable and trusted by the rest of the network. The terms of that listing are the terms of the membership agreement, which all societies accept when they register. The Federation enforces those terms; it does not make law beyond them.

---

## The Charter

There is one Charter for the Ben Franklin Society movement. It defines what a Ben Franklin Society is — what it must do, what it must not do, and what it owes its members and its neighbors. All registered societies are measured against it.

The Charter is custodied by the Federation, but it is owned collectively by all member societies. Amendments require a supermajority of the Federation Assembly and a long deliberation period. No single society, and not the Federation itself, can change it unilaterally.

Each society maintains its own **constitution** — its internal foundational document. A constitution must be consistent with the Charter. It governs the society's internal affairs; the Charter governs what societies owe each other and the broader movement.

---

## Governance

### The Federation Assembly

The Federation Assembly is the primary governing body. Its members are **societies**, not individuals. Each registered society holds one seat and one vote, regardless of size.

The Assembly governs by motion and vote — the same primitive used within each society. Matters before the Assembly include:
- Amendments to the Charter
- Admission of new societies
- Compliance findings and membership sanctions
- Rebalancing policy and clearinghouse thresholds
- Changes to federation-wide configuration

High-stakes decisions (Charter amendments, membership revocation) require a supermajority and mandatory deliberation period. Routine operational decisions require a simple majority.

### The Federation Committee

The Assembly delegates day-to-day operational authority to the **Federation Committee** — a smaller body drawn from Assembly delegates by sortition, serving fixed terms. The Committee handles:
- Reviewing and approving new society registrations
- Monitoring clearinghouse positions and issuing rebalancing instructions
- Initiating compliance reviews when a society appears to be in breach
- Facilitating inter-society conflict mediation

The Committee cannot amend the Charter, revoke membership, or take any action outside its delegated mandate. It refers matters requiring full Assembly authority upward.

### Conflict Mediation

The Federation provides a neutral forum for inter-society disputes. It can convene parties, document the dispute, and make findings about whether either party has breached federation terms. It cannot compel compliance beyond its membership tools — ultimately, a society that refuses to remedy a breach can be suspended from the directory.

Mediation is not adjudication. The Federation's role is to facilitate resolution, not to rule.

---

## Mutual Aid and Emergency Coordination

Societies are expected to share with one another — not just as a courtesy, but as a core obligation of federation membership. The Charter defines what societies owe each other. The Federation is the mechanism through which that obligation is acted upon at scale.

### Resource Coordination

When a society faces acute scarcity — food, medicine, fuel, shelter materials — it can declare a need through the Federation. The Federation Assembly (or the Committee under delegated emergency authority) coordinates a response: identifying which societies have surplus, facilitating agreements, and tracking what has been committed and delivered.

This is not a market. It is directed mutual aid. The Clearinghouse tracks Frank flows that accompany resource transfers, but the primary record of aid given and received is maintained by the Federation itself — both for accountability and for the historical record.

### Emergency Protocols

The Committee may declare a **federation emergency** when conditions warrant — a society facing imminent crisis, a regional disaster affecting multiple communities, or a threat to the movement's ability to function. Under emergency status:

- Clearinghouse rebalancing rules are suspended for affected societies — Frank flows to and from a society in crisis are not penalized
- The Federation coordinates direct society-to-society aid without requiring normal motion/vote cycles for operational decisions
- Emergency status is time-limited and must be ratified or lifted by the full Assembly within a defined window

### Society Migration

A society may need to relocate — partially or in its entirety. This is treated as a first-class event, not an edge case.

When a society migrates:
- Its **handle and UUID are preserved** — identity is continuous through migration
- Its **endpoint and coordinates are updated** in the Federation directory — neighboring caches are invalidated and refreshed
- Its **Frank balances are continuous** — the ledger travels with the society
- Its **member records are continuous** — no re-registration required
- Neighboring societies that no longer border the migrated society are updated; new neighbors are introduced

A society that cannot operate its own infrastructure during migration may request **temporary hosting** from a neighboring society — running as a guest on another society's stack, with its own data, until it can re-establish its own deployment. This is a social and operational agreement between the two societies; the Federation facilitates the introduction and records the arrangement.

If a society dissolves entirely — members choosing to disperse into other communities rather than relocate together — the Federation coordinates the orderly transfer of member records to receiving societies and archives the dissolved society's history.

---

## Federation Insurance Funds

Participation in both federation insurance funds is **compulsory** for all registered societies. It is a condition of membership.

Both funds operate on the same monetary mechanism: they mint **Florens** to meet approved claims, then destroy Florens gradually through post-event premiums as the supply returns to baseline. Because Florens are fungible across all societies, federation-level minting dilutes purchasing power slightly across the entire network — the cost of the crisis is shared, at low intensity, by everyone. The minting cap is the constitutional constraint that keeps this acceptable.

Each fund has its own account at the Federal Bank — its balance reflects the outstanding minted supply, returning toward zero as premiums destroy what was issued.

**Why Florens, not Franks:** Emergency claims must be payable across societies (e.g., relocating a community, treating members at hospitals in other societies). Franks are locally tied and cannot cross societies. The Federation mints Florens, which can be spent anywhere in the network, ensuring claim recipients have full mobility of the funds.

**Claims are a signal, not just a transaction.** Filing a claim means something has gone wrong somewhere — a healthcare system under strain, a community in an untenable location, an infrastructure failure. The fund covers the immediate need, but the Committee is obligated to identify the root cause and determine whether corrective action is warranted. A society that files repeated claims in the same category is expected to act on the underlying problem. The Federation's role is not just to pay — it is to help member societies understand what their claims are telling them and support them in addressing it. Continued membership may be conditioned on a society demonstrating good-faith efforts to remediate known, recurring causes.

The deeper purpose of both funds is to drive improvement across the federation: better health outcomes, safer and more resilient homes, communities sited in regions where they can thrive. The funds pay for crises; the Federation uses what it learns from those crises to help societies build lives where fewer crises occur.

### Federation Health Fund

Covers catastrophic healthcare costs that would overwhelm any single society's capacity — major medical crises, pandemic response, large-scale injury events.

**Funding model:**
The minting cap and premium rate are derived actuarially from the demographic profile of the full membership across all societies. The Federation has the necessary data: every member's date of birth is recorded in their society's Governance app, and societies report aggregate demographic snapshots to the Federation periodically.

- Expected annual catastrophic claims are calculated from age-cohort cost curves applied to the known population
- The **minting cap** is set at a multiple of expected annual exposure (reserve ratio set by the Assembly, e.g. 2×)
- The **premium rate** is expected annual claims divided across all member societies, weighted by their membership count
- The model is rerun annually; the cap and premium rate adjust as the federation grows, ages, or changes composition

When a society submits a catastrophic health claim:
- The Committee assesses whether the claim qualifies under federation policy
- If approved, the fund mints the claim amount directly to the affected society's Treasury
- The outstanding minted supply is tracked against the cap; if the cap is exhausted, the Assembly must convene to authorize further minting or triage remaining claims
- Post-event, all societies pay elevated premiums on a defined schedule until the minted Franks are destroyed

**Scope:** The fund covers costs above a per-member threshold defined by federation policy. Routine healthcare is a per-society service, funded by each society's own budget. The federation fund is the backstop, not the first payer.

### Federation Relocation Fund

Covers the costs of partial or full society relocation — displacement due to climate, disaster, political instability, or other conditions that make a society's current location untenable.

Relocation costs are harder to model actuarially than health costs because they depend on external circumstances rather than demographic curves. The fund uses a simpler **flat reserve model**:

- Each society contributes a fixed premium per member per year, set by the Assembly
- Premiums accumulate as a reserve; no minting occurs unless the reserve is insufficient to meet an approved claim
- If a claim exceeds the reserve, the fund mints the shortfall up to a hard cap set in the Charter
- Post-event premiums from all societies replenish the reserve and destroy any minted Franks

When a society submits a relocation claim:
- The Committee assesses the situation and the scope of relocation required
- The Assembly ratifies claims above a threshold size (given the potential to exhaust the reserve)
- Approved funds are transferred to the affected society's Treasury in tranches as relocation milestones are met — not as a lump sum — to ensure accountability and allow the fund to manage its exposure
- A society that dissolves rather than relocates may also draw from this fund to cover the costs of dispersing its members into receiving communities

## Transparency

Individual members have a reasonable expectation of financial privacy. Their Frank and Floren balances and transaction histories are held locally at their society and are not published to the federation.

Societies are public actors and have no equivalent privacy claim. The following are publicly visible to any member of any society, and to anyone else:

- Every society's net Floren position as tracked by the clearinghouse
- Every society's Federal Bank deposits and withdrawals (in Florens)
- Inter-society association accounts and their Floren flows
- Insurance fund balances, contribution rates, and claim histories (with the claiming society identified)
- Federation Assembly and Committee motions, votes, and findings
- Compliance reviews and their outcomes

This transparency is not incidental — it is the mechanism by which societies hold each other accountable. The Federation cannot mediate what it cannot see, and member societies cannot assess each other's good faith without access to the material facts.

---

## Inter-Society Associations

Societies may form voluntary associations with one another for any shared purpose — jointly operating a hospital, managing a watershed, running a regional transit network, or any other undertaking that benefits from shared governance and pooled resources.

An inter-society association is the same concept as a per-society association, but with societies as members instead of people. It has:
- A **federation-scoped UUID and handle** — registered in the Federation directory, addressable across the network
- Its own **governance terms** — member societies determine voting rules, contribution obligations, and decision-making processes at formation. One society, one vote is the default; departures from this must be explicit in the formation agreement.
- **Frank accounts** held at the Federal Bank (see below)
- A **dissolution agreement** — documented terms for what happens to jointly held assets and obligations when a member society exits or the association winds down. Required before registration.

Inter-society associations are **voluntary and self-governing**. The Federation does not approve their purposes or internal decisions. The only condition for registration and continued listing is that the association does not exist to perpetuate violence or harm — the same standard that applies to associations within any society. Complaints are subject to Federation review and may result in de-listing.

Unregistered bilateral arrangements between societies are also permitted — the Federation places no requirement on societies to register every cooperative agreement. Registration confers a federation-scoped identity and access to the Federal Bank.

---

## Federal Bank

The Federal Bank is the financial institution of the federation tier. It operates with **Florens** (the federal trade currency), not Franks. Franks are locally tied to their issuing societies; the Federal Bank handles accounts for societies and inter-society associations that need to transact across the network.

**Account holders:**
- Registered member societies
- Registered inter-society associations

**Functions:**
- **Payroll for joint operations** — an inter-society association running a hospital, a regional utility, or shared infrastructure pays its workers' home societies via scheduled Floren transfers from its Federal Bank account. Each home society's Community Bank then credits the individual member's Floren balance. Workers receive Florens (usable across the federation), not Franks from their local society. The Federal Bank never holds accounts for individuals.
- **Capital for joint projects** — societies and associations deposit Florens to fund shared investments. The Federal Bank holds the pooled capital and disburses it per the association's governance decisions.
- **Insurance fund custody** — the Federation Health Fund and Federation Relocation Fund hold their accounts at the Federal Bank rather than at a designated member society. This makes the funds neutral and not dependent on any one society's continued participation.

The Federal Bank is a **separate deployment** from the Federation app — its own process, its own SQLite database, same Litestream replication model. It is governed by the Federation Assembly under delegated day-to-day authority to the Committee.

Floren balances at the Federal Bank are not subject to demurrage (Florens have no demurrage). The Federal Bank's Floren holdings are part of the network-wide Floren supply tracking.

**The Federal Bank reports all flows to the clearinghouse.** Every deposit and withdrawal — by which society, for which association, in what amount — is visible to the clearinghouse and included in net position calculations. The clearinghouse tracks Floren flows through the Federal Bank the same way it tracks direct inter-society transfers. A bilateral imbalance does not disappear by routing Florens through a joint association. Societies cannot use the Federal Bank to obscure flows that would otherwise trigger rebalancing review.

---

## Technical Functions

The Federation app supports the institution's governance and coordination work. Its technical functions are:

### Society Directory

The authoritative registry of all registered societies. Each entry holds:
- Society handle (globally unique)
- Display name
- Endpoint (base URL of the society's app stack)
- Public key (for verifying signed inter-society messages)
- Coordinates (lat/long, used for neighbor introduction)
- Membership status

Societies query the directory on demand when they need to reach a society they haven't previously communicated with. They cache the result locally and communicate directly from that point on — the Federation is not in the path of ongoing communication.

When a new society registers, the Federation notifies nearby societies so they can add it to their local cache.

The directory is **publicly readable** — any member of any society, and anyone else, can browse registered societies, their status, and their public information. No authentication required for reads.

### Clearinghouse

Tracks net Floren positions between societies. Periodically reconciles transfer reports from both sides of inter-society transactions and flags discrepancies for human review. Issues rebalancing guidance to societies with large net imbalances.

The clearinghouse does not hold Florens. All Floren balances live in local ledgers (in each society's Community Bank). The clearinghouse is an auditor and coordinator, not a custodian.

If the Federation is offline, bilateral reconciliation can proceed directly between two societies using their own transfer logs, and rebalancing can be arranged by administrator agreement. The Federation catches up when it returns.

**Note:** Franks are locally tied and never leave their issuing society, so the clearinghouse only tracks Floren flows between societies.

### Membership

Maintains the allow-list of active member societies. A society not on the list is not discoverable and cannot authenticate as a trusted peer in inter-society protocols.

The allow-list is published as a **signed snapshot** with a `valid_until` timestamp. Societies cache it locally and refresh on a schedule. During a Federation outage, societies operate on the last valid signed list. Revocations take effect at most one refresh period late.

---

## Authentication Model

**Reads** — fully public. No authentication required.

**Society-authenticated writes** — a society acting on its own record (registration, key rotation, endpoint update, transfer reporting) signs the request with its private key. The Federation verifies the signature against its directory before accepting the write.

**Administrative writes** — Assembly motions, Committee actions, compliance findings. These go through the Federation's own governance flow and require the actor to be an authenticated delegate of a member society. Authentication is via the society's keypair — a delegate proves they are acting on behalf of their society by producing a signed credential issued by their society's Governance app.

---

## Availability

The Federation is designed so that its unavailability degrades gracefully rather than breaking inter-society communication:

- Societies that already know each other continue to communicate and transact directly
- Bilateral reconciliation can proceed manually between two societies
- Rebalancing can be arranged by administrator agreement out of band
- The signed allow-list means membership verification works for the duration of the cached snapshot

What requires the Federation to be online:
- Discovering contact details for a previously unknown society (mitigated by peer gossip fallback)
- Registering a new society
- Propagating a membership revocation before the cached snapshot expires

Multiple Federation nodes (primary + read replicas using the same Litestream model as per-society deployments) address the availability concern for directory reads. Writes go to the primary; replicas serve queries.
