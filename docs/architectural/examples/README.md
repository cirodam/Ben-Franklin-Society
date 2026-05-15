# Organization Chart Examples

This directory contains example organization charts in JSON format that can be imported into the Ben Franklin Society governance system.

## Format Overview

Each org chart JSON file includes:

### Top-Level Structure
- **version**: Format version (currently "1.0")
- **association**: Metadata about the association (handle, name, type)
- **exported_at**: Timestamp of export
- **sections**: Array of organizational sections/divisions
- **templates**: Array of reusable role templates
- **roles**: Array of specific role positions

### Design Philosophy
The format uses **human-readable string IDs** rather than UUIDs to remain implementation-agnostic. IDs follow these conventions:
- Sections: `section-{name-slug}` (e.g., `section-supply`)
- Templates: `template-{key}` (e.g., `template-section-chief`)
- Roles: `role-{title-slug}` (e.g., `role-food-officer`)
- People (in assignments): `person-{name-slug}` (e.g., `person-alice-cooper`)

This makes files readable, portable, and easy to edit by hand.

## Using Org Charts

### Exporting an Org Chart

From any association page with permissions, click the "📥 Export JSON" button in the Organization section. This downloads the complete org structure including:
- All sections with hierarchies
- All role templates with permissions
- All roles with assignments and reporting relationships

### Importing an Org Chart

1. Click "📤 Import JSON" on an association page
2. Paste the JSON content from a file like this one
3. Click "Import"

The system will create:
- All sections (relationships are mapped)
- All role templates with their permissions
- All roles with their reporting hierarchies

**Note**: Existing person assignments are not imported (only structure). You'll need to assign people to roles after importing.

## Example: Food Service

See `food-service-org-chart.json` for a complete example including:

### Sections
- **Supply**: Procurement, storage, inventory
- **Processing**: Kitchens, meal preparation
- **Distribution**: Delivery and meal service
- **Quality**: Food safety and compliance

### Templates
Reusable role definitions:
- **Section Chief** (ƒ2,200): Standard section leadership role
- **Kitchen Worker** (ƒ100): Entry-level kitchen position
- **Delivery Driver** (ƒ120): Meal delivery position

### Roles
15 specific positions organized hierarchically:

```
Food Officer (ƒ3,000)
├── Supply Section Chief (ƒ2,200)
│   ├── Warehouse Manager (ƒ1,600)
│   └── Procurement Specialist (ƒ1,400)
├── Processing Section Chief (ƒ2,200) [FILLED: Alice Cooper]
│   ├── Head Chef (ƒ1,500)
│   │   ├── Kitchen Worker (ƒ100)
│   │   └── Kitchen Worker (ƒ100) [FILLED: Bob Smith]
├── Distribution Section Chief (ƒ2,200)
│   ├── Delivery Coordinator (ƒ1,400)
│   │   ├── Delivery Driver (ƒ120)
│   │   ├── Delivery Driver (ƒ120)
│   │   └── Delivery Driver (ƒ120)
└── Quality Section Chief (ƒ2,200)
    └── Food Safety Inspector (ƒ1,300)
```

### Budget
Total compensation: **ƒ20,180** for 15 roles

## Customizing for Your Association

To adapt this for your own association:

1. **Update association metadata** at the top
2. **Modify sections** to match your organizational structure
3. **Define templates** for commonly reused roles
4. **Add specific roles** with appropriate:
   - Reporting relationships (`reports_to_role_id`)
   - Section assignments (`section_id`)
   - Template inheritance (`template_id`)
   - Compensation levels (`compensation_franks`)
   - Permissions arrays

## Best Practices

### Templates vs. Inline Roles
- Use **templates** for standardized positions that appear multiple times (e.g., "Driver", "Clerk")
- Use **inline roles** (no template) for unique leadership positions

### Compensation Philosophy
The example uses a tiered approach:
- **Level 1** (Chief Officers): ƒ3,000
- **Level 2** (Section Chiefs): ƒ2,200
- **Level 3** (Specialists/Coordinators): ƒ1,300-1,600
- **Level 4** (Workers/Drivers): ƒ100-120

Adjust based on your community's economic conditions and labor requirements.

### Section Structure
- Keep sections focused on clear functional areas
- Use parent-child section relationships for large organizations
- Section descriptions should explain the mission and scope

### Permissions
Common permission patterns:
- `view_operations`: All staff members
- `manage_section`: Section leadership
- `manage_service`: Top executive only
- `assign_roles`: Top executive and HR
- Functional permissions: `manage_inventory`, `conduct_inspections`, etc.

## Migration from Seed Data

If you're running a fresh setup, the system already seeds org charts for:
- Food Service
- Community Bank
- Central Bank
- Treasury
- Commerce Service
- Communications Service
- Agricultural Service
- Energy Service
- General Assembly

You can export any of these for reference or modification.
