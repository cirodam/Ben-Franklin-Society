# Governing Documents Data Model Refactor

## Overview
Refactor governing documents to improve data structure and add denormalized fields for better display, similar to recent motion document improvements.

## Phase 1: Change Seniority to String

### Current State
```typescript
seniority: number; // 1=charter, 2=constitution, 3=bylaw, 4=ordinance, 5=regulation, 6=policy
```

### Target State
```typescript
seniority: 'charter' | 'constitution' | 'bylaw' | 'ordinance' | 'regulation' | 'policy';
```

### Rationale
- More explicit and self-documenting
- Eliminates magic numbers
- No need for lookup functions (getSeniorityName)
- Easier to understand in JSON files
- More resilient to future changes

### Files to Update
1. **Type Definition**
   - `/apps/governance/src/lib/server/documents/library-types.ts`
   - Change `seniority: number` to string union type
   - Add SeniorityLevel type alias

2. **Governing Document Operations**
   - `/apps/governance/src/lib/server/documents/library-governing.ts`
   - Update all functions that reference seniority
   - Update legacy converters (toLegacyDocument, fromLegacyDocument)

3. **Display Components**
   - `/apps/governance/src/routes/(app)/library/[slug]/views/GoverningDocumentView.svelte`
   - Remove `getSeniorityName()` function (no longer needed)
   - Update any seniority comparisons or logic
   - Update CSS class generation if needed

4. **Document Type Config**
   - `/apps/governance/src/lib/documents.ts`
   - Update any seniority references in document type definitions

5. **Form/Creation Logic**
   - Check any forms that create or edit governing documents
   - Update dropdowns/selects to use string values

### Migration Strategy
- **Clean break**: No legacy compatibility needed
- Update all type definitions and functions
- Any existing documents will need to be manually updated or recreated
- No backward compatibility layer required

## Phase 2: Refine Status Model and Add Denormalized Fields

### Current State
```typescript
type GoverningStatus = 'draft' | 'adopted' | 'repealed';

interface GoverningDocContent {
  status: GoverningStatus;
  seniority: number;
  articles: Article[];
  
  adopted_at?: string;
  adopted_by_motion_uuid?: string;
  repealed_at?: string;
  repealed_by_motion_uuid?: string;
}
```

### Target State
```typescript
type GoverningStatus = 'draft' | 'enacted' | 'repealed' | 'sunsetted';

interface GoverningDocContent {
  status: GoverningStatus;
  seniority: 'charter' | 'constitution' | 'bylaw' | 'ordinance' | 'regulation' | 'policy';
  articles: Article[];
  preamble?: string; // Add to type (currently shown in UI but not typed)
  
  // When status is 'enacted'
  enacted_at?: string;
  enacted_by_motion_uuid?: string;
  enacted_by_motion_title?: string; // Denormalized for display
  
  // Optional sunset (automatic expiration)
  sunset_at?: string; // ISO date when document automatically expires
  
  // When status is 'repealed' (actively repealed by motion)
  repealed_at?: string;
  repealed_by_motion_uuid?: string;
  repealed_by_motion_title?: string; // Denormalized for display
  
  // Note: When status is 'sunsetted', only enacted_* and sunset_at fields are present
}
```

### Rationale
- **Status alignment**: 'enacted' matches motion terminology (motions have 'adopted' then 'enacted')
- **Semantic clarity**: 'enacted' means "has force of law", clearer than 'adopted'
- **Denormalized titles**: No database lookups needed to display motion names
- **Clean states**: Draft has no enactment fields; enacted has enactment fields; repealed/sunsetted have both
- **Preamble typing**: Make existing UI functionality explicit in types
- **Sunset vs Repeal distinction**: 
  - **'repealed'** = Actively legislated against (has repealed_by_motion fields)
  - **'sunsetted'** = Allowed to expire naturally (no repealed_by_motion fields, uses sunset_at)
  - Clear difference for display, queries, and document history
  - Useful for temporary regulations, trial policies, etc.

### Benefits
- Consistent with motion document improvements
- Self-contained documents for display
- Clear lifecycle: draft → enacted → (optionally) repealed
- "Enacted by Motion XYZ" language flows naturally

## Phase 3: UI Improvements (Future)

### Potential Enhancements
- Add metadata section similar to motions (status, adoption info)
- Add letterhead/document number presentation
- Clean up edit controls (move away from emojis)
- Better status display

## Implementation Order
1. ✅ Create this planning document
2. ⏳ Phase 1 & 2: Update data model (seniority to string, status to 'enacted', add denormalized fields)
3. ⏳ Phase 3: UI improvements

## Example: Before and After

### Current Format (Before)
```json
{
  "uuid": "550e8400-e29b-41d4-a716-446655440000",
  "type": "governing",
  "slug": "charter",
  "document_id": null,
  "version": 1,
  "title": "Charter of the Ben Franklin Society",
  "owner_uuid": "SOCIETY",
  "created_at": "2026-01-15T10:00:00Z",
  "updated_at": "2026-01-15T10:00:00Z",
  "content": {
    "status": "adopted",
    "seniority": 1,
    "articles": [
      {
        "number": "I",
        "title": "Name and Purpose",
        "sections": [
          {
            "title": "Name",
            "body": "The name of this society shall be the Ben Franklin Society.",
            "rationale": "Named in honor of Benjamin Franklin's commitment to civic virtue."
          }
        ]
      }
    ],
    "adopted_at": "2026-01-15T10:00:00Z",
    "adopted_by_motion_uuid": "motion-uuid-123"
  }
}
```

### New Format (After)
```json
{
  "uuid": "550e8400-e29b-41d4-a716-446655440000",
  "type": "governing",
  "slug": "charter",
  "document_id": "CHARTER-001",
  "version": 1,
  "title": "Charter of the Ben Franklin Society",
  "owner_uuid": "SOCIETY",
  "created_at": "2026-01-15T10:00:00Z",
  "updated_at": "2026-01-15T10:00:00Z",
  "content": {
    "status": "enacted",
    "seniority": "charter",
    "preamble": "We the members of the Ben Franklin Society, in order to foster civic virtue and mutual improvement, do hereby establish this charter.",
    "articles": [
      {
        "number": "I",
        "title": "Name and Purpose",
        "sections": [
          {
            "title": "Name",
            "body": "The name of this society shall be the Ben Franklin Society.",
            "rationale": "Named in honor of Benjamin Franklin's commitment to civic virtue."
          }
        ]
      }
    ],
    "enacted_at": "2026-01-15T10:00:00Z",
    "enacted_by_motion_uuid": "motion-uuid-123",
    "enacted_by_motion_title": "Motion to Ratify the Charter"
  }
}
```

### Temporary Regulation Example (With Sunset)
```json
{
  "uuid": "temporary-reg-uuid",
  "type": "governing",
  "slug": "emergency-procedures-2026",
  "document_id": "REG-2026-03",
  "version": 1,
  "title": "Emergency Meeting Procedures (Trial Period)",
  "owner_uuid": "general-assembly-uuid",
  "created_at": "2026-03-01T14:00:00Z",
  "updated_at": "2026-03-01T14:00:00Z",
  "content": {
    "status": "enacted",
    "seniority": "regulation",
    "articles": [
      {
        "number": "I",
        "title": "Virtual Meeting Provisions",
        "sections": [
          {
            "title": "Authorization",
            "body": "During the trial period, committees may hold virtual meetings with two-thirds approval."
          }
        ]
      }
    ],
    "enacted_at": "2026-03-01T14:00:00Z",
    "enacted_by_motion_uuid": "motion-uuid-456",
    "enacted_by_motion_title": "Motion to Establish Emergency Meeting Trial",
    "sunset_at": "2026-12-31T23:59:59Z"
  }
}
```

### Same Document After Sunset
```json
{
  "content": {
    "status": "sunsetted",
    "seniority": "regulation",
    "articles": [...],
    "enacted_at": "2026-03-01T14:00:00Z",
    "enacted_by_motion_uuid": "motion-uuid-456",
    "enacted_by_motion_title": "Motion to Establish Emergency Meeting Trial",
    "sunset_at": "2026-12-31T23:59:59Z"
  }
}
```

### Repealed Document Example
```json
{
  "content": {
    "status": "repealed",
    "seniority": "bylaw",
    "articles": [...],
    "enacted_at": "2025-06-01T10:00:00Z",
    "enacted_by_motion_uuid": "motion-uuid-789",
    "enacted_by_motion_title": "Motion to Enact Membership Bylaw",
    "repealed_at": "2026-04-15T16:30:00Z",
    "repealed_by_motion_uuid": "motion-uuid-999",
    "repealed_by_motion_title": "Motion to Repeal Outdated Membership Rules"
  }
}
```

## Notes
- **Clean break**: No legacy compatibility - update all code paths
- Test with fresh documents after implementation
- Update all creation/edit logic to populate denormalized title fields
- Remove legacy converter functions (toLegacyDocument, fromLegacyDocument)
- Simplify code by removing backward compatibility layers
