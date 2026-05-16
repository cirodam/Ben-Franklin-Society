# The Ben Franklin Society
## Injury System

---

## Overview

The injury system provides a mechanism for members to formally record harm suffered as a result of another party's actions. This creates an official record of incidents that can be used by the College of Conciliation for mediation, accountability, and conflict resolution.

---

## Data Model

### `injury_record`

The core record of an incident where harm was alleged.

| Column | Type | Constraints | Description |
|---|---|---|---|
| `uuid` | TEXT | PRIMARY KEY | Permanent identifier |
| `injury_number` | INTEGER | NOT NULL, UNIQUE | Sequential number for reference |
| `injury_types` | TEXT | NOT NULL | CSV list of injury types: `physical`, `material`, `relational`, `systemic`, `communal` |
| `incident_start` | TEXT | NOT NULL | When the injury/incident began (ISO 8601 datetime) |
| `incident_end` | TEXT | NULL | When it ended (NULL if single moment or ongoing) |
| `filed_at` | TEXT | NOT NULL | When the injury record was filed |
| `created_at` | TEXT | NOT NULL | Record creation timestamp |

### Notes

- **Injury Types** can be combined. Examples:
  - `"physical"` - bodily harm
  - `"material"` - property damage, financial loss
  - `"relational"` - damage to relationships, reputation
  - `"systemic"` - harm from institutional failure or pattern
  - `"communal"` - harm to community as a whole
  - `"physical,relational"` - assault that also damaged reputation
  
- **Incident timeframe**: Use `incident_start` for single-moment events. Set `incident_end` for ongoing harm or patterns. Leave `incident_end` NULL if harm is still ongoing.

---

### `injury_party`

Links parties to an injury record, identifying complainants and respondents.

| Column | Type | Constraints | Description |
|---|---|---|---|
| `injury_uuid` | TEXT | NOT NULL, FK → `injury_record.uuid` | |
| `party_uuid` | TEXT | NOT NULL | UUID of person, association, or society |
| `role` | TEXT | NOT NULL | `complainant` or `respondent` |

Primary key: `(injury_uuid, party_uuid, role)`

### Notes

- **Multiple complainants** supported - several members can jointly file
- **Multiple respondents** supported - injury can be against multiple parties
- **Party types**:
  - Person UUID (from `person` table)
  - Association UUID (from `association` table)
  - Society UUID (from `society_identity` table)
  
- **Society as complainant**: When a victim is unable or unwilling to participate, the society itself can file on their behalf using the society's UUID

---

### `incident_account`

Narratives of what happened from different perspectives.

| Column | Type | Constraints | Description |
|---|---|---|---|
| `uuid` | TEXT | PRIMARY KEY | |
| `injury_uuid` | TEXT | NOT NULL, FK → `injury_record.uuid` | |
| `author_uuid` | TEXT | NOT NULL | Who is providing this account |
| `author_role` | TEXT | NOT NULL | `complainant`, `respondent`, or `witness` |
| `account` | TEXT | NOT NULL | Their narrative of what happened |
| `provided_at` | TEXT | NOT NULL | When this account was provided |
| `created_at` | TEXT | NOT NULL | Record creation timestamp |

### Notes

- Each party can provide their account of what happened
- Witnesses who are not parties can provide accounts with `author_role = 'witness'`
- Multiple accounts from same person/role are permitted (updates, additional information)

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

- Status tracking (filed, under review, mediation, resolved)
- Assignment to conciliators
- Resolution/findings documentation
- Privacy/visibility controls
- Links to related constabulary reports or contracts
- Mediation session records
- Audit trail of status changes

This minimal design captures the essential: **what happened, when, and who was involved.**

---

## Integration Points

### College of Conciliation
- Receives notification when injury records are filed
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
