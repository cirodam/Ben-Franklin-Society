# Select & Modal Component Usage Guide

## New Components Available

Two new components have been added to the `@bfs/ui` package:

1. **Select** - Dropdown select with error/hint support
2. **Modal** - Dialog overlay with backdrop

---

## Select Component

### Basic Usage

```svelte
<script>
  import { Select } from '@bfs/ui';
  
  let status = $state('');
</script>

<Select bind:value={status} name="status">
  <option value="">Select status...</option>
  <option value="active">Active</option>
  <option value="inactive">Inactive</option>
</Select>
```

### With FormField

```svelte
<FormField label="Account Type">
  <Select bind:value={accountType} name="account_type" required>
    <option value="">Choose an account type...</option>
    <option value="savings">Savings Account</option>
    <option value="checking">Checking Account</option>
    <option value="business">Business Account</option>
  </Select>
</FormField>
```

### With Error State

```svelte
<Select 
  bind:value={category}
  name="category" 
  error={form?.errors?.category}
  required
>
  <option value="">Select category...</option>
  <option value="urgent">Urgent</option>
  <option value="normal">Normal</option>
  <option value="low">Low Priority</option>
</Select>
```

### With Hint

```svelte
<Select 
  bind:value={role}
  name="role"
  hint="This determines user permissions"
>
  <option value="">Select role...</option>
  <option value="admin">Administrator</option>
  <option value="member">Member</option>
  <option value="viewer">Viewer</option>
</Select>
```

### Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `name` | string | undefined | Form field name |
| `value` | string \| number | '' | Bindable selected value |
| `disabled` | boolean | false | Disable the select |
| `required` | boolean | false | Mark as required |
| `error` | string | undefined | Error message to display |
| `hint` | string | undefined | Helper text to display |
| `children` | Snippet | required | Option elements |

---

## Modal Component

### Basic Usage

```svelte
<script>
  import { Modal, Button } from '@bfs/ui';
  
  let showModal = $state(false);
</script>

<Button onclick={() => showModal = true}>
  Open Modal
</Button>

<Modal bind:open={showModal} title="Confirm Action">
  <p>Are you sure you want to proceed?</p>
</Modal>
```

### With Footer Actions

```svelte
<script>
  import { Modal, Button } from '@bfs/ui';
  
  let showDeleteModal = $state(false);
  
  function confirmDelete() {
    // Perform delete action
    showDeleteModal = false;
  }
</script>

<Modal 
  bind:open={showDeleteModal} 
  title="Delete Item"
  onclose={() => console.log('Modal closed')}
>
  <p>This action cannot be undone. Are you sure you want to delete this item?</p>
  
  {#snippet footer()}
    <Button variant="secondary" onclick={() => showDeleteModal = false}>
      Cancel
    </Button>
    <Button variant="danger" onclick={confirmDelete}>
      Delete
    </Button>
  {/snippet}
</Modal>
```

### Different Sizes

```svelte
<!-- Small modal -->
<Modal bind:open={showSmall} title="Small Dialog" size="sm">
  <p>This is a small modal (400px).</p>
</Modal>

<!-- Medium modal (default) -->
<Modal bind:open={showMedium} title="Medium Dialog" size="md">
  <p>This is a medium modal (600px).</p>
</Modal>

<!-- Large modal -->
<Modal bind:open={showLarge} title="Large Dialog" size="lg">
  <p>This is a large modal (900px).</p>
</Modal>
```

### Form in Modal

```svelte
<script>
  import { enhance } from '$app/forms';
  import { Modal, Button, FormField, Input, Select } from '@bfs/ui';
  
  let showForm = $state(false);
</script>

<Modal bind:open={showForm} title="Create New Item">
  <form method="POST" use:enhance>
    <FormField label="Name">
      <Input name="name" placeholder="Enter name..." required />
    </FormField>
    
    <FormField label="Category">
      <Select name="category" required>
        <option value="">Choose...</option>
        <option value="a">Category A</option>
        <option value="b">Category B</option>
      </Select>
    </FormField>
  </form>
  
  {#snippet footer()}
    <Button variant="secondary" onclick={() => showForm = false}>
      Cancel
    </Button>
    <Button type="submit">
      Create
    </Button>
  {/snippet}
</Modal>
```

### Without Title (Custom Header)

```svelte
<Modal bind:open={showCustom}>
  <div style="text-align: center;">
    <h2>Custom Header</h2>
    <p>You can omit the title prop and build your own header.</p>
  </div>
  
  {#snippet footer()}
    <Button onclick={() => showCustom = false}>
      Close
    </Button>
  {/snippet}
</Modal>
```

### Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `open` | boolean | false | Bindable - controls modal visibility |
| `title` | string | undefined | Optional modal title in header |
| `onclose` | () => void | undefined | Callback when modal closes |
| `size` | 'sm' \| 'md' \| 'lg' | 'md' | Modal width |
| `children` | Snippet | required | Modal body content |
| `footer` | Snippet | undefined | Optional footer with actions |

### Features

- **ESC key to close** - Press Escape to dismiss
- **Click outside to close** - Click backdrop to dismiss
- **Focus trap** - Uses native `<dialog>` element
- **Animated** - Smooth fade-in animation
- **Accessible** - Proper ARIA attributes and roles
- **Responsive** - Adapts to mobile screens

---

## Migration Examples

### Before: Custom Select Styling

```svelte
<select 
  class="select" 
  bind:value={filter}
  onchange={applyFilters}
>
  <option value="">All</option>
  <option value="active">Active</option>
  <option value="archived">Archived</option>
</select>

<style>
  .select {
    font-size: var(--text-sm);
    padding: var(--space-2) var(--space-3);
    border: 1px solid var(--color-border);
    border-radius: var(--radius);
    background: var(--color-surface);
    color: var(--color-text);
    cursor: pointer;
  }
</style>
```

### After: Using Select Component

```svelte
<script>
  import { Select } from '@bfs/ui';
</script>

<Select bind:value={filter} onchange={applyFilters}>
  <option value="">All</option>
  <option value="active">Active</option>
  <option value="archived">Archived</option>
</Select>
```

**Removed:** 11 lines of CSS

---

### Before: Confirmation Dialog

```svelte
<script>
  let showConfirm = $state(false);
</script>

{#if showConfirm}
  <div class="overlay" onclick={() => showConfirm = false}>
    <div class="dialog" onclick={(e) => e.stopPropagation()}>
      <h2>Confirm Delete</h2>
      <p>Are you sure?</p>
      <div class="actions">
        <button onclick={() => showConfirm = false}>Cancel</button>
        <button class="danger" onclick={confirmAction}>Delete</button>
      </div>
    </div>
  </div>
{/if}

<style>
  .overlay {
    position: fixed;
    inset: 0;
    background: rgba(0,0,0,0.5);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 1000;
  }
  .dialog {
    background: white;
    padding: 2rem;
    border-radius: 8px;
    max-width: 500px;
  }
  .actions {
    display: flex;
    gap: 1rem;
    justify-content: flex-end;
    margin-top: 1rem;
  }
</style>
```

### After: Using Modal Component

```svelte
<script>
  import { Modal, Button } from '@bfs/ui';
  
  let showConfirm = $state(false);
</script>

<Modal bind:open={showConfirm} title="Confirm Delete">
  <p>Are you sure?</p>
  
  {#snippet footer()}
    <Button variant="secondary" onclick={() => showConfirm = false}>
      Cancel
    </Button>
    <Button variant="danger" onclick={confirmAction}>
      Delete
    </Button>
  {/snippet}
</Modal>
```

**Removed:** ~35 lines of CSS, backdrop/overlay logic, click-outside handling, focus management

---

## Updated Component Exports

```typescript
// packages/ui/src/index.ts
export { default as AccountFinder } from './AccountFinder.svelte';
export { default as Alert } from './Alert.svelte';
export { default as Badge } from './Badge.svelte';
export { default as Button } from './Button.svelte';
export { default as Card } from './Card.svelte';
export { default as DataTable } from './DataTable.svelte';
export { default as EmptyState } from './EmptyState.svelte';
export { default as FormField } from './FormField.svelte';
export { default as Input } from './Input.svelte';
export { default as Modal } from './Modal.svelte';      // ✨ NEW
export { default as PageHeader } from './PageHeader.svelte';
export { default as Select } from './Select.svelte';    // ✨ NEW
export { default as Textarea } from './Textarea.svelte';
```

---

## Next Steps

### Pages That Can Use Select:
- Motion archive filters (status/body filters)
- Directory filters (type filter)
- Associations filters (type/status)
- Any settings/config pages
- Form pages with dropdowns

### Pages That Can Use Modal:
- Delete confirmations (OIDC clients, bulletin posts, etc.)
- Detail views (expand member info, motion details)
- Quick edit forms
- Image/document previews
- Help/info dialogs

### Recommended Migrations:
1. Replace all filter `<select>` elements with `<Select>` component
2. Convert inline confirmation logic to `<Modal>` components
3. Build reusable confirmation modal wrapper for common delete actions
