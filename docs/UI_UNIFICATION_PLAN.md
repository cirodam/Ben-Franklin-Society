# BFS UI Styling Unification Plan

## Current State Assessment

### ✅ What's Working Well
- **Design tokens** - Solid foundation in `packages/ui/src/theme.css` with CSS custom properties
- **Consistent imports** - All apps import `@bfs/ui/src/theme.css` in their root layout
- **Clean aesthetic** - Minimal, professional design language
- **Component foundation** - Started shared components (Button, Badge, DataTable, FormField, AccountFinder)

### 🔴 Pain Points & Inconsistencies
- **Component duplication** - Each app reimplements buttons, forms, cards with slightly different styles
- **Inconsistent patterns** - Similar UI elements (e.g., sidebar navigation) have different implementations
- **Underutilized shared components** - Apps define local styles instead of using `@bfs/ui` components
- **No layout components** - Common structures (page containers, sidebars, headers) duplicated across apps
- **Manual color application** - Direct color values in styles instead of semantic tokens

---

## Design System Goals

1. **Single Source of Truth** - All visual decisions documented and enforced through shared components
2. **Efficiency** - Build features faster by assembling from pre-built, tested components
3. **Consistency** - Users experience the same patterns across all BFS apps
4. **Maintainability** - Fix bugs once, update designs once
5. **Accessibility** - Bake in ARIA and keyboard support at the component level

---

## Phase 1: Foundation & Core Components (Week 1)

### Expand Design Tokens

**Add semantic color tokens** to `packages/ui/src/theme.css`:
```css
/* Semantic colors */
--color-link: var(--color-accent);
--color-link-hover: var(--color-accent-hover);
--color-focus-ring: var(--color-accent-subtle);

--color-input-bg: var(--color-surface);
--color-input-border: var(--color-border);
--color-input-border-focus: var(--color-accent);
--color-input-text: var(--color-text);
--color-input-placeholder: var(--color-text-subtle);

--color-card-bg: var(--color-surface);
--color-card-border: var(--color-border);

--color-nav-bg: var(--color-surface);
--color-nav-border: var(--color-border);
--color-nav-link: var(--color-text);
--color-nav-link-hover: var(--color-accent);
--color-nav-link-active: var(--color-accent);
```

**Add layout tokens**:
```css
/* Layout */
--sidebar-width: 240px;
--header-height: 64px;
--container-max: 1200px;
--container-narrow: 640px;

/* Z-index scale */
--z-dropdown: 100;
--z-sticky: 200;
--z-modal-backdrop: 300;
--z-modal: 400;
--z-toast: 500;
```

### Complete Core Component Library

**Priority components to add:**

1. **Input.svelte** - Text input with focus states, error states
2. **Select.svelte** - Dropdown select with custom styling
3. **Textarea.svelte** - Multi-line text input
4. **Checkbox.svelte** - Custom checkbox with label
5. **Radio.svelte** - Radio button group
6. **Card.svelte** - Content container with consistent padding/border
7. **Alert.svelte** - Success/warning/error/info messages
8. **EmptyState.svelte** - "No results" placeholder
9. **Spinner.svelte** - Loading indicator
10. **Modal.svelte** - Dialog overlay

**Component API consistency:**
- All form inputs accept `name`, `value`, `disabled`, `required`
- All components support `class` prop for additional styling
- Size variants: `sm`, `md` (default), `lg`
- Semantic variants: `default`, `primary`, `danger`, `success`, `warning`

---

## Phase 2: Layout Components (Week 2)

### App Shell Components

**AppShell.svelte** - Top-level layout wrapper:
```svelte
<AppShell>
  <Sidebar slot="sidebar">...</Sidebar>
  <Header slot="header">...</Header>
  <slot />
</AppShell>
```

**Sidebar.svelte** - Consistent navigation sidebar:
```svelte
<Sidebar appName="BFS Community Bank" userHandle="@alice">
  <SidebarNav>
    <SidebarLink href="/" icon="home">Home</SidebarLink>
    <SidebarLink href="/history">History</SidebarLink>
    <SidebarSection title="Admin">
      <SidebarLink href="/admin">Settings</SidebarLink>
    </SidebarSection>
  </SidebarNav>
</Sidebar>
```

**PageHeader.svelte** - Page title with actions:
```svelte
<PageHeader title="Community Bulletin Board">
  <Button slot="actions" href="/bulletin/new">+ New Notice</Button>
</PageHeader>
```

**PageSection.svelte** - Content sections with optional titles:
```svelte
<PageSection title="Recent Activity">
  <DataTable ... />
</PageSection>
```

---

## Phase 3: Patterns & Utilities (Week 3)

### Common Pattern Components

1. **DataGrid.svelte** - Responsive card grid (extends DataTable for card views)
2. **DetailsRow.svelte** - Label/value pairs for detail pages
3. **StatusBadge.svelte** - Status indicators with color coding
4. **Avatar.svelte** - User/entity avatars with fallbacks
5. **Breadcrumbs.svelte** - Navigation breadcrumbs
6. **Tabs.svelte** - Tab navigation
7. **Pagination.svelte** - Page controls for lists
8. **ConfirmDialog.svelte** - Confirmation modal for destructive actions
9. **Toast.svelte** - Temporary notifications

### Utility Classes

Add to `packages/ui/src/theme.css`:
```css
/* Utility classes */
.stack { display: flex; flex-direction: column; gap: var(--space-4); }
.row { display: flex; align-items: center; gap: var(--space-3); }
.cluster { display: flex; flex-wrap: wrap; gap: var(--space-2); }

.text-muted { color: var(--color-text-muted); }
.text-subtle { color: var(--color-text-subtle); }
.text-danger { color: var(--color-danger); }

.truncate { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.nowrap { white-space: nowrap; }

.sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0,0,0,0);
  white-space: nowrap;
  border: 0;
}
```

---

## Phase 4: Migration & Refactoring (Week 4)

### Migration Strategy

**Step 1: Audit Current Usage**
- Create inventory of all unique UI patterns across apps
- Document which components are being duplicated
- Identify quick wins (easy conversions)

**Step 2: Migrate by Priority**
- **High**: Forms and buttons (most frequently used)
- **Medium**: Cards, tables, navigation
- **Low**: Special-purpose components

**Step 3: Incremental Replacement**
- Migrate one page/route at a time
- Update imports to use `@bfs/ui` components
- Remove local style duplicates
- Test thoroughly

**Example migration:**

Before:
```svelte
<button type="submit" class="login-btn">Sign in</button>

<style>
.login-btn {
  width: 100%;
  font-family: var(--font-sans);
  font-size: var(--text-sm);
  /* ... 15 more lines ... */
}
</style>
```

After:
```svelte
<script>
  import { Button } from '@bfs/ui';
</script>

<Button type="submit" variant="primary" fullWidth>Sign in</Button>
```

### App-Specific Customization

**Create app-specific theme files** for branding:

`apps/governance/src/theme-overrides.css`:
```css
:root {
  --app-accent: #2d5fa3; /* Governance blue */
}
```

`apps/community-bank/src/theme-overrides.css`:
```css
:root {
  --app-accent: #2a7a3b; /* Bank green */
}
```

Import after base theme in layout:
```svelte
import '@bfs/ui/src/theme.css';
import './theme-overrides.css';
```

---

## Phase 5: Documentation (Ongoing)

### Component Documentation

**Create `packages/ui/README.md`** with:
- Component catalog with screenshots
- Props documentation
- Usage examples
- Accessibility notes

**Use Storybook or similar** for interactive docs:
```bash
pnpm add -D @storybook/sveltekit
```

### Style Guide

Document:
- When to use which component variant
- Layout patterns for common page types
- Color usage guidelines (semantic meanings)
- Typography scale and when to use each size
- Spacing system and when to use which scale

---

## Implementation Checklist

### Week 1: Foundation
- [ ] Expand design tokens in theme.css
- [ ] Create Input.svelte
- [ ] Create Select.svelte
- [ ] Create Textarea.svelte
- [ ] Create Checkbox.svelte
- [ ] Create Radio.svelte
- [ ] Create Card.svelte
- [ ] Create Alert.svelte
- [ ] Create EmptyState.svelte
- [ ] Create Spinner.svelte
- [ ] Create Modal.svelte
- [ ] Update existing Button component with fullWidth prop

### Week 2: Layouts
- [ ] Create AppShell.svelte
- [ ] Create Sidebar.svelte components
- [ ] Create PageHeader.svelte
- [ ] Create PageSection.svelte
- [ ] Migrate governance app layout
- [ ] Migrate community-bank app layout
- [ ] Migrate mail app layout
- [ ] Migrate marketplace app layout

### Week 3: Patterns
- [ ] Create DataGrid.svelte
- [ ] Create DetailsRow.svelte
- [ ] Create StatusBadge.svelte
- [ ] Create Avatar.svelte
- [ ] Create Breadcrumbs.svelte
- [ ] Create Tabs.svelte
- [ ] Create Pagination.svelte
- [ ] Create ConfirmDialog.svelte
- [ ] Create Toast.svelte
- [ ] Add utility classes to theme.css

### Week 4: Migration
- [ ] Audit all components across apps
- [ ] Migrate login pages
- [ ] Migrate form pages
- [ ] Migrate list/table pages
- [ ] Migrate detail pages
- [ ] Remove duplicate local styles
- [ ] Verify consistency across apps
- [ ] Performance audit

### Ongoing: Documentation
- [ ] Set up component documentation system
- [ ] Document all components with examples
- [ ] Create style guide
- [ ] Add visual regression testing

---

## Success Metrics

- **Code reduction**: 30-40% less CSS across app codebase
- **Consistency**: 100% of common patterns use shared components
- **Development speed**: New features built 50% faster with component library
- **Maintainability**: Single-digit bug fixes affect all apps
- **Accessibility**: All components WCAG 2.1 AA compliant

---

## Future Enhancements

### Advanced Components
- Rich text editor
- Date/time pickers
- File upload with preview
- Sortable/draggable lists
- Charts and data visualization
- Virtual scrolling for large lists

### Theming System
- Dark mode support
- User preference persistence
- High contrast mode
- Configurable color schemes per society

### Animation System
- Consistent transitions
- Loading states
- Page transitions
- Micro-interactions

### Responsive Utilities
- Breakpoint system
- Mobile-first utilities
- Responsive visibility classes
