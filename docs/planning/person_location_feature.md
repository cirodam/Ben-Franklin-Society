# Person Location Feature

**Status:** Planning  
**Created:** 2026-05-29  
**Complexity:** Moderate  

## Overview

Add optional location fields to person entities, including street address and geographic coordinates (latitude/longitude). This enables location-aware features and geographic organization of membership.

## Requirements

- Location is **optional** - not all persons need to have a location
- Three fields:
  - `street_address` (TEXT) - Free-form street address
  - `latitude` (REAL) - Geographic latitude
  - `longitude` (REAL) - Geographic longitude
- No backwards compatibility concerns - fresh schema update
- No data migration needed

## Implementation Plan

### 1. Database Schema

**File:** `apps/governance/src/lib/server/schema.ts`

Update the `person` table definition:

```sql
CREATE TABLE IF NOT EXISTS person (
  uuid          TEXT PRIMARY KEY,
  handle        TEXT NOT NULL UNIQUE,
  given_name    TEXT NOT NULL,
  family_name   TEXT NOT NULL,
  date_of_birth TEXT NOT NULL,
  phone         TEXT NULL,
  street_address TEXT NULL,        -- NEW
  latitude       REAL NULL,         -- NEW
  longitude      REAL NULL,         -- NEW
  status        TEXT NOT NULL DEFAULT 'active',
  joined_at     TEXT NOT NULL,
  revoked_at    TEXT NULL
);
```

**Migration:** Since no backwards compatibility needed, can drop and recreate during dev, or run:
```sql
ALTER TABLE person ADD COLUMN street_address TEXT NULL;
ALTER TABLE person ADD COLUMN latitude REAL NULL;
ALTER TABLE person ADD COLUMN longitude REAL NULL;
```

### 2. TypeScript Interfaces

Update `Person` interface in multiple locations:

#### Primary Interface
**File:** `apps/governance/src/lib/server/organization/people.ts`

```typescript
export interface Person {
	uuid: string;
	handle: string;
	given_name: string;
	family_name: string;
	date_of_birth: string;
	phone: string | null;
	street_address: string | null;    // NEW
	latitude: number | null;          // NEW
	longitude: number | null;         // NEW
	status: 'active' | 'suspended' | 'revoked';
	joined_at: string;
	revoked_at: string | null;
}
```

#### API Consumer Interfaces (decide on exposure level)
These may or may not need location data depending on use case:

- `apps/mail/src/lib/server/governance-api.ts` - Person interface
- `apps/marketplace/src/lib/server/governance-api.ts` - Person interface
- `apps/community-bank/src/lib/server/external/governance.ts` - PersonInfo interface

**Decision needed:** Should external apps see location data? Privacy considerations?

#### API Route Interfaces
Update inline interfaces in these routes:
- `apps/governance/src/routes/api/persons/by-uuid/[uuid]/+server.ts`
- `apps/governance/src/routes/api/persons/by-handle/[handle]/+server.ts`
- `apps/governance/src/routes/api/persons/sync-data/+server.ts`
- `apps/governance/src/routes/api/principals/[uuid]/+server.ts`

### 3. CRUD Functions

**File:** `apps/governance/src/lib/server/organization/people.ts`

#### Update `NewPersonInput` interface:
```typescript
export interface NewPersonInput {
	handle: string;
	given_name: string;
	family_name: string;
	date_of_birth: string;
	phone?: string;
	street_address?: string;    // NEW
	latitude?: number;          // NEW
	longitude?: number;         // NEW
	initial_password: string;
}
```

#### Update `createPerson` function:
Add location fields to INSERT statement:
```typescript
db.prepare(
	`INSERT INTO person (uuid, handle, given_name, family_name, date_of_birth, phone, street_address, latitude, longitude, status, joined_at)
	 VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'active', ?)`
).run(
	uuid, 
	input.handle, 
	input.given_name, 
	input.family_name, 
	input.date_of_birth, 
	input.phone ?? null,
	input.street_address ?? null,
	input.latitude ?? null,
	input.longitude ?? null,
	joinedAt
);
```

#### Update `updatePersonProfile` function:
Add location fields to updateable fields:
```typescript
export function updatePersonProfile(
	uuid: string,
	updates: {
		given_name?: string;
		family_name?: string;
		date_of_birth?: string;
		phone?: string | null;
		street_address?: string | null;    // NEW
		latitude?: number | null;          // NEW
		longitude?: number | null;         // NEW
	}
): void {
	const fields: string[] = [];
	const params: unknown[] = [];
	if (updates.given_name !== undefined)       { fields.push('given_name = ?');       params.push(updates.given_name); }
	if (updates.family_name !== undefined)      { fields.push('family_name = ?');      params.push(updates.family_name); }
	if (updates.date_of_birth !== undefined)    { fields.push('date_of_birth = ?');    params.push(updates.date_of_birth); }
	if (updates.phone !== undefined)            { fields.push('phone = ?');            params.push(updates.phone); }
	if (updates.street_address !== undefined)   { fields.push('street_address = ?');   params.push(updates.street_address); }   // NEW
	if (updates.latitude !== undefined)         { fields.push('latitude = ?');         params.push(updates.latitude); }         // NEW
	if (updates.longitude !== undefined)        { fields.push('longitude = ?');        params.push(updates.longitude); }        // NEW
	if (!fields.length) return;
	params.push(uuid);
	db.prepare(`UPDATE person SET ${fields.join(', ')} WHERE uuid = ?`).run(...params);
}
```

#### Read operations:
All existing `getPersonByUuid`, `getPersonByHandle`, `listPeople` will automatically include new fields via `SELECT *`.

### 4. API Endpoints

Update SELECT statements to explicitly include location fields (or keep using `SELECT *`):

**Files to update:**
- `apps/governance/src/routes/api/persons/by-uuid/[uuid]/+server.ts`
- `apps/governance/src/routes/api/persons/by-handle/[handle]/+server.ts`
- `apps/governance/src/routes/api/persons/sync-data/+server.ts`

Example for by-uuid endpoint:
```typescript
const row = db
	.prepare(
		`SELECT uuid, handle, given_name, family_name, status, street_address, latitude, longitude
       FROM person
       WHERE uuid = ?`
	)
	.get(uuid) as Person | undefined;
```

**Decision needed:** Should location data be exposed via public APIs or restricted to authenticated/authorized requests?

### 5. UI Components

#### New Person Form
**File:** `apps/governance/src/routes/(app)/organization/directory/new/+page.svelte`

Add location input fields after phone number:

```svelte
<Input
	id="street_address"
	name="street_address"
	label="Street Address"
	type="text"
	placeholder="123 Main Street, City, State 12345"
	value={form?.streetAddress ?? ''}
	hint="Optional"
/>

<FieldRow>
	<Input
		id="latitude"
		name="latitude"
		label="Latitude"
		type="number"
		step="any"
		min="-90"
		max="90"
		placeholder="37.7749"
		value={form?.latitude ?? ''}
		hint="Optional"
	/>

	<Input
		id="longitude"
		name="longitude"
		label="Longitude"
		type="number"
		step="any"
		min="-180"
		max="180"
		placeholder="-122.4194"
		value={form?.longitude ?? ''}
		hint="Optional"
	/>
</FieldRow>
```

**Server action:** Update corresponding `+page.server.ts` to handle new form fields.

#### Profile Display
**File:** `apps/governance/src/routes/(app)/organization/people/[uuid]/+page.svelte`

Add location display to profile section:

```svelte
{#if data.person.street_address}
	<dt>Address</dt>
	<dd>{data.person.street_address}</dd>
{/if}

{#if data.person.latitude && data.person.longitude}
	<dt>Coordinates</dt>
	<dd>{data.person.latitude.toFixed(6)}, {data.person.longitude.toFixed(6)}</dd>
{/if}
```

#### Profile Edit Form
Search for edit profile functionality and add location fields if it exists.

**File to check:** Look for routes like `/organization/people/[uuid]/edit` or similar.

#### My Profile Page
**File:** `apps/governance/src/routes/(app)/me/+page.svelte`

Add location display to personal profile view if appropriate.

### 6. UI/UX Enhancements (Optional, Future)

Consider adding these features later:

- **Geocoding integration:** Use API (OpenStreetMap Nominatim, Google Maps) to convert address to lat/long automatically
- **Map visualization:** Display member locations on a map
- **Location search:** Filter/search members by proximity or region
- **Address validation:** Validate address format
- **Privacy controls:** Let users opt-in/opt-out of location sharing

### 7. Testing Checklist

- [ ] Create new person with location data
- [ ] Create new person without location data (all NULL)
- [ ] Update existing person to add location
- [ ] Update existing person to remove location (set to NULL)
- [ ] Update only address without coordinates
- [ ] Update only coordinates without address
- [ ] Verify API endpoints return location data
- [ ] Verify UI displays location when present
- [ ] Verify UI handles missing location gracefully
- [ ] Test latitude/longitude bounds (-90 to 90, -180 to 180)
- [ ] Test with invalid coordinate values

### 8. Privacy & Security Considerations

- **Data sensitivity:** Location data is personally identifiable information (PII)
- **Access control:** Consider who should see location data
  - Only admins?
  - Only other members?
  - Public directory?
- **API exposure:** Should external apps (mail, marketplace) have access?
- **Audit logging:** Consider logging location data access/changes
- **Future:** Add privacy preferences per person

### 9. File Change Summary

**Total estimated files:** ~15-20

| Category | Files | Complexity |
|----------|-------|------------|
| Schema | 1 | Low |
| Core interfaces | 1 | Low |
| API interfaces | 5-7 | Low |
| CRUD functions | 1 | Low |
| API endpoints | 3 | Low |
| UI forms | 2-3 | Low-Medium |
| UI display | 2-3 | Low |
| Server actions | 1-2 | Low |

**Estimated time:** 2-3 hours for full implementation and testing

## Implementation Order

1. **Database schema** - Update schema.ts and run migration
2. **Core interface** - Update Person interface in people.ts
3. **CRUD functions** - Update createPerson and updatePersonProfile
4. **API endpoints** - Update all person API routes
5. **New person form** - Add location fields to creation form
6. **Form handler** - Update server action to process location data
7. **Profile display** - Add location to profile views
8. **API consumer interfaces** - Update external app interfaces if needed
9. **Testing** - Verify all operations work correctly

## Open Questions

1. Should location data be visible to all members or restricted?
2. Should external apps (mail, marketplace) have access to location data?
3. Do we want geocoding integration now or later?
4. Should we add indexes on latitude/longitude for proximity queries?
5. Should we validate that lat/long are provided together (or allow partial data)?
6. Do we need audit logging for location data changes?

## Future Enhancements

- Geocoding API integration for automatic coordinate lookup
- Interactive map for selecting location
- Proximity-based member search
- Location-based association chapters or regions
- Privacy controls for location visibility
- Bulk import with location data
- Export member locations for analysis
