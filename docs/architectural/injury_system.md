# The Ben Franklin Society
## Injury System

---

## 🔄 Architecture Update (May 2026)

**The injury system has been migrated to use the document library system.**

- **Old Implementation:** Three dedicated database tables (`injury_record`, `injury_party`, `incident_account`)
- **New Implementation:** Library documents with type `'injury_report'` stored as JSON files
- **Location:** `/apps/governance/src/lib/server/documents/library-injuries.ts`
- **Type Definitions:** `/apps/governance/src/lib/server/documents/library-types.ts` (search for `InjuryReportContent`)

**Benefits:**
- Unified with other governance documents (motions, policies, etc.)
- Built-in versioning and audit trails
- Simpler architecture (one document type vs. three tables)
- Consistent permissions via library system
- Natural integration with library search and UI

**Document Structure:**
- `type`: `'injury_report'`
- `document_id`: Sequential injury number as string ("1", "2", "123")
- `slug`: `injury-{number}` (e.g., "injury-123")
- `owner_uuid`: Society UUID (injuries are society-level concerns)
- `content`: All injury data (parties, accounts, assessments) in structured JSON

See [injury_system_migration.md](./injury_system_migration.md) for complete migration details.

---

## Overview

The injury system provides a mechanism for members to formally record harm suffered as a result of another party's actions. This creates an official record of incidents that can be used by the **Mediation Service** (overseen by the **College of Conciliation**) for mediation, accountability, and conflict resolution.

**Organizational Structure:**
- The **Mediation Service** handles day-to-day assessment, mediation, and case management
- The **College of Conciliation** provides oversight, guidance, and can intervene in complex cases
- This separation ensures specialized skill development while maintaining democratic oversight

---

## Document Structure

Injury reports are stored as library documents with type `'injury_report'`. Each document contains:

### Core Document Fields

- `uuid`: Unique document identifier
- `type`: Always `'injury_report'`
- `slug`: `injury-{number}` (e.g., "injury-123")
- `document_id`: Sequential injury number as string
- `version`: Document version number (currently always 1)
- `title`: `"Injury Report #{number}"`
- `owner_uuid`: Society UUID
- `created_at`: ISO 8601 timestamp
- `updated_at`: ISO 8601 timestamp

### Content Structure (InjuryReportContent)

#### Status & Core Details

- **`status`**: `'filed'` | `'under_review'` | `'mediation'` | `'resolved'` | `'closed'`
- **`injury_types`**: Array of: `'physical'`, `'material'`, `'relational'`, `'systemic'`, `'communal'`
- **`incident_start`**: ISO 8601 datetime when incident began
- **`incident_end`**: ISO 8601 datetime or null (null if ongoing or single moment)
- **`location`**: Free-form text or null
- **`filed_by_uuid`**: Person who filed the report
- **`filed_at`**: ISO 8601 timestamp

#### Parties Involved

**`complainants`**: Array of:
```typescript
{
  party_uuid: string;      // person, association, or society UUID
  party_name: string;      // cached for display
  party_type: 'person' | 'association' | 'society';
}
```

**`respondents`**: Array (same structure as complainants)

#### Incident Accounts

**`accounts`**: Array of:
```typescript
{
  uuid: string;
  author_uuid: string;
  author_name: string;     // cached for display
  author_role: 'complainant' | 'respondent' | 'witness';
  account: string;         // narrative text
  provided_at: string;     // ISO 8601
}
```

#### Mediation Service Assessments

- **`gravity`**: `'minor'` | `'moderate'` | `'severe'` | `null`
- **`safety_risk`**: `'low'` | `'moderate'` | `'high'` | `null`
- **`assessed_at`**: ISO 8601 timestamp or null
- **`assessed_by_uuid`**: Mediator UUID or null
- **`assessment_notes`**: Free-form text or null

#### Resolution Tracking

- **`mediation_notes`**: Free-form text or null
- **`resolution_summary`**: Description of how it was resolved, or null
- **`resolved_at`**: ISO 8601 timestamp or null
- **`closed_at`**: ISO 8601 timestamp or null
- **`closing_notes`**: Reason for closing without resolution, or null

---

## Conceptual Framework

### Notes on Data Model

- **Injury Types** can be combined. Examples:
  - `"physical"` - bodily harm
  - `"material"` - property damage, financial loss
  - `"relational"` - damage to relationships, reputation
  - `"systemic"` - harm from institutional failure or pattern
  - `"communal"` - harm to community as a whole
  - `"physical,relational"` - assault that also damaged reputation
  
- **Incident timeframe**: Use `incident_start` for single-moment events. Set `incident_end` for ongoing harm or patterns. Leave `incident_end` NULL if harm is still ongoing.

- **Location**: Free-form text describing where the incident occurred. Can be specific ("Community Workshop, 123 Main St") or general ("Member's residence", "Online/social media", "Multiple locations"). Leave NULL if location is unknown or not applicable (e.g., systemic harm).

- **Assessments**: `gravity` and `safety_risk` are judgment-based assessments made by College of Conciliation members. These may be NULL when initially filed and assigned during intake/review. See "Incident Assessment" section for guidance on how to assess these categories.

---

### `injury_party`

Links parties to an injury record, identifying complainants and respondents.

| Column | Type | Constraints | Description |
|---|---|---|---|
| `injury_uuid` | TEXT | NOT NULL, FK → `injury_record.uuid` | |
| `party_uuid` | TEXT | NOT NULL | UUID of person, association, or society |
## Conceptual Framework

### Notes on Data Model

- **Injury Types** can be combined. Examples:
  - `"physical"` - bodily harm
  - `"material"` - property damage, financial loss
  - `"relational"` - damage to relationships, reputation
  - `"systemic"` - harm from institutional failure or pattern
  - `"communal"` - harm to community as a whole
  - Multiple types together (e.g., assault that also damaged reputation)

- **Incident timeframe**: Use `incident_start` for single-moment events. Set `incident_end` for ongoing harm or patterns. Leave `incident_end` NULL if harm is still ongoing.

- **Location**: Free-form text describing where the incident occurred. Can be specific ("Community Workshop, 123 Main St") or general ("Member's residence", "Online/social media", "Multiple locations"). Leave NULL if location is unknown or not applicable (e.g., systemic harm).

- **Multiple complainants** supported - several members can jointly file
- **Multiple respondents** supported - injury can be against multiple parties
- **Party types**:
  - Person UUID (from `person` table)
  - Association UUID (from `association` table)
  - Society UUID (society association from `association` table)

- **Society as complainant**: When a victim is unable or unwilling to participate, the society itself can file on their behalf using the society's UUID

- **Incident Accounts**: 
  - Each party can provide their account of what happened
  - Witnesses who are not parties can provide accounts with `author_role = 'witness'`
  - Multiple accounts from same person/role are permitted (updates, additional information)

- **Assessments**: `gravity` and `safety_risk` are judgment-based assessments made by Mediation Service staff (overseen by the College of Conciliation). These may be NULL when initially filed and assigned during intake/review. See "Incident Assessment" section for guidance on how to assess these categories.

---

## Incident Assessment

Two complementary assessments help the Mediation Service respond appropriately to each incident. These are judgment-based assessments performed by trained mediators - answer the questions for each category and select the one where you answer "yes" to a significant portion of the questions.

**Note:** The College of Conciliation provides oversight and can review or adjust assessments, particularly for complex or contentious cases.

### Gravity Assessment

**Backward-looking**: How serious was the harm that occurred?

#### **Minor Gravity**

Consider this category if several of these are true:

- Was the harm primarily to property or finances?
- Could the damage be repaired or compensated relatively easily?
- Was this an isolated incident between individuals?
- Did the incident end and is unlikely to have lasting effects?
- Is this about a misunderstanding or social friction rather than deliberate harm?
- Would most people consider this a dispute rather than a serious injury?
- Are both parties still able to function in the community without significant disruption?

#### **Moderate Gravity**

Consider this category if several of these are true:

- Has someone suffered significant financial loss or property damage?
- Has someone's reputation or relationships been seriously affected?
- Did an institution or service fail in its responsibilities?
- Are multiple members affected by what happened?
- Was there physical harm, but without lasting injury?
- Will it take substantial effort or time to repair the harm?
- Has this disrupted community function or trust?
- Is the victim experiencing ongoing distress even though the incident has ended?
- Would most people agree this requires formal mediation?

#### **Severe Gravity**

Consider this category if several of these are true:

- Did someone suffer lasting physical injury?
- Is the harm still actively occurring with no end in sight?
- Was a vulnerable person harmed (youth, elder, dependent)?
- Are multiple types of harm combined (e.g., physical injury plus reputation damage plus financial loss)?
- Has this affected the victim's ability to function in basic ways?
- Did an institutional failure endanger people's safety or wellbeing?
- Has this damaged fundamental community bonds or safety?
- Would most people agree this requires immediate and serious intervention?
- Is there trauma or harm that will take significant time and resources to heal?

---

### Safety Risk Assessment

**Forward-looking**: What is the risk of future harm from this respondent?

#### **Low Risk**

Consider this category if several of these are true:

- Is this the first time this person has been a respondent in an injury record?
- Did the incident clearly end and is not ongoing?
- Was there no violence or threat of violence involved?
- Has the person acknowledged the harm they caused?
- Does the person seem genuinely remorseful?
- Is the person willing to engage in the accountability process?
- Does the person have no special access to vulnerable populations?
- Is there no pattern of similar behavior in the past?
- Do community members generally feel safe around this person?
- Would you be surprised if this person did something similar again?

#### **Moderate Risk**

Consider this category if several of these are true:

- Has this person been a respondent in 2-3 previous injury records?
- Is there a pattern of similar types of harm?
- Did the behavior show recklessness or disregard for others' wellbeing?
- Has the person shown some resistance to accountability in past incidents?
- Were threats or intimidation involved (but not physical violence)?
- Does the person tend to minimize or excuse their harmful behavior?
- Has the person made partial but incomplete changes after previous incidents?
- Are there circumstances that might lead to similar incidents in the future?
- Would you be somewhat concerned about this person's future behavior?

#### **High Risk**

Consider this category if several of these are true:

- Was physical violence involved in this or past incidents?
- Is the harm currently ongoing with no end date?
- Has this person been a respondent in 4 or more previous injury records?
- Is there a clear pattern of escalation (each incident more serious than the last)?
- Does this person have access to vulnerable populations through their role or position?
- Has this person refused to acknowledge harm or engage in accountability previously?
- Were there explicit threats about causing future harm?
- Have multiple community members raised concerns about this person's behavior?
- Is there a consistent pattern showing this person either cannot or will not change?
- Does this person show signs of seeking out opportunities to cause harm?
- Would you be worried about someone you care about being around this person?

---

### Combined Response Matrix

Both assessments inform the College of Conciliation's response:

| Gravity | Safety Risk | Response Approach |
|---------|------------|-------------------|
| **Severe** | **High** | **Emergency**: Immediate intervention, protective restrictions, possible temporary suspension |
| **Severe** | **Moderate** | **Priority**: Full investigation and accountability process within 48 hours |
| **Severe** | **Low** | **Urgent**: Thorough mediation, focus on repair and understanding |
| **Moderate** | **High** | **Priority**: Focus on preventing escalation, monitoring, structured accountability |
| **Moderate** | **Moderate** | **Standard**: Full mediation process, follow-up check-ins |
| **Moderate** | **Low** | **Standard**: Mediation with focus on repair and prevention |
| **Minor** | **High** | **Monitoring**: Pattern is concerning even if individual harm is minor; accountability plan required |
| **Minor** | **Moderate** | **Standard**: Facilitated dialogue, note pattern for future reference |
| **Minor** | **Low** | **Facilitated**: Dialogue and repair, may be handled informally |

**Key Principle**: Safety risk can elevate response urgency even when gravity is low. A pattern of minor incidents may indicate someone who will eventually cause serious harm.

---

## Example Scenarios

### Single Complainant, Single Respondent

Alice files an injury against Bob for physical and relational harm:

```
injury_record:
  injury_number: 1
  injury_types: "physical,relational"
  incident_start: "2026-03-15T14:30:00Z"
  incident_end: NULL
  location: "Community Center, 456 Oak Street"
  gravity: "severe"
  safety_risk: "low"

injury_party:
  (injury_1, alice_uuid, 'complainant')
  (injury_1, bob_uuid, 'respondent')

incident_account:
  (injury_1, alice_uuid, 'complainant', "Alice's account...")
  (injury_1, bob_uuid, 'respondent', "Bob's account...")
  (injury_1, charlie_uuid, 'witness', "Charlie's account...")
```

### Multiple Complainants, Association Respondent

Three members file jointly against a Service for systemic harm:

```
injury_record:
  injury_number: 2
  injury_types: "systemic"
  incident_start: "2026-01-01T00:00:00Z"
  incident_end: "2026-04-30T23:59:59Z"
  location: "Housing Service offices and multiple member residences"
  gravity: "moderate"
  safety_risk: "moderate"

injury_party:
  (injury_2, member_a_uuid, 'complainant')
  (injury_2, member_b_uuid, 'complainant')
  (injury_2, member_c_uuid, 'complainant')
  (injury_2, service_uuid, 'respondent')

incident_account:
  (injury_2, member_a_uuid, 'complainant', "Member A's experience...")
  (injury_2, member_b_uuid, 'complainant', "Member B's experience...")
  (injury_2, member_c_uuid, 'complainant', "Member C's experience...")
  (injury_2, service_representative_uuid, 'respondent', "Service's response...")
```

### Society as Complainant

A member is incapacitated and cannot file. The society files on their behalf:

```
injury_record:
  injury_number: 3
  injury_types: "physical"
  incident_start: "2026-05-10T22:00:00Z"
  incident_end: NULL
  location: "Victim's residence"
  gravity: "severe"
  safety_risk: "high"

injury_party:
  (injury_3, society_uuid, 'complainant')
  (injury_3, accused_uuid, 'respondent')

incident_account:
  (injury_3, witness_uuid, 'witness', "Witness account...")
  (injury_3, accused_uuid, 'respondent', "Accused's account...")
```

---

## Implementation Notes

### Future Considerations

The following are NOT included in this initial design but may be added later:

- **Reference guide of common incidents**: Document listing typical scenarios with pre-assigned categories to help calibrate judgment (e.g., "property damage under $X", "first-time physical altercation with no injury", "3rd instance of gossip/rumor-spreading"). This would serve as anchors for consistent assessment across different conciliators.
- **Pattern tracking table**: Store historical patterns (repeat respondents, similar injury types, escalation trends)
- Status tracking (filed, under review, mediation, resolved)
- Assignment to conciliators
- Resolution/findings documentation
- Privacy/visibility controls
- Links to related constabulary reports or contracts
- Mediation session records
- Audit trail of status changes

This minimal design captures the essential: **what happened, when, who was involved, and how serious it is.** The `gravity` and `safety_risk` assessments rely on human judgment guided by questions, with common-incident references to be added for consistency.

---

## Integration Points

### College of Conciliation
- Receives notification when injury records are filed
- Assigns `gravity` and `safety_risk` assessments during intake/review
- Uses assessments to prioritize response and determine appropriate intervention level (see Combined Response Matrix)
- Uses injury records as basis for mediation and accountability processes
- Injury records inform patterns of harm analysis

### Constabulary Service
- Can reference or create injury records when responding to incidents
- Constabulary reports may link to injury records

### The Record
- Resolved injuries with findings may become Record entries
- Public accountability for patterns of harm

### Community Bank
- If restitution is required, transactions can reference `injury_uuid`
- Financial harm tracking

---

## Open Questions

1. Who has permission to file injury records? (All members? Only College of Conciliation?)
2. Should there be time limits on filing after an incident?
3. How does an injury record relate to membership suspension/revocation?
4. Should injury records be editable after filing, or append-only?
5. What are the visibility/privacy rules for viewing injury records?
6. Should severity weights be adjustable by the College of Conciliation based on local community context?
