# Mail App Component Library

**Last Updated:** May 21, 2026  
**Status:** Production Ready

## Overview

The mail app component library provides reusable, well-tested components for building mail interface features. All components follow single responsibility principle, use design tokens, and are fully typed with TypeScript.

---

## Component Organization

```
lib/components/
├── thread/          # Message thread display (5 components)
├── compose/         # Message composition (4 components)
├── search/          # Search interface (4 components)
├── contacts/        # Contact management (3 components)
├── labels/          # Label management (3 components)
├── templates/       # Template management (3 components)
└── shared/          # Generic utilities (4 components)
```

**Total:** 26 components organized by feature area

---

## Component Groups

### Thread Components
Display message threads with rich interactions.

- [MessageCard](./thread.md#messagecard) - Individual message display with actions
- [ThreadLabels](./thread.md#threadlabels) - Thread label management
- [ReplyForm](./thread.md#replyform) - Quick reply interface
- [MessageAttachments](./thread.md#messageattachments) - File attachment display
- [ReportPanel](./thread.md#reportpanel) - Message reporting form

### Compose Components
Message composition and editing.

- [AttachmentsSection](./compose.md#attachmentssection) - File upload and management
- [RecipientFields](./compose.md#recipientfields) - To/CC/BCC inputs with groups
- [TemplateSelector](./compose.md#templateselector) - Template picker
- [AutosaveIndicator](./compose.md#autosaveindicator) - Draft save status

### Search Components
Message search and filtering.

- [SearchBar](./search.md#searchbar) - Main search input
- [SearchFilters](./search.md#searchfilters) - Advanced filter controls
- [SearchResultCard](./search.md#searchresultcard) - Single result display
- [SearchResults](./search.md#searchresults) - Results list with pagination

### Contact Components
Contact group management.

- [ContactGroupCard](./contacts.md#contactgroupcard) - Group display and editing
- [ContactGroupForm](./contacts.md#contactgroupform) - Group creation form
- [ContactGroupList](./contacts.md#contactgrouplist) - List of groups

### Label Components
Label creation and management.

- [LabelCard](./labels.md#labelcard) - Label display with actions
- [LabelForm](./labels.md#labelform) - Label creation/editing form
- [LabelList](./labels.md#labellist) - List of labels

### Template Components
Message template management.

- [TemplateCard](./templates.md#templatecard) - Template display with preview
- [TemplateForm](./templates.md#templateform) - Template creation/editing
- [TemplateList](./templates.md#templatelist) - List of templates

### Shared Components
Generic utilities used across features.

- [ContextBadge](./shared.md#contextbadge) - Context indicator
- [ContextSwitcher](./shared.md#contextswitcher) - Context selection
- [MarkdownEditor](./shared.md#markdowneditor) - Markdown input
- [MarkdownRenderer](./shared.md#markdownrenderer) - Markdown display

---

## Design Principles

### 1. Single Responsibility
Each component has one clear purpose:
- ✅ MessageCard displays a single message
- ✅ SearchBar handles search input only
- ✅ LabelForm manages label creation/editing

### 2. Composition Over Inheritance
Build complex UIs by composing simple components:
```svelte
<SearchResults>
  <SearchResultCard /> <!-- Composed -->
</SearchResults>
```

### 3. Props > State
Components receive data via props, manage minimal internal state:
- Data flows down (props)
- Events flow up (callbacks)
- Parent components orchestrate logic

### 4. Type Safety
All components are fully typed:
- Props interfaces defined
- Events typed
- TypeScript enforced at compile time

### 5. Design Token Usage
Components use CSS custom properties:
- No hardcoded colors
- Consistent spacing
- Themeable via token overrides

---

## Usage Patterns

### Basic Component Import
```typescript
import { MessageCard } from '$lib/components/thread/MessageCard.svelte';
import { SearchBar } from '$lib/components/search/SearchBar.svelte';
```

### Props and Binding
```svelte
<script>
  let query = $state('');
  
  function handleSearch() {
    // Handle search
  }
</script>

<SearchBar 
  bind:query={query}
  onSubmit={handleSearch}
/>
```

### Two-Way Binding with $bindable
```svelte
<!-- Component definition -->
let { value = $bindable('') } = $props();

<!-- Usage -->
<Component bind:value={myValue} />
```

### Event Callbacks
```svelte
<MessageCard
  {message}
  onReply={(msg) => handleReply(msg)}
  onForward={(msg) => handleForward(msg)}
/>
```

---

## Common Patterns

### List + Item Pattern
Many features use a list container with item components:

```svelte
<LabelList {labels} onEdit={handleEdit}>
  <!-- Internally renders -->
  <LabelCard /> <!-- for each label -->
</LabelList>
```

### Form + Display Pattern
Toggling between view and edit modes:

```svelte
{#if editing}
  <LabelForm bind:name bind:color onCancel={cancel} />
{:else}
  <LabelCard {label} onEdit={() => editing = true} />
{/if}
```

### Empty States
Components handle empty states gracefully:

```svelte
<SearchResults {results}>
  <!-- Shows EmptyState when results.length === 0 -->
</SearchResults>
```

---

## Component Guidelines

### Creating New Components

1. **Identify Single Responsibility**
   - Component should do one thing well
   - If it's doing too much, split it

2. **Define Props Interface**
   ```typescript
   let {
     data,
     onAction,
     variant = 'default'
   }: {
     data: DataType;
     onAction: (item: DataType) => void;
     variant?: 'default' | 'compact';
   } = $props();
   ```

3. **Use Design Tokens**
   ```css
   background: var(--color-surface);
   padding: var(--space-4);
   border-radius: var(--radius);
   ```

4. **Handle Loading/Empty States**
   - Show appropriate feedback
   - Use EmptyState component
   - Display loading indicators

5. **Keep Under 150 Lines**
   - Target: < 150 lines per component
   - Maximum: 300 lines
   - If larger, consider splitting

### Naming Conventions

- **PascalCase** for component files: `MessageCard.svelte`
- **Descriptive names**: What it displays/does
- **Avoid generic names**: Use `MessageCard` not `Card`
- **Group by feature**: Place in appropriate directory

### File Organization

```
component-name/
├── ComponentName.svelte     # Main component
└── types.ts                 # Optional: complex types
```

Or for feature groups:
```
feature/
├── FeatureList.svelte
├── FeatureCard.svelte
└── FeatureForm.svelte
```

---

## Testing Components

### Unit Tests (Vitest)
Test component logic and rendering:

```typescript
import { render } from '@testing-library/svelte';
import MessageCard from './MessageCard.svelte';

test('MessageCard displays message content', () => {
  const { getByText } = render(MessageCard, {
    props: { message: mockMessage }
  });
  
  expect(getByText(mockMessage.body)).toBeInTheDocument();
});
```

### Integration Tests (Playwright)
Test user flows with components:

```typescript
test('user can reply to message', async ({ page }) => {
  await page.goto('/thread/123');
  await page.click('[data-testid="reply-button"]');
  await page.fill('[name="body"]', 'Reply content');
  await page.click('button:has-text("Send")');
  
  await expect(page.locator('.message-card').last())
    .toContainText('Reply content');
});
```

---

## Performance Considerations

### Component Size
- Most components: < 150 lines
- Largest component: MessageCard (276 lines)
- Average: ~100 lines per component

### Re-rendering Optimization
- Use `$derived` for computed values
- Minimize state in components
- Let parent control data flow

### Bundle Size
- Components are tree-shakeable
- Only imported components are bundled
- No barrel exports (use direct imports)

---

## Accessibility

All components follow accessibility best practices:

- ✅ Semantic HTML elements
- ✅ ARIA labels where needed
- ✅ Keyboard navigation support
- ✅ Focus management
- ✅ Screen reader friendly
- ✅ Color contrast compliance

---

## Migration Guide

### From Legacy Code

**Before (Monolithic):**
```svelte
<!-- 732-line thread page -->
<div class="thread">
  <!-- All markup inline -->
  <!-- All styles inline -->
  <!-- All logic mixed together -->
</div>
```

**After (Componentized):**
```svelte
<!-- 128-line thread page -->
<script>
  import { MessageCard, ThreadLabels, ReplyForm } from '$lib/components/thread';
</script>

<MessageCard {message} />
<ThreadLabels {labels} />
<ReplyForm {thread} />
```

**Benefits:**
- 82% size reduction
- Reusable components
- Easier testing
- Better maintainability

---

## Resources

- [Thread Components](./thread.md) - Message display components
- [Compose Components](./compose.md) - Composition interface
- [Search Components](./search.md) - Search functionality
- [Contact Components](./contacts.md) - Contact management
- [Label Components](./labels.md) - Label management
- [Template Components](./templates.md) - Template management
- [Usage Examples](./usage-examples.md) - Common patterns and recipes
- [Design System](../design_system.md) - Design tokens and styling

---

## Contributing

### Adding New Components

1. Create component in appropriate feature directory
2. Follow naming conventions
3. Document props and events
4. Add usage examples
5. Write tests
6. Update this README

### Modifying Existing Components

1. Check existing usages first
2. Maintain backwards compatibility if possible
3. Update documentation
4. Update tests
5. Verify no breaking changes

---

## Support

For questions or issues:
- Check component documentation
- Review usage examples
- Consult design system docs
- Ask in team chat

---

**Version:** 1.0.0  
**Last Review:** May 21, 2026  
**Maintainers:** BFS Mail Team
