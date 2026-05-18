# Document Type Registry

This directory contains the formalized document type system for the library.

## Architecture

Each document type (governing, motion, budget, report, etc.) is defined by a `DocumentTypeConfig` that specifies:
- **Display properties**: label, plural label, icon
- **Routing**: how to generate detail page URLs
- **Permissions**: who can create, edit, view
- **Display logic**: subtitles, status badges, etc.

## Files

- `registry.ts` - Core registry class and interface
- `index.ts` - Registers all types and exports the registry
- `types/` - Individual document type configurations
  - `governing.ts` - Governing documents
  - `motion.ts` - Motions
  - `budget.ts` - Budgets (future)
  - `report.ts` - Reports (future)

## Adding a New Document Type

### 1. Create the Type Config

Create a new file in `types/`, e.g., `types/budget.ts`:

\`\`\`typescript
import type { DocumentTypeConfig } from '../registry.js';
import type { BudgetDocument } from '$lib/server/library-types.js';

export const budgetDocType: DocumentTypeConfig<BudgetDocument['content']> = {
  type: 'budget',
  label: 'Budget',
  pluralLabel: 'Budgets',
  icon: '💰',
  
  statuses: ['draft', 'proposed', 'adopted', 'enacted'] as const,
  
  detailRoute: (doc) => \`/budgets/\${doc.uuid}\`,
  
  getSubtitle: (doc) => {
    // Custom subtitle logic
    if ('metadata' in doc && doc.metadata?.fiscal_year) {
      return \`FY \${doc.metadata.fiscal_year}\`;
    }
    return 'Budget';
  },
  
  getStatusClass: (status) => \`status--\${status}\`,
  
  canCreate: () => true, // Add permission checks
  canEdit: (person, doc) => doc.content.status === 'draft',
  canView: () => true,
};
\`\`\`

### 2. Register the Type

Add it to `index.ts`:

\`\`\`typescript
import { budgetDocType } from './types/budget.js';

// Register all document types
documentTypes.register(governingDocType);
documentTypes.register(motionDocType);
documentTypes.register(budgetDocType); // <-- Add this

// Export
export { budgetDocType } from './types/budget.js';
\`\`\`

### 3. Use in Code

The registry automatically handles:

\`\`\`typescript
import { documentTypes } from '$lib/document-types';

// Get icon
const icon = documentTypes.getIcon('budget'); // '💰'

// Get detail route
const route = documentTypes.getDetailRoute(doc); // '/budgets/abc-123'

// Get display subtitle
const subtitle = documentTypes.getSubtitle(doc); // 'FY 2026'

// Get all types for filtering
const allTypes = documentTypes.getAllTypes(); // ['governing', 'motion', 'budget']
\`\`\`

## Benefits

1. **Single Source of Truth** - All document types defined in one place
2. **Type Safety** - TypeScript knows all valid document types
3. **Easy to Add** - New types are just configuration objects
4. **Consistent Patterns** - All types follow same structure
5. **DRY Code** - Shared logic for routing, display, permissions

## Future Enhancements

- Lazy-loaded viewer/editor components
- Document type versioning
- Type-specific validation schemas
- Workflow state machines
- Custom search filters per type
