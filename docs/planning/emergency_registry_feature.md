# Emergency Registry Feature

**Status:** Planning  
**Created:** 2026-05-29  
**Complexity:** Moderate  

## Overview

Create an opt-in emergency registry where members can indicate:
1. **Skills** they can offer during emergencies (from predefined list)
2. **Tools/Equipment** they have available (from predefined list)

This enables the community to quickly identify and coordinate resources during emergency situations. Location data (from person records) can be used to find nearby resources.

## Requirements

- Opt-in only - members choose to participate
- Predefined skill types (maintainable by admins)
- Predefined tool types (maintainable by admins)
- Many-to-many relationship (person can have multiple skills/tools)
- Optional notes per skill/tool for additional context
- UI for members to manage their registry entries
- Admin UI to manage skill/tool definitions
- Search/filter interface for emergency coordinators

## Database Schema

### Core Tables

```sql
-- Predefined emergency skills
CREATE TABLE IF NOT EXISTS emergency_skill (
  uuid        TEXT PRIMARY KEY,
  name        TEXT NOT NULL UNIQUE,
  category    TEXT NULL,           -- e.g., "Medical", "Construction", "Communication"
  description TEXT NULL,
  active      INTEGER NOT NULL DEFAULT 1,
  created_at  TEXT NOT NULL,
  updated_at  TEXT NOT NULL
);

-- Predefined emergency tools/equipment
CREATE TABLE IF NOT EXISTS emergency_tool (
  uuid        TEXT PRIMARY KEY,
  name        TEXT NOT NULL UNIQUE,
  category    TEXT NULL,           -- e.g., "Vehicle", "Power", "Medical", "Communication"
  description TEXT NULL,
  active      INTEGER NOT NULL DEFAULT 1,
  created_at  TEXT NOT NULL,
  updated_at  TEXT NOT NULL
);

-- Person's emergency skills (many-to-many)
CREATE TABLE IF NOT EXISTS person_emergency_skill (
  person_uuid TEXT NOT NULL REFERENCES person(uuid) ON DELETE CASCADE,
  skill_uuid  TEXT NOT NULL REFERENCES emergency_skill(uuid) ON DELETE CASCADE,
  notes       TEXT NULL,            -- e.g., "EMT certified 2024-2030"
  proficiency TEXT NULL,            -- e.g., "beginner", "intermediate", "expert"
  available   INTEGER NOT NULL DEFAULT 1,
  added_at    TEXT NOT NULL,
  PRIMARY KEY (person_uuid, skill_uuid)
);
CREATE INDEX IF NOT EXISTS idx_person_emergency_skill_person ON person_emergency_skill(person_uuid);
CREATE INDEX IF NOT EXISTS idx_person_emergency_skill_skill ON person_emergency_skill(skill_uuid);
CREATE INDEX IF NOT EXISTS idx_person_emergency_skill_available ON person_emergency_skill(available);

-- Person's emergency tools (many-to-many)
CREATE TABLE IF NOT EXISTS person_emergency_tool (
  person_uuid TEXT NOT NULL REFERENCES person(uuid) ON DELETE CASCADE,
  tool_uuid   TEXT NOT NULL REFERENCES emergency_tool(uuid) ON DELETE CASCADE,
  notes       TEXT NULL,            -- e.g., "5000W gasoline generator, 20 gallons fuel on hand"
  quantity    INTEGER NULL,          -- Number of units available
  available   INTEGER NOT NULL DEFAULT 1,
  added_at    TEXT NOT NULL,
  PRIMARY KEY (person_uuid, tool_uuid)
);
CREATE INDEX IF NOT EXISTS idx_person_emergency_tool_person ON person_emergency_tool(person_uuid);
CREATE INDEX IF NOT EXISTS idx_person_emergency_tool_tool ON person_emergency_tool(tool_uuid);
CREATE INDEX IF NOT EXISTS idx_person_emergency_tool_available ON person_emergency_tool(available);
```

### Suggested Categories

**Skill Categories:**
- Medical (First Aid, EMT, Nursing, Doctor, Veterinary)
- Construction (Carpentry, Plumbing, Electrical, HVAC, Welding)
- Communication (Ham Radio, Translation, Sign Language)
- Transportation (Commercial Driver, Pilot, Boat Operator)
- Logistics (Warehouse, Supply Chain, Distribution)
- Food (Cooking at Scale, Food Safety, Preservation)
- Shelter (Temporary Housing Setup, Camp Management)
- Search & Rescue (Wilderness, Urban, Water)
- Hazmat (Chemical Response, Cleanup)
- Counseling (Mental Health, Crisis, Trauma)

**Tool Categories:**
- Vehicle (Truck, Trailer, Boat, ATV, Aircraft)
- Power (Generator, Solar System, Battery Bank)
- Medical (Supplies, Equipment, Medication Stock)
- Communication (Radio, Satellite Phone, Mesh Network)
- Construction (Power Tools, Hand Tools, Scaffolding)
- Shelter (Tents, Cots, Blankets, Portable Toilets)
- Food (Commercial Kitchen, Coolers, Preservation Equipment)
- Water (Filtration, Storage, Distribution)
- Fuel (Gasoline, Diesel, Propane Storage)
- Heavy Equipment (Excavator, Forklift, Crane)

## TypeScript Interfaces

```typescript
export interface EmergencySkill {
	uuid: string;
	name: string;
	category: string | null;
	description: string | null;
	active: boolean;
	created_at: string;
	updated_at: string;
}

export interface EmergencyTool {
	uuid: string;
	name: string;
	category: string | null;
	description: string | null;
	active: boolean;
	created_at: string;
	updated_at: string;
}

export interface PersonEmergencySkill {
	person_uuid: string;
	skill_uuid: string;
	notes: string | null;
	proficiency: 'beginner' | 'intermediate' | 'expert' | null;
	available: boolean;
	added_at: string;
}

export interface PersonEmergencyTool {
	person_uuid: string;
	tool_uuid: string;
	notes: string | null;
	quantity: number | null;
	available: boolean;
	added_at: string;
}

// Extended for display purposes
export interface PersonSkillDetail extends PersonEmergencySkill {
	skill_name: string;
	skill_category: string | null;
}

export interface PersonToolDetail extends PersonEmergencyTool {
	tool_name: string;
	tool_category: string | null;
}
```

## Implementation Plan

### Phase 1: Database & Core Functions

1. **Schema Update** - Add tables to `schema.ts`
2. **CRUD Functions** - Create module at `$lib/server/organization/emergency-registry.ts`:
   - `listEmergencySkills()` - Get all active skills
   - `listEmergencyTools()` - Get all active tools
   - `getPersonSkills(personUuid)` - Get person's registered skills
   - `getPersonTools(personUuid)` - Get person's registered tools
   - `addPersonSkill(personUuid, skillUuid, data)` - Add skill to person
   - `addPersonTool(personUuid, toolUuid, data)` - Add tool to person
   - `removePersonSkill(personUuid, skillUuid)` - Remove skill from person
   - `removePersonTool(personUuid, toolUuid)` - Remove tool from person
   - `updatePersonSkill(personUuid, skillUuid, updates)` - Update notes/proficiency/availability
   - `updatePersonTool(personUuid, toolUuid, updates)` - Update notes/quantity/availability
   - `searchBySkill(skillUuid, options?)` - Find people with specific skill
   - `searchByTool(toolUuid, options?)` - Find people with specific tool
   - `searchNearby(lat, long, radius, skillUuid?, toolUuid?)` - Geographic search

### Phase 2: Admin Management

3. **Admin CRUD for Skills**:
   - `createEmergencySkill(data)` - Add new skill type
   - `updateEmergencySkill(uuid, data)` - Edit skill
   - `deactivateEmergencySkill(uuid)` - Soft delete

4. **Admin CRUD for Tools**:
   - `createEmergencyTool(data)` - Add new tool type
   - `updateEmergencyTool(uuid, data)` - Edit tool
   - `deactivateEmergencyTool(uuid)` - Soft delete

5. **Admin UI** - Routes for managing registry:
   - `/admin/emergency/skills` - List/create/edit skills
   - `/admin/emergency/tools` - List/create/edit tools

### Phase 3: User Interface

6. **Profile Integration**:
   - Add "Emergency Registry" section to `/me` page
   - Show registered skills and tools
   - Link to management page

7. **User Management UI**:
   - `/me/emergency` - Manage personal registry
   - Add/remove skills with notes and proficiency
   - Add/remove tools with notes and quantity
   - Toggle availability on/off

8. **Search Interface** (admin/coordinator view):
   - `/organization/emergency-registry` - Search and browse
   - Filter by skill category, tool category
   - Geographic filtering using location data
   - Export to CSV for emergency coordinators

### Phase 4: Seeding & Testing

9. **Seed Data** - Create initial skill/tool definitions
10. **Test Registration** - Verify users can register skills/tools
11. **Test Search** - Verify search and filtering work

## UI Mockups

### User's Profile Section (/me)

```
╔══════════════════════════════════════╗
║ Emergency Registry                   ║
╠══════════════════════════════════════╣
║ Skills (3):                          ║
║ • First Aid (Expert) ✓ Available     ║
║ • Carpentry (Intermediate)           ║
║ • Ham Radio Operator                 ║
║                                      ║
║ Tools (2):                           ║
║ • Generator (1) ✓ Available          ║
║ • Truck with Trailer                 ║
║                                      ║
║ [Manage Emergency Registry]          ║
╚══════════════════════════════════════╝
```

### User's Management Page (/me/emergency)

```
╔══════════════════════════════════════╗
║ My Emergency Registry                ║
╠══════════════════════════════════════╣
║ Emergency Skills                     ║
║ ┌────────────────────────────────┐  ║
║ │ [+ Add Skill]                  │  ║
║ └────────────────────────────────┘  ║
║                                      ║
║ ┌────────────────────────────────┐  ║
║ │ ✓ First Aid                    │  ║
║ │   Proficiency: Expert          │  ║
║ │   Notes: EMT cert 2024-2030    │  ║
║ │   [ ] Available  [Edit][Remove]│  ║
║ └────────────────────────────────┘  ║
║                                      ║
║ Emergency Tools & Equipment          ║
║ ┌────────────────────────────────┐  ║
║ │ [+ Add Tool]                   │  ║
║ └────────────────────────────────┘  ║
║                                      ║
║ ┌────────────────────────────────┐  ║
║ │ ✓ Generator                    │  ║
║ │   Quantity: 1                  │  ║
║ │   Notes: 5000W gasoline        │  ║
║ │   [ ] Available  [Edit][Remove]│  ║
║ └────────────────────────────────┘  ║
╚══════════════════════════════════════╝
```

### Search Interface (/organization/emergency-registry)

```
╔══════════════════════════════════════╗
║ Emergency Resource Registry          ║
╠══════════════════════════════════════╣
║ Filters:                             ║
║ Skill: [All Skills ▾]                ║
║ Tool:  [All Tools ▾]                 ║
║ Radius: [10 miles ▾] from [Location]║
║ [Search]                             ║
║                                      ║
║ Results (12 members):                ║
║ ┌────────────────────────────────┐  ║
║ │ Jane Doe (@jane-doe)           │  ║
║ │ 2.3 miles away                 │  ║
║ │ Skills: First Aid (Expert),    │  ║
║ │         Carpentry              │  ║
║ │ Tools: Generator, Truck        │  ║
║ └────────────────────────────────┘  ║
║ [Export CSV]                         ║
╚══════════════════════════════════════╝
```

## API Endpoints

### Public/Member Endpoints

- `GET /api/emergency/skills` - List all active skills
- `GET /api/emergency/tools` - List all active tools
- `GET /api/emergency/my-registry` - Get current user's registry
- `POST /api/emergency/my-skills` - Add skill to current user
- `DELETE /api/emergency/my-skills/:skillUuid` - Remove skill
- `PATCH /api/emergency/my-skills/:skillUuid` - Update skill details
- `POST /api/emergency/my-tools` - Add tool to current user
- `DELETE /api/emergency/my-tools/:toolUuid` - Remove tool
- `PATCH /api/emergency/my-tools/:toolUuid` - Update tool details

### Admin/Coordinator Endpoints

- `GET /api/emergency/search?skill=uuid&tool=uuid&lat=x&lng=y&radius=10` - Search registry
- `POST /api/admin/emergency/skills` - Create skill definition
- `PATCH /api/admin/emergency/skills/:uuid` - Update skill definition
- `DELETE /api/admin/emergency/skills/:uuid` - Deactivate skill
- `POST /api/admin/emergency/tools` - Create tool definition
- `PATCH /api/admin/emergency/tools/:uuid` - Update tool definition
- `DELETE /api/admin/emergency/tools/:uuid` - Deactivate tool

## Permissions & Privacy

**Visibility:**
- Registry participation is **opt-in only**
- Members can mark skills/tools as unavailable temporarily
- Only registered skills/tools are visible to coordinators
- Location data is used for proximity search but not directly displayed

**Access Levels:**
1. **All Members**: Can manage their own registry
2. **Emergency Coordinators**: Can search full registry
3. **Admins**: Can manage skill/tool definitions

**Permissions to Add:**
- `emergency:manage_own` - Manage personal registry (all members)
- `emergency:search` - Search registry (coordinators)
- `emergency:admin` - Manage definitions (admins)

## Future Enhancements

1. **Certification Tracking** - Upload/store certification documents
2. **Expiration Dates** - Alert when certifications expire
3. **Availability Calendar** - Indicate specific dates available
4. **Team Formation** - Create emergency response teams
5. **Communication Integration** - Quick contact for emergencies
6. **Resource Requests** - Post needs during emergencies
7. **Training Coordination** - Offer/request skill training
8. **Equipment Sharing** - Normal (non-emergency) lending
9. **Mobile App** - Quick check-in during emergencies
10. **Integration with Alerts** - Notify based on skill needs

## File Change Estimate

**Total estimated files:** ~20-25

| Category | Files | Complexity |
|----------|-------|------------|
| Schema | 1 | Low |
| Core CRUD module | 1 | Medium |
| Admin skill/tool management | 4-6 | Medium |
| User registry management | 3-4 | Medium |
| Search interface | 2-3 | Medium |
| API endpoints | 6-8 | Low-Medium |
| Profile integration | 2 | Low |
| Permissions | 1 | Low |

**Estimated time:** 6-8 hours for full implementation

## Initial Seed Data

See `seed-emergency-registry.sql` (to be created) for:
- ~50 common emergency skills across categories
- ~40 common emergency tools/equipment across categories

## Open Questions

1. Should we track training/certification expiration dates?
2. Do we need quantity limits or condition ratings for tools?
3. Should there be a "last verified" date for registry entries?
4. Do we need emergency contact info separate from regular contact?
5. Should availability be binary or time-based (available Mon-Fri)?
6. Do we want skill endorsements/verification from others?
7. Should location be required to participate in registry?
8. Do we need insurance/liability considerations for tool lending?

## Dependencies

- ✅ Person location data (completed) - enables geographic search
- Person permissions system - for access control
- Alert/notification system (future) - for emergency activation

## Implementation Notes

- Start with core schema and basic CRUD
- Seed with common skills/tools from the start
- Build user UI before admin UI (test with initial seed)
- Add search functionality incrementally
- Consider geographic search as v2 feature
